#!/usr/bin/env node
'use strict';
// usage-real.js — captura o /usage OFICIAL do Claude Code via tmux. 0 token.
// Dirige um `claude` efêmero num pseudo-terminal, manda /usage, raspa o painel
// (o "38% used" é TEXTO literal), parseia e cacheia em ~/.claude/.usage-real.json.
// O número da "Current session" é a janela global de 5h — por isso uma sessão
// efêmera recém-aberta ($0.00) já reporta o seu uso real.
//
// Modos:
//   node usage-real.js --scrape   -> 1 captura -> grava o cache
//   node usage-real.js --panel    -> painel ao vivo (redesenha 2s, re-scrape ~45s)
//   node usage-real.js --json     -> imprime o cache cru
//   node usage-real.js            -> imprime 1 resumo colorido (scrape se cache velho)

const { execSync, execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = process.env.HOME || os.homedir();
const DIR = path.join(HOME, '.claude');
const CACHE = path.join(DIR, '.usage-real.json');
const LOCK = path.join(DIR, '.usage-real.lock');
// dir confiável p/ não cair no diálogo de "trust" ao abrir o claude
const TRUSTED_DIR = process.env.USO_DIR || __dirname;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const have = c => { try { execSync('command -v ' + c, { stdio: 'ignore' }); return true; } catch (e) { return false; } };
const tmux = args => execFileSync('tmux', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
// mata qualquer sessão de scrape órfã (ex.: painel morto no meio de uma coleta)
function killStale() {
  try {
    tmux(['ls', '-F', '#{session_name}']).split('\n')
      .filter(n => /^usoreal_/.test(n))
      .forEach(n => { try { tmux(['kill-session', '-t', n]); } catch (e) {} });
  } catch (e) {}
}

// ---- cores ----
const dim = s => `\x1b[2m${s}\x1b[0m`;
const col = (s, c) => `\x1b[${c}m${s}\x1b[0m`;
const colorFor = p => p >= 80 ? 31 : p >= 50 ? 33 : 32;
function bar(pct, segs) {
  segs = segs || 10; pct = Math.max(0, Math.min(pct || 0, 100));
  const fill = Math.round(pct / 100 * segs);
  return col('█'.repeat(fill), colorFor(pct)) + dim('░'.repeat(segs - fill));
}

// ---- parse do painel /usage ----
function parsePane(txt) {
  const lines = (txt || '').split('\n').map(l => l.replace(/\s+$/, ''));
  const grab = label => {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(label)) {
        let pct = null, reset = null;
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const m = lines[j].match(/(\d+)% used/); if (m && pct === null) pct = +m[1];
          const r = lines[j].match(/Resets (.+?)\s*\(/); if (r && reset === null) reset = r[1].trim();
        }
        return { pct, reset };
      }
    }
    return null;
  };
  return {
    session: grab('Current session'),
    week_all: grab('Current week (all models)'),
    week_sonnet: grab('Current week (Sonnet only)'),
  };
}

