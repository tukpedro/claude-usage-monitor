#!/usr/bin/env node
// Claude Code statusline — medidor de consumo (input por mensagem)
// Mostra: modelo · ⛽ tokens/msg + barra · custo · abertura · turns · 🐜/⌨ ativas · esforço
// 100% local (lê o transcript). Nao gasta token.

const fs = require('fs');

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch (e) {}
let data = {};
try { data = JSON.parse(raw); } catch (e) {}

const model   = (((data.model && data.model.display_name) || 'Claude').replace(/\s*\([^)]*\)/g, '')).trim();
const cost    = (data.cost && data.cost.total_cost_usd) || 0;
const transcript = data.transcript_path || '';

// --- contexto = input por mensagem ---
// Conta o ultimo turno do assistant DEPOIS do ultimo compact_boundary,
// ignorando subagentes (isSidechain). Assim o compact reflete na hora.
let ctxTokens = 0;
let justCompacted = false;
// --- abertura da sessão + nº de turns ---
let sessionStart = null;
let turns = 0;
// formigas já encerradas (<task-notification> com status terminal no transcript)
const finished = new Set();
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

    // primeiro timestamp (abertura), ignorando sidechain
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i]) continue;
      let o; try { o = JSON.parse(lines[i]); } catch (e) { continue; }
      if (o.isSidechain) continue;
      if (o.timestamp) { sessionStart = o.timestamp; break; }
    }

    // turns = prompts REAIS do usuário. O transcript grava tool_result como
    // type 'user' também, então sem filtrar dava ~6x o número real.
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i]) continue;
      let o; try { o = JSON.parse(lines[i]); } catch (e) { continue; }
      if (o.type !== 'user' || o.isSidechain || o.isMeta) continue;
      const c = o.message && o.message.content;
      if (Array.isArray(c) && c.some(b => b && b.type === 'tool_result')) continue;
      turns++;
    }

    // formigas encerradas: <task-notification> com status terminal
    const reFim = /<task-id>([^<]+)<\/task-id>[\s\S]{0,400}?<status>(completed|killed|failed|error)<\/status>/g;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]; if (!l || l.indexOf('<task-notification>') === -1) continue;
      let m; reFim.lastIndex = 0;
      while ((m = reFim.exec(l))) finished.add(m[1].trim());
    }
  }
} catch (e) {}

const fmt = t => t >= 1000 ? (t / 1000).toFixed(t >= 10000 ? 0 : 1) + 'k' : String(t);

// --- faixas de consumo (por tokens de input/msg) ---
function zone(t) {
  if (t < 80000)  return { emoji: '🟢', code: 32 }; // enxuto
  if (t < 180000) return { emoji: '🟢', code: 32 }; // bom
  if (t < 320000) return { emoji: '🟡', code: 33 }; // médio
  if (t < 500000) return { emoji: '🟠', code: 33 }; // pesado
  return { emoji: '🔴', code: 31 };                 // caro
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
  fuel = `⛽ ${col(fmt(ctxTokens) + '/msg', z.code)} ▕${bar(ctxTokens)}▏ ${z.emoji}`;
}

// --- abertura da sessão + turns ---
// Sem duração: ela é derivável da hora de abertura, era info redundante.
let sessionInfo = '';
if (sessionStart) {
  const start = new Date(sessionStart);
  const hh = String(start.getHours()).padStart(2, '0');
  const mm = String(start.getMinutes()).padStart(2, '0');
  // data só quando a sessão não abriu hoje — senão é ruído
  const sameDay = start.toDateString() === new Date().toDateString();
  const dd = String(start.getDate()).padStart(2, '0');
  const mo = String(start.getMonth() + 1).padStart(2, '0');
  const dateStr = sameDay ? '' : `${dd}/${mo} `;
  sessionInfo = '🕐 ' + col(`${dateStr}${hh}:${mm}`, '1'); // hora de abertura, sem rótulo
}

