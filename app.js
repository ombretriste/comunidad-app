'use strict';

// Versión de la app (se ve en Información). Arreglos y ajustes: 0.x.y; novedades: 0.x.0.
const APP_VERSION = '0.1.0';
const APP_NAME = 'Mi comunidad';
// Uso de la app en Vercel Analytics: cada sección cuenta como una página virtual (nunca datos).
const track = (path) => { try { window.va?.('pageview', { path }); } catch (_) { /* sin analítica */ } };
const SESSION_KEY = 'micomunidad:v1';
const DISPLAY_KEY = 'micomunidad:display';
const API = '/api/comunidad';
const STATE_EVERY_MS = 20e3;   // pantalla principal: se actualiza cada 20 s con la app a la vista
const CHAT_EVERY_MS = 3000;    // chat abierto: cada 3 s
const DM_EVERY_MS = 5000;      // conversación con la presidencia abierta: cada 5 s
const GROUP_GAP_MS = 5 * 60e3;

const ICONS = {
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".9" fill="currentColor" stroke="none"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.1-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  board: '<rect x="3.5" y="4.5" width="17" height="12" rx="1.5"/><path d="M7 8.5h6M7 12h10"/><path d="M8.5 16.5l-1.5 3.5M15.5 16.5l1.5 3.5"/><circle cx="17" cy="8.3" r=".9" fill="currentColor" stroke="none"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  lockMail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  chat: '<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/><path d="M8 10h8M8 13h5"/>',
  poll: '<rect x="4" y="13" width="3.5" height="7" rx="1"/><rect x="10.25" y="8" width="3.5" height="12" rx="1"/><rect x="16.5" y="4" width="3.5" height="16" rx="1"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.5 2.5M14 9l2 2"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  unlock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 7.7-1.5"/>',
  ban: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5M14 11v5.5"/>',
  pin: '<path d="M9 4h6l-1 6 3.5 3.5h-11L10 10z"/><path d="M12 13.5V20"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7 10.5H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1"/>',
  print: '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="1.5"/><path d="M7 14h10v6.5H7z"/>',
  logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
  crown: '<path d="M4 17.5L3 8l5 4 4-6.5 4 6.5 5-4-1 9.5z"/><path d="M4 20.5h16"/>',
  home: '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5v10h12v-10"/><path d="M10 19.5v-5h4v5"/>',
  inbox: '<path d="M4 13.5l2.5-8h11l2.5 8v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 13.5h4.5l1 2h5l1-2H20"/>',
  users: '<circle cx="9" cy="9" r="3.3"/><path d="M3 19.5a6 6 0 0 1 12 0"/><path d="M15.5 5.9a3.3 3.3 0 0 1 0 6.3M17.5 14.2a6 6 0 0 1 3.5 5.3"/>',
  send: '<path d="M5 12h13M12.5 6l6 6-6 6"/>',
  shield: '<path d="M12 3.5l7 2.5v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6z"/><path d="M9 12l2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
};
const icon = (name, size = 22, sw = 1.4) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// Logo: anillo fino, anillo discontinuo, arco y un edificio de viviendas de líneas finas
let logoCount = 0;
function logoSVG(size) {
  const id = `mc-g${logoCount++}`;
  return `
    <svg class="logo-mark" viewBox="0 0 120 120" width="${size}" height="${size}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#2563eb"/><stop offset=".55" stop-color="#60a5fa"/><stop offset="1" stop-color="#dbeafe"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" stroke="url(#${id})" stroke-width="1.2" opacity=".55"/>
      <circle cx="60" cy="60" r="42" stroke="url(#${id})" stroke-width=".8" stroke-dasharray="2 5" opacity=".6"/>
      <path class="logo-arc" pathLength="1" d="M60 8 A52 52 0 1 1 14.97 86" stroke="url(#${id})" stroke-width="3"/>
      <circle class="logo-dot" cx="14.97" cy="86" r="3" fill="#60a5fa" stroke="none"/>
      <path d="M40 84V44l20-12 20 12v40" stroke="url(#${id})" stroke-width="1.8"/>
      <path d="M32 84h56" stroke="url(#${id})" stroke-width="1.4"/>
      <path d="M54 84V73h12v11" stroke="url(#${id})" stroke-width="1.4"/>
      <g stroke="url(#${id})" stroke-width="1.2">
        <rect x="46" y="49" width="7" height="6" rx="1"/><rect x="67" y="49" width="7" height="6" rx="1"/>
        <rect x="46" y="61" width="7" height="6" rx="1"/><rect x="56.5" y="61" width="7" height="6" rx="1"/>
      </g>
      <rect x="56.5" y="49" width="7" height="6" rx="1" fill="#60a5fa" stroke="none"/>
      <rect x="67" y="61" width="7" height="6" rx="1" fill="#2563eb" stroke="none"/>
    </svg>`;
}
document.querySelectorAll('[data-logo]').forEach((el) => { el.innerHTML = logoSVG(Number(el.dataset.logo)); });

// ---------- Utilidades ----------

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const ROLE_NAME = { pres: 'Presidente', vice: 'Vicepresidente', auto: 'Automático' };
const ROLE_BOARD = { pres: 'Presidencia', vice: 'Vicepresidencia', auto: 'Aviso automático' };

function load(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
}
// Enlaces en el texto, sin HTML del usuario
const linkify = (s) => esc(s).replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)»"']/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);

function toast(text) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.remove(), 2800);
}

const hhmm = (t) => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const dayKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
function dayLabel(t) {
  const d = new Date(t);
  const today = new Date();
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  if (dayKey(t) === dayKey(today)) return 'Hoy';
  if (dayKey(t) === dayKey(yest)) return 'Ayer';
  const base = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === today.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}
const when = (t) => `${dayLabel(t)}, ${hhmm(t)}`;
function shortWhen(t) {
  if (dayKey(t) === dayKey(Date.now())) return hhmm(t);
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

async function copyText(text, done = 'Copiado') {
  try { await navigator.clipboard.writeText(text); toast(done); } catch (_) { toast('No se ha podido copiar'); }
}

// ---------- Servidor ----------

class ApiError extends Error {
  constructor(status, code) { super(code || `http ${status}`); this.status = status; this.code = code; }
}
async function api(action, body = {}) {
  let res;
  try {
    res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...body }) });
  } catch (_) {
    throw new ApiError(0, 'offline');
  }
  let json = {};
  try { json = await res.json(); } catch (_) { /* sin cuerpo */ }
  if (!res.ok) throw new ApiError(res.status, json.error);
  return json;
}
// Llamada con el código de esta vivienda. Si el código deja de valer (se generó otro), se sale.
async function call(action, body = {}) {
  try {
    return await api(action, { code: sess.code, ...body });
  } catch (e) {
    if (e.status === 401 && sess.code) {
      logout(true);
      openNotice('Tu código ya no es válido', 'La presidencia ha generado un código nuevo para tu vivienda. Si no lo tienes, pídelo de nuevo y lo recibirás en tu buzón.');
    }
    throw e;
  }
}
function errorText(e) {
  const map = {
    offline: 'Sin conexión. Inténtalo de nuevo.',
    'too-many': 'Demasiados intentos. Espera un rato y vuelve a probar.',
    'no-community': 'No existe ninguna comunidad con ese código.',
    'bad-code': 'Ese código no es válido. Revisa que esté bien escrito.',
    forbidden: 'Solo el presidente o el vicepresidente pueden hacer esto.',
    blocked: 'La administración te ha bloqueado en el chat.',
    closed: 'Ya está cerrado.',
    'is-admin': 'No se puede hacer con el presidente ni el vicepresidente.',
    'too-many-units': 'Se ha llegado al máximo de viviendas.',
    past: 'La fecha de cierre debe ser futura.',
    gone: 'Ya no existe.',
    'not-configured': 'El servidor aún no tiene base de datos configurada.',
  };
  return map[e.code] || 'Algo ha fallado. Inténtalo de nuevo.';
}

// ---------- Sesión (código de la vivienda en este dispositivo) ----------

const emptySeen = () => ({ board: 0, chat: 0, dm: 0, threads: {} });
let sess = { code: '', seen: emptySeen(), cache: null, ...load(SESSION_KEY, {}) };
sess.seen = { ...emptySeen(), ...(sess.seen || {}) };
let st = sess.cache; // último estado recibido (se muestra al momento, aunque no haya conexión)
let offline = false;
const persist = () => save(SESSION_KEY, sess);
const isAdmin = () => !!st?.me?.role;
const isPres = () => st?.me?.role === 'pres';

function login(code, firstState) {
  sess = { code, seen: emptySeen(), cache: firstState || null };
  st = sess.cache;
  persist();
  track('/entrar');
}
function logout(silent) {
  sess = { code: '', seen: emptySeen(), cache: null };
  st = null;
  persist();
  closeView();
  closeSheet();
  renderHome();
  if (!silent) toast('Has salido de la comunidad en este dispositivo');
}

