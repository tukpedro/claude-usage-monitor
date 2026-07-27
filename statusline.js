#!/usr/bin/env node
// Claude Code statusline — medidor de consumo (input por mensagem)
// Mostra: modelo · ⛽ tokens/msg + barra + faixa · % da janela · custo · linhas
// 100% local (lê o transcript). Nao gasta token.

const fs = require('fs');

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch (e) {}
let data = {};
try { data = JSON.parse(raw); } catch (e) {}

const model   = (((data.model && data.model.display_name) || 'Claude').replace(/\s*\([^)]*\)/g, '')).trim();
const modelId = (data.model && data.model.id) || '';
const cost    = (data.cost && data.cost.total_cost_usd) || 0;
const added   = (data.cost && data.cost.total_lines_added) || 0;
const removed = (data.cost && data.cost.total_lines_removed) || 0;
const transcript = data.transcript_path || '';

// --- contexto = input por mensagem ---
// Conta o ultimo turno do assistant DEPOIS do ultimo compact_boundary,
// ignorando subagentes (isSidechain). Assim o compact reflete na hora.
let ctxTokens = 0;
let justCompacted = false;
// --- duração da sessão: primeiro e último timestamp do transcript ---
let sessionStart = null;
let sessionEnd = null;
try {
  if (transcript && fs.existsSync(transcript)) {
    const lines = fs.readFileSync(transcript, 'utf8').split('\n');

    let lastBoundary = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i]) continue;
      let o; try { o = JSON.parse(lines[i]); } catch (e) { continue; }
      if (o.type === 'system' && o.subtype === 'compact_boundary') { lastBoundary = i; break; }
    }

    let found = -1;
    for (let i = lines.length - 1; i > lastBoundary; i--) {
      if (!lines[i]) continue;
      let o; try { o = JSON.parse(lines[i]); } catch (e) { continue; }
      if (o.isSidechain) continue; // ignora subagentes
      const u = o.message && o.message.usage;
      if (u && u.input_tokens != null) {
        ctxTokens = (u.input_tokens || 0)
                  + (u.cache_read_input_tokens || 0)
                  + (u.cache_creation_input_tokens || 0);
        found = i; break;
      }
    }
    if (found === -1 && lastBoundary >= 0) justCompacted = true;

    // primeiro timestamp (abertura) e último (atividade mais recente), ignorando sidechain
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i]) continue;
      let o; try { o = JSON.parse(lines[i]); } catch (e) { continue; }
      if (o.isSidechain) continue;
      if (o.timestamp) { sessionStart = o.timestamp; break; }
    }
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i]) continue;
      let o; try { o = JSON.parse(lines[i]); } catch (e) { continue; }
      if (o.isSidechain) continue;
      if (o.timestamp) { sessionEnd = o.timestamp; break; }
    }
  }
} catch (e) {}

const window = (/1m/i.test(modelId) || ctxTokens > 190000) ? 1000000 : 200000;
const pctWin = ctxTokens ? Math.round(ctxTokens / window * 100) : 0;
const fmt = t => t >= 1000 ? (t / 1000).toFixed(t >= 10000 ? 0 : 1) + 'k' : String(t);

// --- faixas de consumo (por tokens de input/msg) ---
function zone(t) {
  if (t < 80000)  return { label: 'ENXUTO', emoji: '🟢', code: 32, hint: '' };
  if (t < 180000) return { label: 'BOM',    emoji: '🟢', code: 32, hint: '' };
  if (t < 320000) return { label: 'MÉDIO',  emoji: '🟡', code: 33, hint: '' };
  if (t < 500000) return { label: 'PESADO', emoji: '🟠', code: 33, hint: ' → /compact' };
  return { label: 'CARO', emoji: '🔴', code: 31, hint: ' → /compact' };
}

const dim = s => `\x1b[2m${s}\x1b[0m`;
const col = (s, c) => `\x1b[${c}m${s}\x1b[0m`;
const sep = dim(' · ');

// barra de "consumo": 8 segmentos contra um teto de conforto de 600k
function bar(t) {
  const segs = 8, ceil = 600000;
  const fill = Math.max(0, Math.min(Math.round(t / ceil * segs), segs));
  const z = zone(t);
  return col('█'.repeat(fill), z.code) + dim('░'.repeat(segs - fill));
}

let fuel;
if (justCompacted) {
  fuel = col('⛽ compactado ✓', 32) + dim(' (atualiza no próx. turno)');
} else {
  const z = zone(ctxTokens);
  fuel = `⛽ ${col(fmt(ctxTokens) + '/msg', z.code)} ▕${bar(ctxTokens)}▏ ${z.emoji} `
       + col(z.label, z.code) + (z.hint ? col(z.hint, 31) : '');
}

// --- duração/abertura da sessão ---
let sessionInfo = '';
if (sessionStart) {
  const start = new Date(sessionStart);
  const now = sessionEnd ? new Date(sessionEnd) : start;
  const hh = String(start.getHours()).padStart(2, '0');
  const mm = String(start.getMinutes()).padStart(2, '0');
  const sameDay = start.toDateString() === now.toDateString();
  const dd = String(start.getDate()).padStart(2, '0');
  const mo = String(start.getMonth() + 1).padStart(2, '0');
  const dateStr = sameDay ? '' : `${dd}/${mo} `;

  const elapsedMs = now - start;
  const totalMin = Math.max(0, Math.round(elapsedMs / 60000));
  const days = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60), m = totalMin % 60;
  const dur = days > 0 ? `${days}d${h}h${String(m).padStart(2, '0')}`
            : h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`;
  const durColor = (days > 0 || h >= 8) ? 31 : h >= 3 ? 33 : 32;
  sessionInfo = dim('🕐 aberta ') + col(`${dateStr}${hh}:${mm}`, '1') + dim(' · ') + col(dur, durColor);
}

const parts = [
  col(model, '36'),
  fuel,
  dim(pctWin + '% da janela'),
  `$${cost.toFixed(2)}`,
  dim(`+${fmt(added)}/-${fmt(removed)}`),
  sessionInfo || null,
].filter(Boolean);
const line1 = parts.join(sep);

// --- 2a linha: uso OFICIAL (/usage), via cache do usage-real.js ---
// O usage-real.js raspa o /usage num claude efêmero (0 token) e cacheia.
// Aqui só LEMOS o cache; disparamos um re-scrape em background se estiver velho.
let line2 = '';
try {
  const HOME = process.env.HOME || require('os').homedir();
  // Respeita CLAUDE_CONFIG_DIR (conta isolada, ex. Team); cache/lock por conta.
  const CFG   = process.env.CLAUDE_CONFIG_DIR || (HOME + '/.claude');
  const REAL  = __dirname + '/usage-real.js';
  const CACHE = CFG + '/.usage-real.json';
  const LOCK  = CFG + '/.usage-real.lock';
  const ur = require(REAL);
  line2 = ur.oneLine(ur.readCache(), { compact: true });
  let stale = true, locked = false;
  try { stale = (Date.now() - fs.statSync(CACHE).mtimeMs) > 60000; } catch (e) {}
  try { locked = (Date.now() - fs.statSync(LOCK).mtimeMs) < 30000; } catch (e) {}
  if (stale && !locked) {
    require('child_process').spawn(process.execPath, [REAL, '--scrape'], { detached: true, stdio: 'ignore' }).unref();
  }
} catch (e) { line2 = ''; }

process.stdout.write(line2 ? (line1 + '\n' + line2) : line1);