// Limiares medidos em ~14.5k sessões: o contexto mediano cresce ~10k/turn depois
// do joelho (5→10 turns: 60k→266k). 12 turns ≈ 320k (faixa PESADO do ⛽) e
// 50 ≈ 500k (faixa CARO) — mesmas fronteiras do medidor, só que em turns.
const turnsInfo = turns
  ? col('💬 ' + turns, turns >= 50 ? 31 : turns >= 12 ? 33 : 32) + dim(' turns')
  : '';

// --- formigas (subagentes) vivas ---
// Fonte: <transcript sem .jsonl>/subagents/agent-<id>.meta.json ("finished": true
// quando acaba; é o que o painel "Waiting for N background agents" usa). Formiga
// parada à força nem sempre ganha o finished, então vale também: notificação de
// término no transcript, ou jsonl dela parado há mais de 15 min (uma formiga
// viva escreve no jsonl a cada chamada; o Monitor dela expira em ≤ 10 min).
// Shells e monitores saíram da barra: sem fonte fiel (pedido do Pedro, 31/10).
const toWsl = p => {
  const m = /^([A-Za-z]):[\\/](.*)$/.exec(p);
  return m ? '/mnt/' + m[1].toLowerCase() + '/' + m[2].replace(/\\/g, '/') : p;
};
let antsInfo = '';
try {
  const subDir = transcript.replace(/\.jsonl$/, '') + '/subagents';
  const now = Date.now();
  let ants = 0;
  for (const f of fs.readdirSync(subDir)) {
    const m = /^agent-([A-Za-z0-9]+)\.meta\.json$/.exec(f);
    if (!m || finished.has(m[1])) continue;
    try {
      if (JSON.parse(fs.readFileSync(subDir + '/' + f, 'utf8')).finished === true) continue;
      if (now - fs.statSync(subDir + '/agent-' + m[1] + '.jsonl').mtimeMs > 15 * 60000) continue;
    } catch (e) { continue; }
    ants++;
  }
  // até 4 amarelo, acima de 4 vermelho (pedido do Pedro)
  if (ants) antsInfo = col('🐜 ' + ants, ants > 4 ? 31 : 33);
} catch (e) { antsInfo = ''; }

// --- esforço (effort): ◔ low · ◑ medium · ◕ high · ● xhigh/max ---
let effortInfo = '';
try {
  const lv = data.effort && data.effort.level;
  if (lv) {
    const ic = { low: '◔', medium: '◑', high: '◕', xhigh: '●', max: '●' }[lv] || '◐';
    effortInfo = dim(`${ic} ${lv}`);
  }
} catch (e) {}

const parts = [
  col(model, '36') + (effortInfo ? ' ' + effortInfo : ''), // esforço colado ao modelo
  fuel,
  `$${cost.toFixed(2)}`,
  sessionInfo || null,
  turnsInfo || null,
].filter(Boolean);
const line1 = parts.join(sep);

// --- 2a linha: uso OFICIAL (/usage), via cache do usage-real.js ---
// O usage-real.js raspa o /usage num claude efêmero (0 token) e cacheia.
// Aqui só LEMOS o cache; disparamos um re-scrape em background se estiver velho.
let line2 = '';
let line3 = '';
try {
  const HOME = process.env.HOME || require('os').homedir();
  // Respeita CLAUDE_CONFIG_DIR (conta isolada, ex. Team); cache/lock por conta.
  const CFG   = process.env.CLAUDE_CONFIG_DIR || (HOME + '/.claude');
  const REAL  = __dirname + '/usage-real.js';
  const CACHE = CFG + '/.usage-real.json';
  const LOCK  = CFG + '/.usage-real.lock';
  const ur = require(REAL);
  // tailSeparate: o carimbo "pulled" vai p/ uma 3ª linha, deixando a 2ª só com
  // os medidores. Sem ele a linha passava de 115 colunas e quebrava.
  const o = ur.oneLine(ur.readCache(), { compact: true, tailSeparate: true });
  line2 = o.body;
  line3 = o.stamp || '';
  let stale = true, locked = false;
  try { stale = (Date.now() - fs.statSync(CACHE).mtimeMs) > 60000; } catch (e) {}
  try { locked = (Date.now() - fs.statSync(LOCK).mtimeMs) < 30000; } catch (e) {}
  if (stale && !locked) {
    require('child_process').spawn(process.execPath, [REAL, '--scrape'], { detached: true, stdio: 'ignore' }).unref();
  }
} catch (e) { line2 = ''; line3 = ''; }