// Código de la comunidad recibido en un enlace (?c=XXXXXX): sirve para pedir el código propio
const linkPub = (new URLSearchParams(location.search).get('c') || '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 6);
if (linkPub) history.replaceState(null, '', location.pathname);
let linkName = '';

// ---------- Pantalla principal ----------

function setBrand() {
  const name = st?.community?.name || (sess.code ? '' : linkName) || APP_NAME;
  $('brand').textContent = name;
  document.title = name;
}

function renderHome() {
  setBrand();
  const home = $('home');
  if (!sess.code) return renderWelcome(home);
  if (!st) {
    home.innerHTML = `<div class="empty">${offline ? `<p class="offline">${icon('info', 16)} Sin conexión</p>` : '<p>Cargando…</p>'}</div>`;
    return;
  }
  const me = st.me;
  const admin = !!me.role;
  const newPosts = st.board.filter((p) => p.t > sess.seen.board && p.by !== me.mid).length;
  const openPolls = st.polls.filter((p) => !p.closed);
  const pendingVotes = openPolls.filter((p) => p.mine === null).length;
  const chatNew = st.chat.s > sess.seen.chat && !st.chat.mine;
  const dmNew = !admin && st.dm && st.dm.from === 'junta' && st.dm.t > sess.seen.dm;
  const threadsNew = admin ? (st.threads || []).filter((t) => t.from === 'vecino' && t.t > (sess.seen.threads[t.mid] || 0)).length : 0;
  const reqs = admin ? (st.requests || []).length : 0;
  const latest = st.board.find((p) => p.pin) || st.board[0];
  const badge = (n) => (n ? `<span class="badge">${n === true ? '•' : n}</span>` : '');

  home.innerHTML = `
    ${offline ? `<p class="offline">${icon('info', 16)} Sin conexión: datos de la última visita</p>` : ''}
    <section class="card hello">
      <span class="unit-badge">${esc(me.label)}</span>
      <div class="hello-text">
        <small>Vivienda ${esc(me.label)}</small>
        <b>¡Hola, vecino!</b>
        ${admin ? `<span class="role-chip">${icon('crown', 13, 1.6)} ${ROLE_NAME[me.role]}</span>` : ''}
      </div>
    </section>
    <section class="tiles">
      <button class="tile ${newPosts ? 'hot' : ''}" type="button" data-go="board">
        <span class="tile-ico">${icon('board', 24)}</span>
        <span class="tile-text"><b>Tablón de anuncios</b><small>${newPosts ? plural(newPosts, 'anuncio nuevo', 'anuncios nuevos') : 'Noticias de la comunidad'}</small></span>
        ${badge(newPosts)}
      </button>
      ${admin ? `
      <button class="tile ${threadsNew ? 'hot' : ''}" type="button" data-go="threads">
        <span class="tile-ico">${icon('inbox', 24)}</span>
        <span class="tile-text"><b>Mensajes de vecinos</b><small>${threadsNew ? plural(threadsNew, 'conversación sin leer', 'conversaciones sin leer') : 'Privados para la presidencia'}</small></span>
        ${badge(threadsNew)}
      </button>` : `
      <button class="tile ${dmNew ? 'hot' : ''}" type="button" data-go="contact">
        <span class="tile-ico">${icon('mail', 24)}</span>
        <span class="tile-text"><b>Contacta con la presidencia</b><small>${dmNew ? 'Tienes respuesta' : 'Solo lo leen el presidente y el vicepresidente'}</small></span>
        ${badge(dmNew)}
      </button>`}
      <button class="tile ${chatNew ? 'hot' : ''}" type="button" data-go="chat">
        <span class="tile-ico">${icon('chat', 24)}</span>
        <span class="tile-text"><b>Chat de vecinos</b><small>${!st.community.chatOpen ? 'Cerrado por la administración' : me.blocked ? 'Estás bloqueado en el chat' : chatNew ? 'Mensajes nuevos' : 'Habla con todos los vecinos'}</small></span>
        ${badge(chatNew)}
      </button>
      <button class="tile ${pendingVotes ? 'hot' : ''}" type="button" data-go="polls">
        <span class="tile-ico">${icon('poll', 24)}</span>
        <span class="tile-text"><b>Encuestas</b><small>${pendingVotes ? `${plural(pendingVotes, 'pendiente', 'pendientes')} de votar` : openPolls.length ? plural(openPolls.length, 'abierta', 'abiertas') : 'Vota las propuestas'}</small></span>
        ${badge(pendingVotes)}
      </button>
      ${admin ? `
      <button class="tile wide ${reqs ? 'hot' : ''}" type="button" data-go="admin">
        <span class="tile-ico">${icon('gear', 24)}</span>
        <span class="tile-text"><b>Gestión de la comunidad</b><small>${reqs ? plural(reqs, 'solicitud de código', 'solicitudes de código') : 'Viviendas, códigos y cargos'}</small></span>
        ${badge(reqs)}
      </button>` : ''}
    </section>
    ${latest ? `
    <section class="card">
      <p class="label">${latest.pin ? 'Anuncio fijado' : 'Último anuncio'}</p>
      <button class="latest" type="button" data-go="board" style="background:none;border:0;padding:0">
        <b>${esc(latest.title || 'Anuncio')}</b>
        <p>${esc(latest.text)}</p>
        <small class="muted">${esc(ROLE_BOARD[latest.role] || '')} · ${when(latest.t)}</small>
      </button>
    </section>` : ''}`;
}

$('home').addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go) openView(go.dataset.go);
});

// ---------- Bienvenida: sin código en este dispositivo ----------

function renderWelcome(home) {
  home.innerHTML = `
    <section class="welcome-hero">
      ${logoSVG(84)}
      <h1>${esc(linkName || APP_NAME)}</h1>
      <p>La app de tu comunidad de vecinos: tablón de anuncios, chat, encuestas y contacto directo con la presidencia. Sin nombres ni datos personales: cada vivienda entra con su propio código.</p>
    </section>
    <section class="card request-card">
      <h2>Pide tu código</h2>
      <ol class="step-list">
        <li><span class="step-num">1</span><span>Confirma que solicitas el código de tu vivienda.</span></li>
        <li><span class="step-num">2</span><span>La presidencia lo dejará en tu buzón.</span></li>
        <li><span class="step-num">3</span><span>Escríbelo aquí abajo y listo.</span></li>
      </ol>
      <button class="done-btn big" type="button" id="req-btn">${icon('mail', 20, 1.6)} Solicitar mi código</button>
    </section>
    <section class="card">
      <h2>Ya tengo mi código</h2>
      <div class="stack">
        <input class="title-input code-input" id="code-input" maxlength="16" placeholder="XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Tu código" />
        <p class="form-error" id="code-err" role="alert"></p>
        <button class="done-btn" type="button" id="code-ok" disabled>Entrar</button>
      </div>
    </section>
    <div class="footer-links"><button class="link-btn" type="button" id="create-btn">¿Eres el presidente? Crea una comunidad nueva</button></div>`;
  $('req-btn').addEventListener('click', openRequestSheet);
  $('create-btn').addEventListener('click', openCreateSheet);
  const input = $('code-input');
  const ok = $('code-ok');
  input.addEventListener('input', () => {
    const raw = input.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 12);
    const nice = raw.match(/.{1,4}/g)?.join('-') || '';
    if (input.value !== nice) input.value = nice;
    ok.disabled = raw.length !== 12;
    $('code-err').textContent = '';
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !ok.disabled) ok.click(); });
  ok.addEventListener('click', async () => {
    ok.disabled = true;
    try {
      const state = await api('state', { code: input.value });
      login(input.value, state);
      offline = false;
      renderHome();
      startPolling();
      toast(`Bienvenido a ${state.community.name}`);
    } catch (e) {
      $('code-err').textContent = errorText(e);
      ok.disabled = false;
    }
  });
}

// Pantalla de solicitud: el vecino confirma que pide su código y la app le dice que lo recibirá
// en su buzón. La solicitud (solo la vivienda) le aparece a la presidencia en Gestión.
function openRequestSheet() {
  track('/solicitar');
  const sheet = openSheet('Solicitar mi código');
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">Solicitar mi código</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    <p class="small muted">No hace falta ningún dato personal: solo tu vivienda, para que la presidencia sepa en qué buzón dejarlo.</p>
    <p class="field-label">Código de la comunidad</p>
    <input class="title-input code-input" id="rq-pub" maxlength="6" placeholder="Lo encontrarás en el portal" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(linkPub)}" />
    <p class="small muted" id="rq-name">&nbsp;</p>
    <p class="field-label">Tu vivienda (piso y puerta)</p>
    <input class="title-input" id="rq-label" maxlength="24" placeholder="Por ejemplo: 3º B" autocomplete="off" />
    <label class="check-row"><input type="checkbox" id="rq-confirm" /> <span>Confirmo que solicito el código de acceso de mi vivienda a la presidencia de la comunidad.</span></label>
    <p class="form-error" id="rq-err" role="alert"></p>
    <button class="done-btn big" type="button" id="rq-ok" disabled>Confirmar solicitud</button>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  const pub = sheet.querySelector('#rq-pub');
  const label = sheet.querySelector('#rq-label');
  const conf = sheet.querySelector('#rq-confirm');
  const ok = sheet.querySelector('#rq-ok');
  const err = sheet.querySelector('#rq-err');
  const nameEl = sheet.querySelector('#rq-name');
  let lookup = 0;
  const check = () => { ok.disabled = !(pub.value.length === 6 && label.value.trim() && conf.checked); err.textContent = ''; };
  const findName = async () => {
    const n = ++lookup;
    if (pub.value.length !== 6) { nameEl.innerHTML = '&nbsp;'; return; }
    try {
      const { name } = await api('community', { pub: pub.value });
      if (n === lookup) nameEl.textContent = `Comunidad: ${name}`;
    } catch (e) { if (n === lookup) nameEl.textContent = errorText(e); }
  };
  pub.addEventListener('input', () => { pub.value = pub.value.toUpperCase().replace(/[^0-9A-Z]/g, ''); check(); findName(); });
  label.addEventListener('input', check);
  conf.addEventListener('change', check);
  if (pub.value) findName();
  ok.addEventListener('click', async () => {
    ok.disabled = true;
    try {
      await api('request', { pub: pub.value, label: label.value });
      sheet.innerHTML = `
        <div class="done-panel">
          <span class="big-ico">${icon('mail', 38, 1.3)}</span>
          <h2>Solicitud enviada</h2>
          <p>Recibirás tu código en tu buzón en los próximos días.</p>
          <p class="small muted">Cuando lo tengas, escríbelo en «Ya tengo mi código».</p>
          <button class="done-btn" type="button" data-close>Entendido</button>
        </div>`;
      sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
    } catch (e) {
      err.textContent = errorText(e);
      ok.disabled = false;
    }
  });
  setTimeout(() => (pub.value ? label : pub).focus(), 60);
}

