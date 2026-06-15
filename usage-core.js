#!/usr/bin/env node
'use strict';
// usage-core.js — estima uso de SESSAO (bloco 5h) e SEMANA via ccusage.
// Metrica = custo-equivalente (USD): o "$" ponderado, melhor proxy do limite oficial.
// 100% local, NAO gasta token. Fonte canonica continua sendo /usage.
//
// Uso:
//   node usage-core.js                 -> imprime 1 linha (e atualiza cache)
//   node usage-core.js --cache         -> so atualiza o cache (p/ o statusline)
//   node usage-core.js --panel         -> painel ao vivo (1s) p/ terminal ao lado
//   node usage-core.js --calibrate-week <pct>     -> alinha % da semana ao /usage
//   node usage-core.js --calibrate-session <pct>  -> alinha % da sessao ao /usage
//   echo "texto" | node usage-core.js --tokens [ctx] -> estima tokens do texto (heuristica)

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

const HOME = process.env.HOME || require('os').homedir();
const DIR = path.join(HOME, '.claude');
const CEIL_FILE = path.join(DIR, 'usage-ceilings.json');
const CACHE_FILE = path.join(DIR, '.usage-cache.json');
const LOCK_FILE = path.join(DIR, '.usage-refresh.lock');

const NVM_BIN = path.dirname(process.execPath); // ccusage fica no mesmo bin do node
const ENV = { ...process.env, PATH: NVM_BIN + ':' + (process.env.PATH || '') };

const DEFAULT_CEIL = { sessionCost: 40, weekCost: 268.63 };

function getCeilings() {
  try { return { ...DEFAULT_CEIL, ...JSON.parse(fs.readFileSync(CEIL_FILE, 'utf8')) }; }
  catch (e) { return { ...DEFAULT_CEIL }; }
}
function saveCeilings(c) { fs.writeFileSync(CEIL_FILE, JSON.stringify(c, null, 2)); }

// ---- cores ----
const dim = s => `\x1b[2m${s}\x1b[0m`;
const col = (s, c) => `\x1b[${c}m${s}\x1b[0m`;
function colorFor(pct) { return pct >= 80 ? 31 : pct >= 50 ? 33 : 32; }
function bar(pct, segs) {
  segs = segs || 10;
  pct = Math.max(0, Math.min(pct || 0, 100));
  const fill = Math.round(pct / 100 * segs);
  return col('█'.repeat(fill), colorFor(pct)) + dim('░'.repeat(segs - fill));
}

// ---- ccusage ----
function ccusageSync(args) {
  const out = execSync('ccusage ' + args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: ENV, stdio: ['ignore', 'pipe', 'ignore'] });
  return JSON.parse(out);
}
function ccusageAsyncSafe(args) {
  return new Promise(res => {
    exec('ccusage ' + args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: ENV }, (err, stdout) => {
      if (err) return res(null);
      try { res(JSON.parse(stdout)); } catch (e) { res(null); }
    });
  });
}

function buildUsage(blocksJson, weeklyJson) {
  const ceil = getCeilings();
  let session = null, week = null;
  try {
    const blocks = (blocksJson && blocksJson.blocks) || [];
    const active = blocks.find(x => x.isActive);
    if (active) {
      const cost = active.costUSD || 0;
      session = {
        cost,
        pct: ceil.sessionCost ? cost / ceil.sessionCost * 100 : 0,
        burn: (active.burnRate && active.burnRate.costPerHour) || 0,
        proj: (active.projection && active.projection.totalCost) || null,
        endTime: active.endTime || null,
      };
    }
  } catch (e) {}
  try {
    const arr = (weeklyJson && weeklyJson.weekly) || [];
    // pega a semana mais recente (maior period), robusto a ordenacao
    const cur = arr.reduce((m, x) => (!m || (x.period || '') > (m.period || '')) ? x : m, null);
    if (cur) {
      const cost = cur.totalCost || 0;
      week = { cost, pct: ceil.weekCost ? cost / ceil.weekCost * 100 : 0, period: cur.period || '' };
    }
  } catch (e) {}
  return { session, week, ceil, ts: Date.now() };
}

function computeSync() {
  let b = null, w = null;
  try { b = ccusageSync('blocks --json'); } catch (e) {}
  try { w = ccusageSync('weekly --json'); } catch (e) {}
  return buildUsage(b, w);
}
function computeAsync() {
  return Promise.all([ccusageAsyncSafe('blocks --json'), ccusageAsyncSafe('weekly --json')])
    .then(([b, w]) => buildUsage(b, w));
}

// ---- formatacao ----
function oneLine(u) {
  if (!u || (!u.session && !u.week)) return dim('uso≈ indisponível (abra o painel p/ aquecer o cache)');
  const out = [dim('uso≈')];
  if (u.session) {
    const p = Math.round(u.session.pct);
    out.push('sessão ▕' + bar(u.session.pct, 8) + '▏ ' + col(p + '%', colorFor(u.session.pct)) + ' ' + dim('$' + u.session.cost.toFixed(1)));
  }
  if (u.week) {
    const p = Math.round(u.week.pct);
    out.push('semana ▕' + bar(u.week.pct, 8) + '▏ ' + col(p + '%', colorFor(u.week.pct)) + ' ' + dim('$' + u.week.cost.toFixed(0)));
  }
  return out.join(dim('  ·  '));
}

function fmtTime(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }); }
  catch (e) { return ''; }
}