// formigas/shells/monitores ao lado dos medidores oficiais (2ª linha); sem
// cache do /usage ainda, vão pro fim da 1ª.
if (antsInfo) { if (line2) line2 += sep + antsInfo; else line1 += sep + antsInfo; }

// --- sessões abertas (as que a seta ← lista) e o estado de cada uma ---
// Registro: <config>/sessions/<pid>.json (status busy/idle, name com ⑂ se é
// fork). Vivas = pid existe (WSL: /proc; Windows: o shim filtra e manda em
// win_sessions). Estado: 🟢 rodando (busy) · 🟡 esperando você (parada e a
// última fala termina em pergunta, ou usou AskUserQuestion) · ⚪ parada.
// Só os últimos 12 KB de cada transcript são lidos.
function estadoSessao(s) {
  if (s.status === 'busy') return 'verde';
  try {
    const p = toWsl(s.transcript_path);
    const st = fs.statSync(p); const n = Math.min(st.size, 12000);
    if (!n) return 'branco';
    const b = Buffer.alloc(n); const h = fs.openSync(p, 'r'); fs.readSync(h, b, 0, n, st.size - n); fs.closeSync(h);
    const ls = b.toString('utf8').split('\n');
    for (let i = ls.length - 1; i >= 0; i--) {
      if (!ls[i] || ls[i].indexOf('"type":"assistant"') === -1) continue;
      let o; try { o = JSON.parse(ls[i]); } catch (e) { continue; }
      const c = o.message && o.message.content; if (!Array.isArray(c)) continue;
      if (c.some(x => x && x.type === 'tool_use' && x.name === 'AskUserQuestion')) return 'amarelo';
      const txt = c.filter(x => x && x.type === 'text').map(x => x.text || '').join('\n').trim();
      if (txt) return /\?\s*$/.test(txt.split('\n').filter(l => l.trim()).pop() || '') ? 'amarelo' : 'branco';
    }
  } catch (e) {}
  return 'branco';
}
let sessInfo = '';
try {
  let lista = [];
  if (Array.isArray(data.win_sessions)) lista = data.win_sessions;
  else {
    const CFG = process.env.CLAUDE_CONFIG_DIR || ((process.env.HOME || require('os').homedir()) + '/.claude');
    const dir = CFG + '/sessions';
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      let s; try { s = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8')); } catch (e) { continue; }
      if (!s.pid || !fs.existsSync('/proc/' + s.pid)) continue;
      const proj = (s.cwd || '').replace(/[^A-Za-z0-9]/g, '-');
      lista.push({ pid: s.pid, sessionId: s.sessionId, status: s.status, name: s.name || '', transcript_path: CFG + '/projects/' + proj + '/' + s.sessionId + '.jsonl' });
    }
  }
  // sem a própria sessão: é o que o rodapé "← N agents" mostra
  lista = lista.filter(s => !data.session_id || s.sessionId !== data.session_id);
  if (lista.length) {
    const n = { verde: 0, amarelo: 0, branco: 0 };
    for (const s of lista) n[estadoSessao(s)]++;
    const forks = lista.filter(s => (s.name || '').indexOf('⑂') !== -1).length;
    const cells = [];
    if (n.verde)   cells.push(col('🟢' + n.verde, 32));
    if (n.amarelo) cells.push(col('🟡' + n.amarelo, 33));
    if (n.branco)  cells.push(dim('⚪' + n.branco));
    sessInfo = dim('⟵ ' + lista.length + (forks ? ' (' + forks + '⑂)' : '') + ' ') + cells.join(' ');
  }
} catch (e) { sessInfo = ''; }
// vai no fim da última linha (a do "pulled", curta); sem ela, no fim da 1ª
const out = [line1, line2, line3].filter(Boolean);
if (sessInfo) out[out.length - 1] += sep + sessInfo;
process.stdout.write(out.join('\n'));