function openCreateSheet() {
  track('/crear-comunidad');
  const sheet = openSheet('Crear una comunidad');
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">Crear una comunidad</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    <p class="small muted">Quien crea la comunidad queda como presidente. Después podrás dar de alta las viviendas, imprimir sus códigos y nombrar al vicepresidente.</p>
    <p class="field-label">Nombre de la comunidad</p>
    <input class="title-input" id="cr-name" maxlength="60" value="${esc(APP_NAME)}" autocomplete="off" />
    <p class="field-label">Tu vivienda (piso y puerta)</p>
    <input class="title-input" id="cr-label" maxlength="24" placeholder="Por ejemplo: 1º A" autocomplete="off" />
    <label class="check-row"><input type="checkbox" id="cr-confirm" /> <span>Soy el presidente de esta comunidad.</span></label>
    <p class="form-error" id="cr-err" role="alert"></p>
    <button class="done-btn big" type="button" id="cr-ok" disabled>Crear comunidad</button>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  const name = sheet.querySelector('#cr-name');
  const label = sheet.querySelector('#cr-label');
  const conf = sheet.querySelector('#cr-confirm');
  const ok = sheet.querySelector('#cr-ok');
  const check = () => { ok.disabled = !(name.value.trim() && label.value.trim() && conf.checked); };
  [name, label].forEach((i) => i.addEventListener('input', check));
  conf.addEventListener('change', check);
  ok.addEventListener('click', async () => {
    ok.disabled = true;
    try {
      const r = await api('create', { name: name.value, label: label.value });
      sheet.innerHTML = `
        <div class="done-panel">
          <span class="big-ico">${icon('key', 36, 1.3)}</span>
          <h2>${esc(r.name)}</h2>
          <p>Este es el código de tu vivienda (${esc(label.value.trim())}), con el que entras como presidente:</p>
          <div class="pub-code"><small>Tu código</small><b>${esc(r.code)}</b></div>
          <p class="small muted">Anótalo en un lugar seguro: por seguridad no se puede volver a ver. Si lo pierdes, el vicepresidente puede generarte otro.</p>
          <div class="center-actions">
            <button class="ghost-btn" type="button" data-copy>${icon('copy', 18)} Copiar</button>
            <button class="done-btn" type="button" data-go>Entrar</button>
          </div>
        </div>`;
      sheet.querySelector('[data-copy]').addEventListener('click', () => copyText(r.code));
      sheet.querySelector('[data-go]').addEventListener('click', async () => {
        login(r.code, null);
        closeSheet();
        await refresh();
        startPolling();
        openNotice('Siguiente paso', 'Entra en «Gestión de la comunidad» para dar de alta las viviendas e imprimir sus códigos. El código de la comunidad sirve para que los vecinos pidan el suyo desde la app.');
      });
    } catch (e) {
      sheet.querySelector('#cr-err').textContent = errorText(e);
      ok.disabled = false;
    }
  });
  setTimeout(() => label.focus(), 60);
}

// ---------- Actualización periódica ----------

let stateTimer = 0;
let refreshing = null;
async function refresh() {
  if (!sess.code) return;
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      st = await call('state');
      offline = false;
      sess.cache = st;
      persist();
    } catch (e) {
      if (e.status === 0) offline = true;
    } finally {
      refreshing = null;
    }
    if (!sess.code) return;
    renderHome();
    if (view && ['board', 'polls', 'threads', 'admin'].includes(view.name)) renderView();
  })();
  return refreshing;
}
function startPolling() {
  clearInterval(stateTimer);
  if (!sess.code) return;
  stateTimer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, STATE_EVERY_MS);
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  refresh();
  if (view?.tick) view.tick();
});

// ---------- Secciones a pantalla completa ----------

let view = null; // { name, arg, tick?, timer? }
const VIEW_TITLES = { board: 'Tablón de anuncios', contact: 'Contacta con la presidencia', threads: 'Mensajes de vecinos', thread: '', chat: 'Chat de vecinos', polls: 'Encuestas', admin: 'Gestión de la comunidad' };

function openView(name, arg) {
  if (!st) return;
  closeView(true);
  view = { name, arg };
  track(`/${name}`);
  document.body.classList.add('in-view');
  $('view').hidden = false;
  $('view').classList.toggle('chatty', ['chat', 'contact', 'thread'].includes(name));
  $('view-title').textContent = VIEW_TITLES[name] || '';
  $('view-sub').textContent = '';
  $('view-actions').innerHTML = '';
  $('view-body').innerHTML = '';
  $('composer').hidden = true;
  $('composer-note').hidden = true;
  if (name === 'chat') startChat();
  else if (name === 'contact' || name === 'thread') startDM(name === 'thread' ? arg : null);
  else renderView();
  $('view-body').scrollTop = 0;
}
function closeView(quiet) {
  if (view?.timer) clearInterval(view.timer);
  view = null;
  $('view').hidden = true;
  document.body.classList.remove('in-view');
  $('msg-input').value = '';
  if (!quiet) renderHome();
}
$('view-back').addEventListener('click', () => {
  if (view?.name === 'thread') return openView('threads');
  closeView();
});

function renderView() {
  if (!view || !st) return;
  const body = $('view-body');
  const top = body.scrollTop;
  if (view.name === 'board') renderBoard(body);
  else if (view.name === 'polls') renderPolls(body);
  else if (view.name === 'threads') renderThreads(body);
  else if (view.name === 'admin') renderAdmin(body);
  body.scrollTop = top;
}

// ----- Tablón -----

function renderBoard(body) {
  const admin = isAdmin();
  $('view-sub').textContent = st.community.name;
  const posts = [...st.board].sort((a, b) => (b.pin - a.pin) || (b.t - a.t));
  const seenBefore = sess.seen.board;
  sess.seen.board = Math.max(sess.seen.board, ...st.board.map((p) => p.t), 0);
  persist();
  body.innerHTML = `
    ${admin ? `<div class="add-row"><button class="done-btn" type="button" data-new>${icon('plus', 18, 1.8)} Nuevo anuncio</button></div>` : ''}
    ${posts.length ? posts.map((p) => `
      <article class="card post ${p.pin ? 'pinned' : ''} ${p.kind === 'result' ? 'result' : ''}">
        <div class="post-top">
          ${p.pin ? `<span class="chip gold">${icon('pin', 12, 1.6)} Fijado</span>` : ''}
          ${p.kind === 'result' ? `<span class="chip">${icon('poll', 12, 1.6)} Encuesta</span>` : ''}
          ${p.t > seenBefore && p.by !== st.me.mid ? '<span class="chip ok">Nuevo</span>' : ''}
          <time>${esc(ROLE_BOARD[p.role] || '')} · ${when(p.t)}</time>
        </div>
        ${p.title ? `<h3>${esc(p.title)}</h3>` : ''}
        ${p.text ? `<p class="post-text">${linkify(p.text)}</p>` : ''}
        ${admin ? `<div class="post-actions">
          <button class="ghost-btn sm-btn" type="button" data-pin="${p.id}" data-on="${p.pin ? 0 : 1}">${icon('pin', 15)} ${p.pin ? 'Quitar de fijados' : 'Fijar arriba'}</button>
          <button class="ghost-btn sm-btn danger" type="button" data-del="${p.id}">${icon('trash', 15)} Eliminar</button>
        </div>` : ''}
      </article>`).join('') : `<div class="empty"><span class="tile-ico">${icon('board', 28)}</span><h3>Sin anuncios</h3><p>Aquí aparecerán las noticias de la comunidad.</p></div>`}`;
  body.querySelector('[data-new]')?.addEventListener('click', openPostSheet);
  body.querySelectorAll('[data-pin]').forEach((b) => b.addEventListener('click', async () => {
    try { await call('post-pin', { id: b.dataset.pin, pin: b.dataset.on === '1' }); await refresh(); } catch (e) { toast(errorText(e)); }
  }));
  body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => confirmSheet({
    title: '¿Eliminar este anuncio?', text: 'Desaparecerá del tablón para todos los vecinos.', ok: 'Eliminar', danger: true,
    run: async () => { await call('post-del', { id: b.dataset.del }); await refresh(); toast('Anuncio eliminado'); },
  })));
}

function openPostSheet() {
  const sheet = openSheet('Nuevo anuncio');
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">Nuevo anuncio</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    <input class="title-input" id="po-title" maxlength="140" placeholder="Título" autocomplete="off" />
    <textarea class="text-input" id="po-text" maxlength="6000" rows="6" placeholder="Escribe el anuncio para todos los vecinos"></textarea>
    <label class="check-row"><input type="checkbox" id="po-pin" /> <span>Fijarlo arriba del tablón</span></label>
    <p class="form-error" id="po-err" role="alert"></p>
    <div class="editor-actions"><span class="small muted">Firmado como ${ROLE_BOARD[st.me.role]}</span><button class="done-btn" type="button" id="po-ok" disabled>Publicar</button></div>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  const title = sheet.querySelector('#po-title');
  const text = sheet.querySelector('#po-text');
  const ok = sheet.querySelector('#po-ok');
  const check = () => { ok.disabled = !(title.value.trim() || text.value.trim()); };
  [title, text].forEach((i) => i.addEventListener('input', check));
  ok.addEventListener('click', async () => {
    ok.disabled = true;
    try {
      await call('post', { title: title.value, text: text.value, pin: sheet.querySelector('#po-pin').checked });
      closeSheet();
      await refresh();
      toast('Anuncio publicado');
    } catch (e) { sheet.querySelector('#po-err').textContent = errorText(e); ok.disabled = false; }
  });
  setTimeout(() => title.focus(), 60);
}

// ----- Mensajes (chat de vecinos y conversaciones con la presidencia) -----