// ---- cache (usado pelo statusline) ----
function readCache() { try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch (e) { return null; } }
function writeCache() {
  try { const st = fs.statSync(LOCK_FILE); if (Date.now() - st.mtimeMs < 15000) return readCache(); } catch (e) {}
  try { fs.writeFileSync(LOCK_FILE, String(Date.now())); } catch (e) {}
  const u = computeSync();
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(u)); } catch (e) {}
  try { fs.unlinkSync(LOCK_FILE); } catch (e) {}
  return u;
}

// ---- painel ao vivo (1s) ----
function panel() {
  let u = null, lastFetch = 0, fetching = false, loaded = false;
  const refetch = () => {
    if (fetching) return; fetching = true;
    computeAsync().then(r => { u = r; loaded = true; lastFetch = Date.now(); fetching = false; }).catch(() => { fetching = false; });
  };

  // tela alternativa + esconde cursor; restaura tudo ao sair (Ctrl+C)
  process.stdout.write('\x1b[?1049h\x1b[?25l');
  const bye = () => { try { process.stdout.write('\x1b[?25h\x1b[?1049l'); } catch (e) {} process.exit(0); };
  process.on('SIGINT', bye);
  process.on('SIGTERM', bye);

  const draw = () => {
    const L = [];
    L.push(col(' ⛽ USO AO VIVO ', '1;46;30') + '  ' + dim('≈ estimativa local · oficial: /usage'));
    L.push('');
    if (!loaded) {
      L.push('  ' + dim('carregando ccusage… (primeira leitura leva ~1s)'));
    } else {
      if (u && u.session) {
        const s = u.session;
        L.push('  ' + col('SESSÃO 5h', '1') + '  ▕' + bar(s.pct, 24) + '▏ ' + col(Math.round(s.pct) + '%', colorFor(s.pct)));
        L.push(dim('              $' + s.cost.toFixed(2) + ' de ~$' + u.ceil.sessionCost + '    burn $' + s.burn.toFixed(1) + '/h' + (s.proj ? '    projeção fim $' + s.proj.toFixed(0) : '') + (s.endTime ? '    bloco até ' + fmtTime(s.endTime) : '')));
      } else { L.push('  ' + dim('SESSÃO 5h: sem bloco ativo agora')); }
      L.push('');
      if (u && u.week) {
        const w = u.week;
        L.push('  ' + col('SEMANA   ', '1') + '  ▕' + bar(w.pct, 24) + '▏ ' + col(Math.round(w.pct) + '%', colorFor(w.pct)));
        L.push(dim('              $' + w.cost.toFixed(2) + ' de ~$' + u.ceil.weekCost));
      } else { L.push('  ' + dim('SEMANA: indisponível')); }
      L.push('');
      L.push('  ' + dim('atualizado há ' + Math.round((Date.now() - lastFetch) / 1000) + 's · refetch 5s · Ctrl+C sai'));
    }
    // cursor pro topo, limpa cada linha até o fim, e apaga o resto da tela
    process.stdout.write('\x1b[H' + L.map(x => x + '\x1b[K').join('\n') + '\x1b[J');
  };

  refetch();
  draw();
  setInterval(() => { if (!loaded || Date.now() - lastFetch >= 5000) refetch(); draw(); }, 1000);
}

// ---- CLI ----
if (require.main === module) {
  const a = process.argv[2];
  if (a === '--panel') { panel(); }
  else if (a === '--cache') { writeCache(); }
  else if (a === '--calibrate-week') {
    const pct = parseFloat(process.argv[3]); const u = computeSync();
    if (u.week && pct > 0) { const c = getCeilings(); c.weekCost = +(u.week.cost / (pct / 100)).toFixed(2); saveCeilings(c); console.log('✓ weekCost = $' + c.weekCost + '  (semana $' + u.week.cost.toFixed(2) + ' = ' + pct + '%)'); }
    else console.log('✗ sem dados de semana ou % inválida.');
  }
  else if (a === '--calibrate-session') {
    const pct = parseFloat(process.argv[3]); const u = computeSync();
    if (u.session && pct > 0) { const c = getCeilings(); c.sessionCost = +(u.session.cost / (pct / 100)).toFixed(2); saveCeilings(c); console.log('✓ sessionCost = $' + c.sessionCost + '  (sessão $' + u.session.cost.toFixed(2) + ' = ' + pct + '%)'); }
    else console.log('✗ sem bloco ativo ou % inválida.');
  }
  else if (a === '--tokens') {
    if (process.stdin.isTTY) {
      console.log('Uso: echo "seu texto" | node usage-core.js --tokens [ctxTokens]');
    } else {
      const text = fs.readFileSync(0, 'utf8');
      const chars = text.length;
      const words = (text.trim().match(/\S+/g) || []).length;
      const tokens = Math.round(chars / 4);
      const fmtN = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
      let out = chars + ' chars · ' + words + ' palavras · '
        + col('≈ ' + fmtN(tokens) + ' tokens', 36) + dim(' (heurística chars/4, ~±20%)');
      const ctx = parseInt(process.argv[3], 10);
      if (ctx > 0) {
        out += '\n' + dim('impacto: +' + (tokens / ctx * 100).toFixed(2)
          + '% no custo/msg (contexto ' + fmtN(ctx) + ') — e repago a cada turno');
      }
      process.stdout.write(out + '\n');
    }
  }
  else { const u = writeCache(); process.stdout.write(oneLine(u) + '\n'); }
}

module.exports = { computeSync, computeAsync, oneLine, bar, colorFor, readCache, writeCache };
