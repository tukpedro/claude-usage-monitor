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

const parts = [
  col(model, '36'),
  fuel,
  dim(pctWin + '% da janela'),
  `$${cost.toFixed(2)}`,
  dim(`+${fmt(added)}/-${fmt(removed)}`),
];
const line1 = parts.join(sep);

process.stdout.write(line1);