const composerState = { send: null };
$('msg-input').addEventListener('input', () => {
  const t = $('msg-input');
  t.style.height = 'auto';
  t.style.height = `${Math.min(140, t.scrollHeight)}px`;
  $('send-btn').disabled = !t.value.trim();
});
$('msg-input').addEventListener('keydown', (e) => {
  // En el ordenador, Intro envía y Mayúsculas+Intro hace salto de línea
  if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); $('composer').requestSubmit(); }
});
$('composer').addEventListener('submit', async (e) => {
  e.preventDefault();
  const t = $('msg-input');
  const text = t.value.trim();
  if (!text || !composerState.send) return;
  t.value = '';
  t.style.height = 'auto';
  $('send-btn').disabled = true;
  try {
    await composerState.send(text);
  } catch (err) {
    t.value = text;
    $('send-btn').disabled = false;
    toast(errorText(err));
  }
});
function showComposer(on, note = '', placeholder = 'Escribe un mensaje') {
  $('composer').hidden = !on;
  $('composer-note').hidden = on || !note;
  $('composer-note').textContent = note;
  $('msg-input').placeholder = placeholder;
}
const nearBottom = (el) => el.scrollHeight - el.scrollTop - el.clientHeight < 120;

// Pinta una lista de mensajes: { key, t, mine, who, role, text, deleted, board }
function messagesHTML(list, intro = '') {
  let html = intro;
  let lastDay = '';
  let prev = null;
  for (const m of list) {
    const day = dayKey(m.t);
    if (day !== lastDay) { html += `<div class="day"><span>${dayLabel(m.t)}</span></div>`; lastDay = day; prev = null; }
    const grouped = prev && prev.who === m.who && prev.mine === m.mine && m.t - prev.t < GROUP_GAP_MS;
    html += `
      <div class="msg ${m.mine ? 'me' : 'other'} ${grouped ? 'grouped' : ''} ${m.board ? 'board' : ''}" data-key="${esc(m.key)}">
        <div class="bubble ${m.deleted ? 'deleted' : ''}">
          ${!grouped && m.who ? `<span class="who">${esc(m.who)}${m.role ? ` <span class="role-chip">${ROLE_NAME[m.role]}</span>` : ''}</span>` : ''}
          <span class="text">${m.deleted ? 'Mensaje eliminado por la administración' : linkify(m.text)}</span><span class="meta">${hhmm(m.t)}</span>
        </div>
      </div>`;
    prev = m;
  }
  return html;
}

// Chat de vecinos
let chatMsgs = [];
let chatAfter = 0;
function startChat() {
  chatMsgs = [];
  chatAfter = 0;
  $('view-sub').textContent = st.community.name;
  view.tick = pollChat;
  view.timer = setInterval(() => { if (document.visibilityState === 'visible') pollChat(); }, CHAT_EVERY_MS);
  composerState.send = async (text) => {
    await call('chat-send', { text });
    await pollChat(true);
  };
  renderChat(true);
  pollChat(true);
}
async function pollChat(scroll) {
  if (view?.name !== 'chat') return;
  let r;
  try { r = await call('chat-poll', { after: chatAfter }); } catch (_) { return; }
  if (view?.name !== 'chat') return;
  const fresh = r.msgs.filter((m) => !chatMsgs.some((x) => x.s === m.s));
  const delSet = new Set(r.dels);
  let changed = fresh.length > 0;
  chatMsgs.forEach((m) => { if (delSet.has(m.s) && !m.del) { m.del = 1; changed = true; } });
  chatMsgs.push(...fresh);
  chatMsgs = chatMsgs.slice(-500);
  if (chatMsgs.length) chatAfter = chatMsgs[chatMsgs.length - 1].s;
  const was = { open: st.community.chatOpen, blocked: st.me.blocked };
  st.community.chatOpen = r.open;
  st.me.blocked = r.blocked;
  if (changed || was.open !== r.open || was.blocked !== r.blocked || scroll) renderChat(scroll);
  if (chatAfter > sess.seen.chat) { sess.seen.chat = chatAfter; persist(); }
}
function renderChat(scroll) {
  const body = $('view-body');
  const stick = scroll || nearBottom(body);
  const admin = isAdmin();
  const me = st.me;
  const intro = `<p class="note banner">${icon('users', 16)} <span>Chat abierto a todas las viviendas. ${admin ? 'Toca un mensaje para borrarlo o bloquear a esa vivienda.' : 'La presidencia modera el chat.'}</span></p>`;
  body.innerHTML = chatMsgs.length || !st.community.chatOpen
    ? messagesHTML(chatMsgs.map((m) => ({
      key: m.s, t: m.t, mine: m.mid === me.mid, who: m.mid === me.mid ? '' : m.label, role: m.role, text: m.text, deleted: !!m.del, board: !!m.role,
    })), intro) + (!st.community.chatOpen ? `<p class="sys">${icon('lock', 13)} La administración ha cerrado el chat</p>` : '')
    : `${intro}<div class="empty"><span class="tile-ico">${icon('chat', 28)}</span><h3>Aún no hay mensajes</h3><p>Saluda a tus vecinos.</p></div>`;
  if (stick) body.scrollTop = body.scrollHeight;
  $('view-actions').innerHTML = admin
    ? `<button class="icon-btn sm" type="button" id="chat-lock" aria-label="${st.community.chatOpen ? 'Cerrar el chat' : 'Abrir el chat'}" title="${st.community.chatOpen ? 'Cerrar el chat' : 'Abrir el chat'}">${icon(st.community.chatOpen ? 'unlock' : 'lock', 18)}</button>`
    : '';
  $('chat-lock')?.addEventListener('click', toggleChatOpen);
  if (me.blocked) showComposer(false, 'La administración te ha bloqueado en el chat. Puedes leerlo, pero no escribir.');
  else if (!st.community.chatOpen && !admin) showComposer(false, 'El chat está cerrado por la administración.');
  else showComposer(true, '', st.community.chatOpen ? 'Escribe a todos los vecinos' : 'Chat cerrado: solo escribe la administración');
}
function toggleChatOpen() {
  const open = !st.community.chatOpen;
  confirmSheet({
    title: open ? '¿Abrir el chat?' : '¿Cerrar el chat?',
    text: open ? 'Todos los vecinos podrán volver a escribir.' : 'Los vecinos podrán leer los mensajes, pero no escribir. Tú y el otro cargo sí podréis.',
    ok: open ? 'Abrir' : 'Cerrar el chat',
    run: async () => {
      await call('chat-open', { open });
      st.community.chatOpen = open;
      renderChat();
      toast(open ? 'Chat abierto' : 'Chat cerrado');
    },
  });
}
$('view-body').addEventListener('click', (e) => {
  if (view?.name !== 'chat' || !isAdmin()) return;
  if (e.target.closest('a')) return;
  const el = e.target.closest('.msg');
  if (!el) return;
  const m = chatMsgs.find((x) => String(x.s) === el.dataset.key);
  if (!m) return;
  openChatMsgActions(m);
});
function openChatMsgActions(m) {
  const sheet = openSheet('Moderar mensaje');
  const unit = (st.units || []).find((u) => u.mid === m.mid);
  const canBlock = unit && !unit.role;
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">Vivienda ${esc(m.label)}</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    ${m.del ? '<p class="small muted">Este mensaje ya está eliminado.</p>' : `<p class="small muted" style="white-space:pre-wrap">«${esc(m.text.slice(0, 200))}${m.text.length > 200 ? '…' : ''}»</p>`}
    <div class="stack">
      ${m.del ? '' : `<button class="ghost-btn danger" type="button" data-del>${icon('trash', 18)} Borrar el mensaje</button>`}
      ${canBlock ? `<button class="ghost-btn ${unit.blocked ? '' : 'danger'}" type="button" data-block>${icon('ban', 18)} ${unit.blocked ? 'Desbloquear' : 'Bloquear'} a la vivienda ${esc(m.label)} en el chat</button>` : ''}
    </div>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  sheet.querySelector('[data-del]')?.addEventListener('click', async () => {
    try { await call('chat-del', { s: m.s }); m.del = 1; closeSheet(); renderChat(); toast('Mensaje borrado'); } catch (e) { toast(errorText(e)); }
  });
  sheet.querySelector('[data-block]')?.addEventListener('click', async () => {
    try {
      await call('block', { mid: m.mid, blocked: !unit.blocked });
      unit.blocked = !unit.blocked;
      closeSheet();
      toast(unit.blocked ? `Vivienda ${m.label} bloqueada en el chat` : `Vivienda ${m.label} desbloqueada`);
      refresh();
    } catch (e) { toast(errorText(e)); }
  });
}

// Conversación privada con la presidencia (vecino) o con una vivienda (cargos)
let dmMsgs = [];
function startDM(mid) {
  dmMsgs = [];
  const admin = isAdmin();
  if (view.name === 'thread') {
    const u = (st.units || []).find((x) => x.mid === mid);
    $('view-title').textContent = `Vivienda ${u ? u.label : ''}`;
    $('view-sub').textContent = 'Conversación privada con la presidencia';
  } else {
    $('view-sub').textContent = 'Presidente y vicepresidente';
  }
  view.tick = () => pollDM(false);
  view.timer = setInterval(() => { if (document.visibilityState === 'visible') pollDM(false); }, DM_EVERY_MS);
  composerState.send = async (text) => {
    await call('dm-send', { text, mid: admin ? mid : undefined });
    await pollDM(true);
  };
  showComposer(true, '', admin ? 'Responde a esta vivienda' : 'Escribe a la presidencia');
  renderDM(true);
  pollDM(true);
}
async function pollDM(scroll) {
  if (!view || (view.name !== 'contact' && view.name !== 'thread')) return;
  const mid = view.name === 'thread' ? view.arg : undefined;
  let r;
  try { r = await call('dm-get', { mid }); } catch (_) { return; }
  if (!view || (view.name !== 'contact' && view.name !== 'thread')) return;
  const changed = r.msgs.length !== dmMsgs.length;
  dmMsgs = r.msgs;
  const lastT = dmMsgs.length ? dmMsgs[dmMsgs.length - 1].t : 0;
  if (mid) sess.seen.threads[mid] = Math.max(sess.seen.threads[mid] || 0, lastT);
  else sess.seen.dm = Math.max(sess.seen.dm, lastT);
  persist();
  if (changed || scroll) renderDM(scroll);
}
function renderDM(scroll) {
  const body = $('view-body');
  const stick = scroll || nearBottom(body);
  const admin = isAdmin();
  const me = st.me;
  const intro = `<p class="note banner">${icon('shield', 16)} <span>${admin
    ? 'Solo el presidente y el vicepresidente ven esta conversación. Tus respuestas llegan firmadas con tu cargo.'
    : 'Esta conversación es privada: solo la leen el presidente y el vicepresidente. El resto de vecinos no puede verla.'}</span></p>`;
  const list = dmMsgs.map((m) => {
    const fromBoard = !!m.byRole;
    const mine = admin ? fromBoard : m.by === me.mid;
    let who = '';
    if (admin) who = fromBoard ? (m.by === me.mid ? '' : `${m.byLabel}`) : m.byLabel;
    else who = fromBoard ? 'Presidencia' : '';
    return { key: m.id, t: m.t, mine, who, role: fromBoard && (admin ? m.by !== me.mid : true) ? m.byRole : '', text: m.text, board: fromBoard && !mine };
  });
  body.innerHTML = list.length ? messagesHTML(list, intro)
    : `${intro}<div class="empty"><span class="tile-ico">${icon('mail', 28)}</span><h3>${admin ? 'Sin mensajes' : 'Escribe tu consulta'}</h3><p>${admin ? 'Escribe el primero a esta vivienda.' : 'Avisos, quejas o propuestas: llegarán al presidente y al vicepresidente.'}</p></div>`;
  if (stick) body.scrollTop = body.scrollHeight;
}