// ---- captura (spawna claude efêmero) ----
async function scrape() {
  if (!have('tmux')) throw new Error('tmux não instalado');
  try { const st = fs.statSync(LOCK); if (Date.now() - st.mtimeMs < 30000) return readCache(); } catch (e) {}
  try { fs.writeFileSync(LOCK, String(Date.now())); } catch (e) {}
  const sess = 'usoreal_' + process.pid;
  const kill = () => { try { tmux(['kill-session', '-t', sess]); } catch (e) {} };
  try {
    killStale();
    tmux(['new-session', '-d', '-s', sess, '-x', '220', '-y', '55']);
    tmux(['send-keys', '-t', sess, `cd ${TRUSTED_DIR} && claude`, 'Enter']);
    // espera o claude ficar pronto (até ~30s) — marcadores SÓ do claude (não o ❯ do shell)
    let ready = false, lastP = '';
    for (let i = 0; i < 60; i++) {
      await sleep(500);
      let p = ''; try { p = tmux(['capture-pane', '-t', sess, '-p']); } catch (e) {}
      lastP = p;
      if (/Do you trust|trust the files/i.test(p)) { try { tmux(['send-keys', '-t', sess, 'Enter']); } catch (e) {} }
      if (/for agents|shift\+tab|\? for shortcuts|Try "|esc to interrupt/i.test(p)) { ready = true; break; }
    }
    if (!ready) throw new Error('claude não ficou pronto a tempo. Última tela:\n' + lastP.split('\n').filter(Boolean).slice(-8).join('\n'));
    tmux(['send-keys', '-t', sess, '/usage', 'Enter']);
    let pane = '';
    for (let i = 0; i < 25; i++) {
      await sleep(400);
      try { pane = tmux(['capture-pane', '-t', sess, '-p']); } catch (e) {}
      if (/% used/.test(pane)) break;
    }
    const data = parsePane(pane);
    if (!data.session && !data.week_all) throw new Error('não achei dados no painel /usage. Tela:\n' + pane.split('\n').filter(Boolean).slice(-12).join('\n'));
    const out = { ...data, ts: Date.now() };
    try { fs.writeFileSync(CACHE, JSON.stringify(out)); } catch (e) {}
    return out;
  } finally {
    kill();
    try { fs.unlinkSync(LOCK); } catch (e) {}
  }
}

function readCache() { try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch (e) { return null; } }

// ---- formatação ----
function oneLine(r, opts) {
  opts = opts || {};
  if (!r) return dim('/usage oficial: coletando… (1ª leitura ~10s)');
  const seg = opts.compact ? 6 : 8;
  const short = s => s ? s.replace(',', '').replace(/\s+/g, ' ').trim() : '';
  const cell = (label, o) => {
    if (!o || o.pct == null) return null;
    let s = label + ' ▕' + bar(o.pct, seg) + '▏ ' + col(o.pct + '%', colorFor(o.pct));
    if (o.reset) s += dim((opts.compact ? ' ⟳' : ' reseta ') + short(o.reset));
    return s;
  };
  const parts = [
    cell('sessão', r.session),
    cell('semana', r.week_all),
    (r.week_sonnet && r.week_sonnet.pct != null) ? dim('sonnet ' + r.week_sonnet.pct + '%') : null,
  ].filter(Boolean);
  const age = r.ts ? Math.round((Date.now() - r.ts) / 1000) : null;
  const ageStr = age == null ? '' : age < 60 ? age + 's' : Math.round(age / 60) + 'min';
  const head = col('/usage', '1;36') + dim(' oficial');
  const tail = age == null ? '' : dim('  ·  há ' + ageStr + (age > 600 ? ' ⚠' : ''));
  return head + '  ' + parts.join(dim('  ·  ')) + tail;
}

// ---- painel ao vivo ----
function panel() {
  let scraping = false;
  const maybeScrape = () => {
    const r = readCache();
    const stale = !r || !r.ts || (Date.now() - r.ts) > 45000;
    if (stale && !scraping) {
      scraping = true;
      scrape().catch(() => {}).then(() => { scraping = false; });
    }
  };
  process.stdout.write('\x1b[?1049h\x1b[?25l');
  const bye = () => { try { process.stdout.write('\x1b[?25h\x1b[?1049l'); } catch (e) {} try { killStale(); } catch (e) {} process.exit(0); };
  process.on('SIGINT', bye); process.on('SIGTERM', bye);
  const draw = () => {
    const r = readCache();
    const L = [];
    L.push(col(' ⛽ USO OFICIAL ', '1;46;30') + '  ' + dim('fonte: /usage · 0 token · ' + (scraping ? 'coletando…' : 'redesenha 2s')));
    L.push('');
    if (!r) {
      L.push('  ' + dim('coletando a 1ª leitura… (abre um claude efêmero, ~10s)'));
    } else {
      const row = (label, o) => {
        if (!o || o.pct == null) { L.push('  ' + dim(label + ': —')); return; }
        L.push('  ' + col(label, '1') + '  ▕' + bar(o.pct, 26) + '▏ ' + col(o.pct + '% used', colorFor(o.pct))
          + (o.reset ? dim('   reseta ' + o.reset) : ''));
      };
      row('Sessão 5h ', r.session);
      row('Semana    ', r.week_all);
      row('Sonnet wk ', r.week_sonnet);
      L.push('');
      const age = r.ts ? Math.round((Date.now() - r.ts) / 1000) : null;
      L.push('  ' + dim('dado de ' + (age == null ? '?' : age < 60 ? age + 's' : Math.round(age / 60) + 'min') + ' atrás · re-scrape ~45s · Ctrl+C sai'));
    }
    process.stdout.write('\x1b[H' + L.map(x => x + '\x1b[K').join('\n') + '\x1b[J');
  };
  maybeScrape(); draw();
  setInterval(() => { maybeScrape(); draw(); }, 2000);
}

// ---- CLI ----
if (require.main === module) {
  const a = process.argv[2];
  if (a === '--scrape') {
    scrape().then(r => { process.stdout.write(oneLine(r) + '\n'); process.exit(0); })
      .catch(e => { process.stderr.write('✗ ' + e.message + '\n'); process.exit(1); });
  } else if (a === '--panel') {
    panel();
  } else if (a === '--json') {
    process.stdout.write(JSON.stringify(readCache(), null, 2) + '\n');
  } else {
    const r = readCache();
    const stale = !r || !r.ts || (Date.now() - r.ts) > 120000;
    if (stale) scrape().then(x => process.stdout.write(oneLine(x) + '\n')).catch(e => process.stdout.write(dim('✗ ' + e.message) + '\n'));
    else process.stdout.write(oneLine(r) + '\n');
  }
}

module.exports = { scrape, readCache, oneLine, parsePane, bar, colorFor };
