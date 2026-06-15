#!/usr/bin/env node
// Claude Code statusline — medidor de consumo (input por mensagem)
// Mostra: modelo · ⛽ tokens/msg (+input pendente) + barra + faixa · % da janela · custo · linhas
// 100% local (lê o transcript). Nao gasta token.

const fs = require('fs');

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch (e) {}
let data = {};
try { data = JSON.parse(raw); } catch (e) {}

const model   = (data.model && data.model.display_name) || 'Claude';
const modelId = (data.model && data.model.id) || '';
const cost    = (data.cost && data.cost.total_cost_usd) || 0;
const added   = (data.cost && data.cost.total_lines_added) || 0;
const removed = (data.cost && data.cost.total_lines_removed) || 0;
const transcript = data.transcript_path || '';

// --- contexto = input por mensagem ---
// Conta o ultimo turno do assistant DEPOIS do ultimo compact_boundary,
// ignorando subagentes (isSidechain). Assim o compact reflete na hora.
let ctxTokens = 0;
let foundTs = null;
let justCompacted = false;
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
        foundTs = o.timestamp || null;
        found = i; break;
      }
    }
    if (found === -1 && lastBoundary >= 0) justCompacted = true;
  }
} catch (e) {}

// --- input pendente (gravado pelo hook UserPromptSubmit) ---
// Só conta se foi enviado DEPOIS do ultimo turno; senao ja esta no ctx (contaria dobrado).
let inputTokens = 0;
try {
  const HOME = process.env.HOME || require('os').homedir();
  const li = JSON.parse(fs.readFileSync(HOME + '/.claude/.last-input.json', 'utf8'));
  const baseMs = foundTs ? Date.parse(foundTs) : 0;
  if (li && li.ts && li.ts > baseMs && li.tokens > 0) inputTokens = li.tokens;
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
} else if (inputTokens > 0) {
  // input pendente: mostra base + input = total (custo da PROXIMA mensagem)
  const total = ctxTokens + inputTokens;
  const z = zone(total);
  const k1 = t => (t / 1000).toFixed(1) + 'k';
  fuel = '⛽ ' + col(k1(ctxTokens), z.code) + col('+' + k1(inputTokens), 35)
       + col('=' + k1(total) + '/msg', z.code)
       + ` ▕${bar(total)}▏ ${z.emoji} ` + col(z.label, z.code) + (z.hint ? col(z.hint, 31) : '');
} else {
  const z = zone(ctxTokens);
  fuel = `⛽ ${col(fmt(ctxTokens) + '/msg', z.code)} ▕${bar(ctxTokens)}▏ ${z.emoji} `
       + col(z.label, z.code) + (z.hint ? col(z.hint, 31) : '');
}

const parts = [
  col(model, '36'),
  fuel,
  dim(pctWin + '% da janela'),
  `$${cost.toFixed(2)}`,
  dim(`+${fmt(added)}/-${fmt(removed)}`),
];
const line1 = parts.join(sep);

// --- 2a linha: uso de sessão/semana (cacheado; refresh em background) ---
let line2 = '';
try {
  const cp = require('child_process');
  const CLAUDE = (process.env.HOME || require('os').homedir()) + '/.claude';
  const CORE  = CLAUDE + '/usage-core.js';
  const CACHE = CLAUDE + '/.usage-cache.json';
  const LOCK  = CLAUDE + '/.usage-refresh.lock';
  const core = require(CORE);
  const cache = core.readCache();
  line2 = cache ? core.oneLine(cache) : dim('uso≈ carregando…');
  // dispara refresh em background se o cache estiver velho (>20s) e ninguém atualizando
  let stale = true, locked = false;
  try { stale = (Date.now() - fs.statSync(CACHE).mtimeMs) > 20000; } catch (e) {}
  try { locked = (Date.now() - fs.statSync(LOCK).mtimeMs) < 15000; } catch (e) {}
  if (stale && !locked) {
    cp.spawn(process.execPath, [CORE, '--cache'], { detached: true, stdio: 'ignore' }).unref();
  }
} catch (e) { line2 = ''; }

process.stdout.write(line2 ? (line1 + '\n' + line2) : line1);