// ----- Conversaciones (cargos) -----

function renderThreads(body) {
  const threads = st.threads || [];
  body.innerHTML = `
    <p class="note banner">${icon('shield', 16)} <span>Mensajes privados de los vecinos a la presidencia. Solo los veis el presidente y el vicepresidente.</span></p>
    <div class="add-row"><button class="ghost-btn" type="button" data-new>${icon('edit', 18)} Escribir a una vivienda</button></div>
    ${threads.length ? `<div class="rows">${threads.map((t) => {
      const unread = t.from === 'vecino' && t.t > (sess.seen.threads[t.mid] || 0);
      return `<button class="row ${unread ? 'unread' : ''}" type="button" data-mid="${t.mid}">
        <span class="avatar">${esc(t.label)}</span>
        <span class="row-main">
          <span class="row-top"><b>Vivienda ${esc(t.label)}</b><small>${shortWhen(t.t)}</small></span>
          <span class="row-sub">${t.from === 'junta' ? 'Presidencia: ' : ''}${esc(t.text)}</span>
        </span>
        ${unread ? '<span class="badge">•</span>' : ''}
      </button>`;
    }).join('')}</div>` : `<div class="empty"><span class="tile-ico">${icon('inbox', 28)}</span><h3>Sin mensajes</h3><p>Cuando un vecino escriba a la presidencia, aparecerá aquí.</p></div>`}`;
  body.querySelectorAll('[data-mid]').forEach((b) => b.addEventListener('click', () => openView('thread', b.dataset.mid)));
  body.querySelector('[data-new]').addEventListener('click', () => pickUnit('Escribir a una vivienda', (st.units || []).filter((u) => u.mid !== st.me.mid), (u) => { closeSheet(); openView('thread', u.mid); }));
}

function pickUnit(title, units, then) {
  const sheet = openSheet(title);
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">${esc(title)}</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    ${units.length ? `<div class="rows">${units.map((u) => `<button class="row" type="button" data-mid="${u.mid}"><span class="avatar">${esc(u.label)}</span><span class="row-main"><span class="row-top"><b>Vivienda ${esc(u.label)}</b></span></span></button>`).join('')}</div>`
    : '<p class="small muted">No hay más viviendas dadas de alta.</p>'}`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  sheet.querySelectorAll('[data-mid]').forEach((b) => b.addEventListener('click', () => then(units.find((u) => u.mid === b.dataset.mid))));
}

// ----- Encuestas -----

function renderPolls(body) {
  const admin = isAdmin();
  const open = st.polls.filter((p) => !p.closed);
  const closed = st.polls.filter((p) => p.closed);
  const card = (p) => {
    const r = p.result;
    const max = r ? Math.max(...r.counts) : 0;
    return `
      <article class="card poll" data-poll="${p.id}">
        <div class="poll-meta">
          ${p.closed ? '<span class="chip">Cerrada</span>' : '<span class="chip ok">Abierta</span>'}
          ${!p.closed && p.mine === null ? '<span class="chip warn">Pendiente de votar</span>' : ''}
          <span>${p.closed ? `Cerrada: ${when(p.closed)}` : p.closes ? `${icon('clock', 13)} Cierra ${when(p.closes)}` : 'Sin fecha de cierre'}</span>
        </div>
        <h3>${esc(p.q)}</h3>
        ${p.desc ? `<p class="poll-desc">${linkify(p.desc)}</p>` : ''}
        <div class="opts">
          ${p.opts.map((o, i) => {
            const n = r ? r.counts[i] : 0;
            const pct = r && r.total ? Math.round((n / r.total) * 100) : 0;
            const win = p.closed && r && r.total && n === max;
            return `<button class="opt ${p.mine === i ? 'on' : ''} ${win ? 'win' : ''}" type="button" data-opt="${i}" ${p.closed ? 'disabled' : ''} style="--w:${r ? pct : 0}%">
              ${r ? '<span class="bar"></span>' : ''}
              ${p.closed ? '' : '<span class="radio"></span>'}<span class="opt-text">${esc(o)}</span>
              ${r ? `<span class="opt-count">${n} · ${pct} %</span>` : ''}
            </button>`;
          }).join('')}
        </div>
        <p class="small muted">${p.closed ? `Han votado ${p.result.total} de ${p.result.units} viviendas.` : `${plural(p.voters, 'vivienda ha', 'viviendas han')} votado de ${p.units}.${p.mine !== null ? ' Puedes cambiar tu voto mientras esté abierta.' : ''}${admin ? ' El recuento solo lo veis los cargos hasta que se cierre.' : ' El resultado se publicará en el tablón al cerrarse.'}`}</p>
        ${admin ? `<div class="post-actions">
          ${p.closed ? '' : `<button class="ghost-btn sm-btn" type="button" data-close-poll="${p.id}">${icon('lock', 15)} Cerrar y publicar resultado</button>`}
          <button class="ghost-btn sm-btn danger" type="button" data-del-poll="${p.id}">${icon('trash', 15)} Eliminar</button>
        </div>` : ''}
      </article>`;
  };
  body.innerHTML = `
    ${admin ? `<div class="add-row"><button class="done-btn" type="button" data-new>${icon('plus', 18, 1.8)} Nueva encuesta</button></div>` : ''}
    ${!st.polls.length ? `<div class="empty"><span class="tile-ico">${icon('poll', 28)}</span><h3>No hay encuestas</h3><p>Cuando la presidencia proponga una votación, aparecerá aquí.</p></div>` : ''}
    ${open.length ? `<p class="section-title">Abiertas</p>${open.map(card).join('')}` : ''}
    ${closed.length ? `<p class="section-title">Cerradas</p>${closed.map(card).join('')}` : ''}`;
  body.querySelector('[data-new]')?.addEventListener('click', openPollSheet);
  body.querySelectorAll('.opt:not(:disabled)').forEach((b) => b.addEventListener('click', async () => {
    const id = b.closest('[data-poll]').dataset.poll;
    const p = st.polls.find((x) => x.id === id);
    const opt = Number(b.dataset.opt);
    if (p.mine === opt) return;
    const before = p.mine;
    p.mine = opt;
    if (before === null) p.voters++;
    renderPolls(body);
    try { await call('poll-vote', { id, opt }); toast('Voto registrado'); refresh(); } catch (e) { p.mine = before; if (before === null) p.voters--; renderPolls(body); toast(errorText(e)); }
  }));
  body.querySelectorAll('[data-close-poll]').forEach((b) => b.addEventListener('click', () => confirmSheet({
    title: '¿Cerrar la encuesta?', text: 'Ya no se podrá votar y el resultado se publicará automáticamente en el tablón de anuncios.', ok: 'Cerrar y publicar',
    run: async () => { await call('poll-close', { id: b.dataset.closePoll }); await refresh(); toast('Resultado publicado en el tablón'); },
  })));
  body.querySelectorAll('[data-del-poll]').forEach((b) => b.addEventListener('click', () => confirmSheet({
    title: '¿Eliminar la encuesta?', text: 'Se borrarán la encuesta y sus votos. Si ya se publicó el resultado, el anuncio sigue en el tablón.', ok: 'Eliminar', danger: true,
    run: async () => { await call('poll-del', { id: b.dataset.delPoll }); await refresh(); toast('Encuesta eliminada'); },
  })));
}

function openPollSheet() {
  const sheet = openSheet('Nueva encuesta');
  const opts = ['A favor', 'En contra'];
  const draw = () => {
    const q = sheet.querySelector('#pl-q')?.value ?? '';
    const desc = sheet.querySelector('#pl-desc')?.value ?? '';
    const closes = sheet.querySelector('#pl-closes')?.value ?? '';
    sheet.innerHTML = `
      <div class="sheet-head"><h2 class="sheet-title">Nueva encuesta</h2>
        <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
      <input class="title-input" id="pl-q" maxlength="200" placeholder="Pregunta o propuesta" autocomplete="off" value="${esc(q)}" />
      <textarea class="text-input" id="pl-desc" maxlength="1500" rows="3" placeholder="Explicación (opcional)">${esc(desc)}</textarea>
      <p class="opt-label">Opciones</p>
      ${opts.map((o, i) => `<div class="opt-edit"><input class="title-input" data-o="${i}" maxlength="120" placeholder="Opción ${i + 1}" value="${esc(o)}" autocomplete="off" />
        <button class="icon-btn sm" type="button" data-rm="${i}" aria-label="Quitar opción" ${opts.length <= 2 ? 'disabled' : ''}>${icon('close', 16)}</button></div>`).join('')}
      ${opts.length < 10 ? `<button class="ghost-btn" type="button" data-add>${icon('plus', 16)} Añadir opción</button>` : ''}
      <p class="opt-label">Cierre automático (opcional)</p>
      <input class="title-input" id="pl-closes" type="datetime-local" value="${esc(closes)}" />
      <p class="small muted">Al cerrarse (en esa fecha o cuando la cierres tú) el resultado se publica en el tablón. Cada vivienda tiene un voto y el voto es secreto.</p>
      <p class="form-error" id="pl-err" role="alert"></p>
      <div class="editor-actions"><span></span><button class="done-btn" type="button" id="pl-ok">Publicar encuesta</button></div>`;
    sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
    sheet.querySelectorAll('[data-o]').forEach((i) => i.addEventListener('input', () => { opts[i.dataset.o] = i.value; }));
    sheet.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { opts.splice(Number(b.dataset.rm), 1); draw(); }));
    sheet.querySelector('[data-add]')?.addEventListener('click', () => { opts.push(''); draw(); sheet.querySelector(`[data-o="${opts.length - 1}"]`).focus(); });
    sheet.querySelector('#pl-ok').addEventListener('click', async () => {
      const err = sheet.querySelector('#pl-err');
      const clean = opts.map((o) => o.trim()).filter(Boolean);
      const question = sheet.querySelector('#pl-q').value.trim();
      const closeVal = sheet.querySelector('#pl-closes').value;
      const closesAt = closeVal ? new Date(closeVal).getTime() : 0;
      if (!question) { err.textContent = 'Escribe la pregunta.'; return; }
      if (clean.length < 2) { err.textContent = 'Hacen falta al menos dos opciones.'; return; }
      if (new Set(clean.map((o) => o.toLowerCase())).size !== clean.length) { err.textContent = 'Hay opciones repetidas.'; return; }
      if (closesAt && closesAt < Date.now() + 60e3) { err.textContent = 'La fecha de cierre debe ser futura.'; return; }
      const ok = sheet.querySelector('#pl-ok');
      ok.disabled = true;
      try {
        await call('poll-create', { q: question, desc: sheet.querySelector('#pl-desc').value, opts: clean, closes: closesAt });
        closeSheet();
        await refresh();
        toast('Encuesta publicada');
      } catch (e) { err.textContent = errorText(e); ok.disabled = false; }
    });
  };
  draw();
  setTimeout(() => sheet.querySelector('#pl-q').focus(), 60);
}

// ----- Gestión (cargos) -----

const shareLink = () => `${location.origin}${location.pathname}?c=${st.community.pub}`;

function renderAdmin(body) {
  const pres = isPres();
  const units = st.units || [];
  const reqs = st.requests || [];
  const presU = units.find((u) => u.role === 'pres');
  const viceU = units.find((u) => u.role === 'vice');
  body.innerHTML = `
    <section class="card stack">
      <p class="label">Comunidad</p>
      <div class="row-top wrap"><b class="com-name">${esc(st.community.name)}</b>
        ${pres ? `<button class="ghost-btn sm-btn" type="button" data-rename>${icon('edit', 15)} Cambiar nombre</button>` : ''}</div>
      <div class="pub-code"><small>Código de la comunidad</small><b>${esc(st.community.pub)}</b></div>
      <p class="small muted">Ponlo en el portal o en el ascensor: con él, cada vecino pide su código desde la app sin dar datos personales. Las solicitudes te llegan aquí.</p>
      <div class="row-btns">
        <button class="ghost-btn sm-btn" type="button" data-copy-pub>${icon('copy', 15)} Copiar código</button>
        <button class="ghost-btn sm-btn" type="button" data-share>${icon('share', 15)} Compartir enlace</button>
      </div>
    </section>

    <p class="section-title">Solicitudes de código ${reqs.length ? `(${reqs.length})` : ''}</p>
    ${reqs.length ? `<div class="rows">${reqs.map((r) => {
      const exists = units.find((u) => sameLabel(u.label, r.label));
      return `<div class="row">
        <span class="avatar">${esc(r.label)}</span>
        <span class="row-main"><span class="row-top"><b>${esc(r.label)}</b><small>${shortWhen(r.t)}</small></span>
          <span class="row-sub wrap">${exists ? 'Ya dada de alta: código nuevo' : 'Vivienda nueva'}</span></span>
        <button class="ghost-btn sm-btn" type="button" data-req-ok="${r.id}">Generar</button>
        <button class="icon-btn sm" type="button" data-req-del="${r.id}" aria-label="Descartar">${icon('close', 16)}</button>
      </div>`;
    }).join('')}</div>` : '<p class="small muted" style="margin:0 2px">No hay solicitudes pendientes.</p>'}

    <p class="section-title">Viviendas (${units.length})</p>
    <div class="row-btns"><button class="done-btn" type="button" data-add-units>${icon('plus', 18, 1.8)} Añadir viviendas</button></div>
    <div class="rows">${units.map((u) => `
      <button class="row" type="button" data-unit="${u.mid}">
        <span class="avatar ${u.role ? 'gold' : ''}">${esc(u.label)}</span>
        <span class="row-main">
          <span class="row-top"><b>Vivienda ${esc(u.label)}</b>${u.role ? `<span class="chip gold">${ROLE_NAME[u.role]}</span>` : ''}${u.blocked ? '<span class="chip danger">Bloqueada</span>' : ''}</span>
          <span class="row-sub">${u.seen ? `Último acceso: ${shortWhen(u.seen)}` : 'Aún no ha entrado'}</span>
        </span>
      </button>`).join('')}</div>

    <p class="section-title">Cargos</p>
    <section class="card stack">
      <div class="row-top"><span class="muted small" style="flex:1">Presidente</span><b style="flex:0 0 auto">${presU ? `Vivienda ${esc(presU.label)}` : '—'}</b></div>
      <div class="row-top"><span class="muted small" style="flex:1">Vicepresidente</span><b style="flex:0 0 auto">${viceU ? `Vivienda ${esc(viceU.label)}` : 'Sin nombrar'}</b></div>
      ${pres ? `<p class="small muted">Al terminar tu mandato, asigna los cargos a las viviendas nuevas. Dejarás de tener permisos de presidente en cuanto lo confirmes.</p>
      <button class="ghost-btn" type="button" data-handover>${icon('crown', 18)} Modificar presidente y vicepresidente</button>`
      : '<p class="small muted">Solo el presidente puede cambiar los cargos y el nombre de la comunidad.</p>'}
    </section>`;

  body.querySelector('[data-rename]')?.addEventListener('click', openRenameSheet);
  body.querySelector('[data-copy-pub]').addEventListener('click', () => copyText(st.community.pub, 'Código copiado'));
  body.querySelector('[data-share]').addEventListener('click', async () => {
    const text = `App de ${st.community.name}: pide aquí el código de tu vivienda (código de la comunidad: ${st.community.pub})`;
    if (navigator.share) { try { await navigator.share({ title: st.community.name, text, url: shareLink() }); } catch (_) { /* cancelado */ } }
    else copyText(`${text}\n${shareLink()}`, 'Enlace copiado');
  });
  body.querySelectorAll('[data-req-ok]').forEach((b) => b.addEventListener('click', async () => {
    const r = reqs.find((x) => x.id === b.dataset.reqOk);
    const exists = units.find((u) => sameLabel(u.label, r.label));
    b.disabled = true;
    try {
      if (exists) {
        const { code, label } = await call('unit-code', { mid: exists.mid });
        showCodes([{ label, code }]);
      } else {
        const { codes } = await call('units-add', { labels: [r.label] });
        showCodes(codes);
      }
      refresh();
    } catch (e) { toast(errorText(e)); b.disabled = false; }
  }));
  body.querySelectorAll('[data-req-del]').forEach((b) => b.addEventListener('click', async () => {
    try { await call('req-del', { id: b.dataset.reqDel }); await refresh(); toast('Solicitud descartada'); } catch (e) { toast(errorText(e)); }
  }));
  body.querySelector('[data-add-units]').addEventListener('click', openUnitsSheet);
  body.querySelectorAll('[data-unit]').forEach((b) => b.addEventListener('click', () => openUnitSheet(units.find((u) => u.mid === b.dataset.unit))));
  body.querySelector('[data-handover]')?.addEventListener('click', openHandoverSheet);
}
const sameLabel = (a, b) => a.toLowerCase().replace(/[\s.ºª°-]/g, '') === b.toLowerCase().replace(/[\s.ºª°-]/g, '');

function openRenameSheet() {
  const sheet = openSheet('Nombre de la comunidad');
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">Nombre de la comunidad</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    <input class="title-input" id="rn-name" maxlength="60" value="${esc(st.community.name)}" autocomplete="off" />
    <p class="small muted">Es el nombre que verán todos los vecinos arriba de la app.</p>
    <p class="form-error" id="rn-err" role="alert"></p>
    <div class="editor-actions"><span></span><button class="done-btn" type="button" id="rn-ok">Guardar</button></div>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  const input = sheet.querySelector('#rn-name');
  sheet.querySelector('#rn-ok').addEventListener('click', async () => {
    if (!input.value.trim()) return;
    try { await call('rename', { name: input.value }); closeSheet(); await refresh(); toast('Nombre cambiado'); } catch (e) { sheet.querySelector('#rn-err').textContent = errorText(e); }
  });
  setTimeout(() => input.select(), 60);
}

// Alta de viviendas: generadas por plantas y puertas, o escritas una por línea
function openUnitsSheet() {
  const sheet = openSheet('Añadir viviendas');
  let mode = 'gen';
  const draw = () => {
    sheet.innerHTML = `
      <div class="sheet-head"><h2 class="sheet-title">Añadir viviendas</h2>
        <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
      <div class="seg" role="group">
        <button type="button" data-mode="gen" class="${mode === 'gen' ? 'on' : ''}">Por plantas</button>
        <button type="button" data-mode="list" class="${mode === 'list' ? 'on' : ''}">Escribirlas</button>
      </div>
      ${mode === 'gen' ? `
      <div class="gen-grid">
        <div class="stack"><p class="field-label">Desde la planta</p><input class="title-input" id="g-from" type="number" inputmode="numeric" min="0" max="60" value="1" /></div>
        <div class="stack"><p class="field-label">Hasta la planta</p><input class="title-input" id="g-to" type="number" inputmode="numeric" min="0" max="60" value="4" /></div>
      </div>
      <p class="field-label">Puertas de cada planta (separadas por comas)</p>
      <input class="title-input" id="g-doors" value="A, B, C, D" autocomplete="off" />
      <label class="check-row"><input type="checkbox" id="g-bajo" /> <span>Añadir también los bajos (Bajo A, Bajo B…)</span></label>`
      : `<p class="field-label">Una vivienda por línea</p>
      <textarea class="text-input" id="g-list" rows="7" placeholder="1º A&#10;1º B&#10;Bajo izq.&#10;Local 1"></textarea>`}
      <p class="small muted" id="g-preview"></p>
      <p class="form-error" id="g-err" role="alert"></p>
      <div class="editor-actions"><span></span><button class="done-btn" type="button" id="g-ok" disabled>Generar códigos</button></div>`;
    sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
    sheet.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; draw(); }));
    const labels = () => {
      if (mode === 'list') return sheet.querySelector('#g-list').value.split('\n').map((s) => s.trim()).filter(Boolean);
      const from = Math.max(0, Math.min(60, Number(sheet.querySelector('#g-from').value) || 0));
      const to = Math.max(0, Math.min(60, Number(sheet.querySelector('#g-to').value) || 0));
      const doors = sheet.querySelector('#g-doors').value.split(',').map((s) => s.trim()).filter(Boolean);
      const out = [];
      if (sheet.querySelector('#g-bajo').checked) doors.forEach((d) => out.push(`Bajo ${d}`));
      for (let f = Math.min(from, to); f <= Math.max(from, to); f++) if (f > 0) doors.forEach((d) => out.push(`${f}º ${d}`));
      return out;
    };
    const update = () => {
      const ls = labels();
      const existing = (st.units || []).map((u) => u.label);
      const fresh = ls.filter((l) => !existing.some((e) => sameLabel(e, l)));
      sheet.querySelector('#g-preview').textContent = ls.length
        ? `${plural(fresh.length, 'vivienda nueva', 'viviendas nuevas')}${fresh.length ? `: ${fresh.slice(0, 8).join(', ')}${fresh.length > 8 ? '…' : ''}` : ''}${ls.length - fresh.length ? ` (${ls.length - fresh.length} ya existían)` : ''}`
        : '';
      sheet.querySelector('#g-ok').disabled = !fresh.length || fresh.length > 100;
      if (fresh.length > 100) sheet.querySelector('#g-err').textContent = 'Máximo 100 viviendas de cada vez.';
      else sheet.querySelector('#g-err').textContent = '';
    };
    sheet.querySelectorAll('input, textarea').forEach((i) => i.addEventListener('input', update));
    update();
    sheet.querySelector('#g-ok').addEventListener('click', async () => {
      const ok = sheet.querySelector('#g-ok');
      ok.disabled = true;
      try {
        const { codes } = await call('units-add', { labels: labels() });
        await refresh();
        showCodes(codes);
      } catch (e) { sheet.querySelector('#g-err').textContent = errorText(e); ok.disabled = false; }
    });
  };
  draw();
}

// Códigos recién generados: se ven UNA sola vez (el servidor no los guarda legibles)
function showCodes(codes) {
  const sheet = openSheet('Códigos generados');
  const name = st.community.name;
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">${codes.length === 1 ? 'Código generado' : `${codes.length} códigos generados`}</h2></div>
    <p class="note banner">${icon('info', 16)} <span>Imprímelos o anótalos ahora: por seguridad no se pueden volver a ver. Si uno se pierde, genera otro desde la vivienda.</span></p>
    <div class="code-list">${codes.map((c) => `<div class="code-item"><b>${esc(c.label)}</b><code>${esc(c.code)}</code>
      <button class="icon-btn sm" type="button" data-copy="${esc(c.code)}" aria-label="Copiar">${icon('copy', 16)}</button></div>`).join('')}</div>
    <div class="row-btns end">
      <button class="ghost-btn" type="button" data-copy-all>${icon('copy', 18)} Copiar todos</button>
      <button class="ghost-btn" type="button" data-print>${icon('print', 18)} Imprimir tarjetas</button>
      <button class="done-btn" type="button" data-done>Hecho</button>
    </div>`;
  sheet.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copyText(b.dataset.copy, 'Código copiado')));
  sheet.querySelector('[data-copy-all]').addEventListener('click', () => copyText(codes.map((c) => `${c.label}: ${c.code}`).join('\n'), 'Códigos copiados'));
  sheet.querySelector('[data-print]').addEventListener('click', () => printCards(codes, name));
  // Para no perderlos por un toque fuera, solo se cierra con «Hecho»
  sheet.parentElement.onclick = null;
  sheet.querySelector('[data-done]').addEventListener('click', () => confirmSheet({
    title: '¿Has guardado los códigos?', text: 'Al cerrar ya no se podrán volver a ver.', ok: 'Sí, cerrar', cancel: 'Volver',
    run: async () => {}, back: () => showCodes(codes),
  }));
}
function printCards(codes, name) {
  const url = `${location.origin}${location.pathname}`;
  $('print').innerHTML = codes.map((c) => `
    <div class="print-card">
      <span class="pc-com">${esc(name)}</span>
      <span class="pc-unit">${esc(c.label)}</span>
      <span class="pc-label">Tu código de acceso</span>
      <span class="pc-code">${esc(c.code)}</span>
      <span class="pc-help">Abre ${esc(url)} en el móvil, pulsa «Ya tengo mi código» y escríbelo. Es personal de tu vivienda: no lo compartas.</span>
    </div>`).join('');
  track('/imprimir');
  setTimeout(() => window.print(), 50);
}

function openUnitSheet(u) {
  const sheet = openSheet(`Vivienda ${u.label}`);
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">Vivienda ${esc(u.label)}</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    <p class="small muted">${u.role ? `${ROLE_NAME[u.role]} de la comunidad. ` : ''}${u.seen ? `Último acceso: ${when(u.seen)}.` : 'Aún no ha entrado en la app.'}</p>
    <div class="stack">
      <button class="ghost-btn" type="button" data-code>${icon('key', 18)} Generar un código nuevo</button>
      ${u.mid !== st.me.mid ? `<button class="ghost-btn" type="button" data-write>${icon('mail', 18)} Escribir a esta vivienda</button>` : ''}
      ${u.role ? '' : `<button class="ghost-btn ${u.blocked ? '' : 'danger'}" type="button" data-block>${icon('ban', 18)} ${u.blocked ? 'Desbloquear en el chat' : 'Bloquear en el chat'}</button>
      <button class="ghost-btn danger" type="button" data-del>${icon('trash', 18)} Eliminar la vivienda</button>`}
    </div>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  sheet.querySelector('[data-code]').addEventListener('click', () => confirmSheet({
    title: '¿Generar un código nuevo?', text: `El código actual de la vivienda ${u.label} dejará de funcionar${u.mid === st.me.mid ? ' (también en este dispositivo: entrarás con el nuevo)' : ''}.`, ok: 'Generar',
    run: async () => {
      const { code, label } = await call('unit-code', { mid: u.mid });
      if (u.mid === st.me.mid) { sess.code = code; persist(); }
      showCodes([{ label, code }]);
      refresh();
    },
  }));
  sheet.querySelector('[data-write]')?.addEventListener('click', () => { closeSheet(); openView('thread', u.mid); });
  sheet.querySelector('[data-block]')?.addEventListener('click', async () => {
    try { await call('block', { mid: u.mid, blocked: !u.blocked }); closeSheet(); await refresh(); toast(u.blocked ? 'Desbloqueada' : 'Bloqueada en el chat'); } catch (e) { toast(errorText(e)); }
  });
  sheet.querySelector('[data-del]')?.addEventListener('click', () => confirmSheet({
    title: `¿Eliminar la vivienda ${u.label}?`, text: 'Su código dejará de funcionar y se borrará su conversación con la presidencia. Sus votos en encuestas abiertas dejarán de contar.', ok: 'Eliminar', danger: true,
    run: async () => { await call('unit-del', { mid: u.mid }); await refresh(); toast('Vivienda eliminada'); },
  }));
}

// Cambio de cargos: lo lanza el presidente al terminar su mandato
function openHandoverSheet() {
  const units = st.units || [];
  const cur = { pres: units.find((u) => u.role === 'pres')?.mid || '', vice: units.find((u) => u.role === 'vice')?.mid || '' };
  const sheet = openSheet('Modificar presidente');
  const options = (sel, none) => `${none ? `<option value="">${none}</option>` : ''}${units.map((u) => `<option value="${u.mid}" ${u.mid === sel ? 'selected' : ''}>Vivienda ${esc(u.label)}</option>`).join('')}`;
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">Nuevos cargos</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    <p class="small muted">Elige las viviendas que ocuparán los cargos. Si la vivienda aún no está dada de alta, añádela antes en «Viviendas».</p>
    <p class="field-label">Presidente</p>
    <select class="select" id="ho-pres">${options(cur.pres)}</select>
    <p class="field-label">Vicepresidente</p>
    <select class="select" id="ho-vice">${options(cur.vice, 'Sin vicepresidente')}</select>
    <p class="small muted">Se publicará un aviso en el tablón con los nuevos cargos. Las conversaciones privadas con la presidencia pasarán a verlas los nuevos cargos.</p>
    <p class="form-error" id="ho-err" role="alert"></p>
    <div class="editor-actions"><span></span><button class="done-btn" type="button" id="ho-ok">Confirmar cambio</button></div>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  sheet.querySelector('#ho-ok').addEventListener('click', () => {
    const pres = sheet.querySelector('#ho-pres').value;
    const vice = sheet.querySelector('#ho-vice').value;
    const err = sheet.querySelector('#ho-err');
    if (vice && vice === pres) { err.textContent = 'El presidente y el vicepresidente deben ser viviendas distintas.'; return; }
    if (pres === cur.pres && vice === cur.vice) { err.textContent = 'No has cambiado nada.'; return; }
    const pl = units.find((u) => u.mid === pres).label;
    const vl = vice ? units.find((u) => u.mid === vice).label : '';
    const leaving = pres !== st.me.mid;
    confirmSheet({
      title: '¿Confirmar los nuevos cargos?',
      text: `Presidente: vivienda ${pl}. ${vice ? `Vicepresidente: vivienda ${vl}.` : 'Sin vicepresidente.'}${leaving ? ` Tú dejarás de ser presidente${vice === st.me.mid ? ' y pasarás a vicepresidente' : ''}.` : ''}`,
      ok: 'Confirmar',
      run: async () => {
        await call('handover', { pres, vice });
        await refresh();
        if (!isAdmin()) closeView();
        else renderView();
        toast('Cargos actualizados');
      },
    });
  });
}

// ---------- Hojas (ventanas inferiores) ----------

function openSheet(label) {
  closeSheet();
  const back = document.createElement('div');
  back.className = 'sheet-backdrop';
  back.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}"></div>`;
  document.body.append(back);
  back.onclick = (e) => { if (e.target === back) closeSheet(); };
  return back.firstElementChild;
}
function closeSheet() {
  document.querySelector('.sheet-backdrop')?.remove();
}
function openCenter(html) {
  closeSheet();
  const back = document.createElement('div');
  back.className = 'sheet-backdrop center';
  back.innerHTML = `<div class="sheet center-sheet" role="dialog" aria-modal="true">${html}</div>`;
  document.body.append(back);
  back.onclick = (e) => { if (e.target === back) closeSheet(); };
  return back.firstElementChild;
}
function openNotice(title, text) {
  const s = openCenter(`<span class="logo-slot">${logoSVG(56)}</span><h2 class="sheet-title">${esc(title)}</h2><p class="small">${esc(text)}</p>
    <div class="center-actions"><button class="done-btn" type="button" data-close>Entendido</button></div>`);
  s.querySelector('[data-close]').addEventListener('click', closeSheet);
}
function confirmSheet({ title, text, ok = 'Aceptar', cancel = 'Cancelar', danger = false, run, back }) {
  const s = openCenter(`<h2 class="sheet-title">${esc(title)}</h2>${text ? `<p class="small muted">${esc(text)}</p>` : ''}
    <p class="form-error" data-err role="alert"></p>
    <div class="center-actions"><button class="ghost-btn" type="button" data-no>${esc(cancel)}</button><button class="done-btn ${danger ? 'danger' : ''}" type="button" data-yes>${esc(ok)}</button></div>`);
  if (back) s.parentElement.onclick = null;
  s.querySelector('[data-no]').addEventListener('click', () => (back ? back() : closeSheet()));
  s.querySelector('[data-yes]').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    try {
      // `run` puede abrir otra hoja (p. ej. los códigos): solo se cierra esta si sigue abierta
      await run();
      if (s.isConnected) closeSheet();
    } catch (err) {
      s.querySelector('[data-err]').textContent = errorText(err);
      e.currentTarget.disabled = false;
    }
  });
}

// ---------- Menú ⋯ ----------

function menuItems() {
  const items = [{ icon: 'palette', label: 'Opciones de visualización', run: openDisplaySheet }];
  if (!sess.code) items.push({ icon: 'mail', label: 'Solicitar mi código', run: openRequestSheet });
  if (sess.code && st) items.push({ icon: 'logout', label: 'Salir de esta comunidad', danger: true, run: () => confirmSheet({
    title: '¿Salir de la comunidad?', text: 'Se quitará tu código de este dispositivo. Para volver a entrar necesitarás escribirlo de nuevo.', ok: 'Salir', danger: true,
    run: async () => logout(),
  }) });
  items.push({ icon: 'info', label: 'Información', run: openInfoSheet });
  return items;
}
function openMenu() {
  const menu = $('menu');
  const items = menuItems();
  menu.innerHTML = items.map((m, i) => `<button class="menu-item ${m.danger ? 'danger' : ''}" role="menuitem" data-i="${i}">${icon(m.icon, 20)}<span>${m.label}</span></button>`).join('');
  menu.querySelectorAll('.menu-item').forEach((b) => b.addEventListener('click', () => { closeMenu(); items[b.dataset.i].run(); }));
  const r = $('menu-btn').getBoundingClientRect();
  menu.style.top = `${r.bottom + 6}px`;
  menu.style.right = `${Math.max(8, window.innerWidth - r.right)}px`;
  menu.hidden = false;
  $('menu-btn').setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  $('menu').hidden = true;
  $('menu-btn').setAttribute('aria-expanded', 'false');
}
$('menu-btn').addEventListener('click', (e) => { e.stopPropagation(); if ($('menu').hidden) openMenu(); else closeMenu(); });
document.addEventListener('click', (e) => { if (!$('menu').hidden && !e.target.closest('#menu')) closeMenu(); });
window.addEventListener('resize', closeMenu);

function openInfoSheet() {
  track('/informacion');
  const name = st?.community?.name || APP_NAME;
  const s = openCenter(`
    <span class="logo-slot">${logoSVG(56)}</span>
    <h2 class="sheet-title">${esc(name)}</h2>
    <p class="small muted">Versión ${APP_VERSION}</p>
    <p class="small">La app de tu comunidad de vecinos: tablón de anuncios de la presidencia, chat con todos los vecinos, encuestas y un buzón privado para escribir al presidente y al vicepresidente.</p>
    <p class="small muted">Nadie da su nombre ni su teléfono: cada vivienda se identifica con el código que deja la presidencia en su buzón. Las conversaciones con la presidencia solo las leen el presidente y el vicepresidente, y el voto en las encuestas es secreto.</p>
    <div class="center-actions"><button type="button" class="done-btn" data-close>Cerrar</button></div>`);
  s.querySelector('[data-close]').addEventListener('click', closeSheet);
}

// ---------- Opciones de visualización (modo y fondo) ----------

const WALLS = {
  cielo: { name: 'Cielo', c: ['96 165 250', '191 219 254', '37 99 235', '56 189 248'] },
  jardin: { name: 'Jardín', c: ['74 222 128', '187 247 208', '22 163 74', '45 212 191'] },
  teja: { name: 'Teja', c: ['251 146 60', '254 215 170', '234 88 12', '225 29 72'] },
  lavanda: { name: 'Lavanda', c: ['167 139 250', '221 214 254', '139 92 246', '236 72 153'] },
};
const lightQuery = matchMedia('(prefers-color-scheme: light)');
let display = { theme: 'auto', wall: 'cielo', ...load(DISPLAY_KEY, {}) };
if (!WALLS[display.wall]) display.wall = 'cielo';
function applyDisplay() {
  const light = display.theme === 'light' || (display.theme === 'auto' && lightQuery.matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  document.documentElement.dataset.wall = display.wall;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', light ? '#f3f7fd' : '#070b14');
}
lightQuery.addEventListener('change', () => { if (display.theme === 'auto') applyDisplay(); });
function wallPreview(key) {
  const [c1, c2, c3, c4] = WALLS[key].c;
  const light = document.documentElement.dataset.theme === 'light';
  const a = light ? 0.4 : 0.5;
  const base = light ? '#f3f7fd' : '#070b14';
  return `radial-gradient(70% 60% at 15% 10%, rgb(${c1} / ${a}), transparent 70%), radial-gradient(60% 55% at 90% 25%, rgb(${c2} / ${a * 0.8}), transparent 72%),
    radial-gradient(70% 60% at 75% 95%, rgb(${c3} / ${a * 0.85}), transparent 70%), radial-gradient(60% 55% at 5% 85%, rgb(${c4} / ${a * 0.8}), transparent 72%), ${base}`;
}
function openDisplaySheet() {
  track('/visualizacion');
  const sheet = openSheet('Opciones de visualización');
  const draw = () => {
    sheet.innerHTML = `
      <h2 class="sheet-title">Opciones de visualización</h2>
      <p class="opt-label">Modo</p>
      <div class="seg" role="group" aria-label="Modo">
        ${[['dark', 'Oscuro'], ['light', 'Claro'], ['auto', 'Automático']].map(([v, l]) =>
          `<button type="button" data-theme-opt="${v}" class="${display.theme === v ? 'on' : ''}" aria-pressed="${display.theme === v}">${l}</button>`).join('')}
      </div>
      <p class="muted small">${display.theme === 'auto' ? 'Sigue el modo claro u oscuro del sistema.' : '&nbsp;'}</p>
      <p class="opt-label">Fondo</p>
      <div class="walls">
        ${Object.entries(WALLS).map(([k, w]) =>
          `<button type="button" class="wall ${display.wall === k ? 'on' : ''}" data-wall-opt="${k}" style="background:${wallPreview(k)}" aria-pressed="${display.wall === k}">${w.name}</button>`).join('')}
      </div>
      <div class="body-actions"><button class="done-btn" type="button" data-done>Listo</button></div>`;
    sheet.querySelectorAll('[data-theme-opt]').forEach((b) => b.addEventListener('click', () => { display.theme = b.dataset.themeOpt; save(DISPLAY_KEY, display); applyDisplay(); draw(); }));
    sheet.querySelectorAll('[data-wall-opt]').forEach((b) => b.addEventListener('click', () => { display.wall = b.dataset.wallOpt; save(DISPLAY_KEY, display); applyDisplay(); draw(); }));
    sheet.querySelector('[data-done]').addEventListener('click', closeSheet);
  };
  draw();
}

// ---------- Arranque: directamente a la pantalla principal (sin pantalla de entrada) ----------

applyDisplay();
renderHome();
if (sess.code) { refresh(); startPolling(); }
else if (linkPub) {
  // Llegó con el enlace de la comunidad: se muestra su nombre y se abre la solicitud
  api('community', { pub: linkPub }).then(({ name }) => { linkName = name; renderHome(); }).catch(() => {});
  setTimeout(openRequestSheet, 300);
}
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
