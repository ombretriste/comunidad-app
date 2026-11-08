'use strict';

// Versión de la app (se ve en Información). Arreglos y ajustes: 0.x.y; novedades: 0.x.0.
const APP_VERSION = '0.4.1';
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
  clip: '<path d="M19 11.5l-7.4 7.4a4.6 4.6 0 0 1-6.5-6.5l7.8-7.8a3.1 3.1 0 0 1 4.4 4.4l-7.6 7.6a1.5 1.5 0 0 1-2.2-2.2l7-7"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4 17v1.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V17"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5M8 10.5h5M10.5 8v5"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4.5 4 3.5 2.5-2 4.5 4"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  bellOff: '<path d="M8.5 5.2A6 6 0 0 1 18 11v4M6 11v5.5l-1.5 2h13"/><path d="M10 20.5a2 2 0 0 0 4 0"/><path d="M4 4l16 16"/>',
  dots: '<circle cx="12" cy="5.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="18.5" r="1.5" fill="currentColor"/>',
  pdf: '<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5"/><path d="M9 13h6M9 16.5h4"/>',
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
    'label-taken': 'Ya hay una vivienda o local con ese nombre.',
    'file-missing': 'Un archivo no terminó de subirse. Inténtalo de nuevo.',
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
  if (pushPref.on || pushPref.device) disablePush(true);
  comIcon = null;
  save(ICON_KEY, null);
  sess = { code: '', seen: emptySeen(), cache: null };
  st = null;
  persist();
  closeView();
  closeSheet();
  renderHome();
  if (!silent) toast('Has salido de la comunidad en este dispositivo');
}

// Código de la comunidad recibido en un enlace (?c=XXXXXX): sirve para pedir el código propio
const params = new URLSearchParams(location.search);
const linkPub = (params.get('c') || '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 6);
let linkGo = params.get('go') || ''; // sección que abrir al tocar un aviso
if (location.search) history.replaceState(null, '', location.pathname);
let linkName = '';

// ---------- Pantalla principal ----------

function setBrand() {
  const name = st?.community?.name || (sess.code ? '' : linkName) || APP_NAME;
  $('brand').textContent = name;
  document.title = name;
  // Icono de la comunidad (si lo hay) en lugar del logo de la app
  const slot = document.querySelector('.topbar .logo-slot');
  const want = sess.code && comIcon?.data ? `i${comIcon.v}` : 'logo';
  if (slot.dataset.shown !== want) {
    slot.dataset.shown = want;
    slot.innerHTML = want === 'logo' ? logoSVG(30) : `<img class="com-icon" src="${comIcon.data}" alt="" width="30" height="30" />`;
  }
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
    ${pushBannerHTML()}
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
  if (e.target.closest('[data-push]')) return enablePush();
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
      setTimeout(maybeAskPush, 1200);
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
    <p class="small muted">No hace falta ningún dato personal: solo tu vivienda, para que la presidencia sepa en qué buzón dejarte el código.</p>
    <p class="field-label">Código de la comunidad</p>
    <input class="title-input code-input" id="rq-pub" maxlength="6" placeholder="6 letras" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(linkPub)}" />
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
      syncIcon();
    } catch (e) {
      if (e.status === 0) offline = true;
    } finally {
      refreshing = null;
    }
    if (!sess.code) return;
    renderHome();
    if (view && ['board', 'polls', 'threads', 'admin'].includes(view.name)) renderView();
    if (st && linkGo) { const g = linkGo; linkGo = ''; goTo(g); }
    if (st && !offline) setTimeout(maybeAskPush, 900);
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
  clearNotifications();
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
        ${(p.files || []).length ? `<div class="files">${p.files.map((f, i) => `<button class="file-chip" type="button" data-file="${p.id}:${i}">${icon(/pdf/.test(f.type) ? 'pdf' : 'clip', 18)}<span><b>${esc(f.name)}</b><small>${fmtSize(f.size)}</small></span>${icon('download', 16)}</button>`).join('')}</div>` : ''}
        ${admin ? `<div class="post-actions">
          <button class="ghost-btn sm-btn" type="button" data-pin="${p.id}" data-on="${p.pin ? 0 : 1}">${icon('pin', 15)} ${p.pin ? 'Quitar de fijados' : 'Fijar arriba'}</button>
          <button class="ghost-btn sm-btn danger" type="button" data-del="${p.id}">${icon('trash', 15)} Eliminar</button>
        </div>` : ''}
      </article>`).join('') : `<div class="empty"><span class="tile-ico">${icon('board', 28)}</span><h3>Sin anuncios</h3><p>Aquí aparecerán las noticias de la comunidad.</p></div>`}`;
  body.querySelector('[data-new]')?.addEventListener('click', openPostSheet);
  body.querySelectorAll('[data-pin]').forEach((b) => b.addEventListener('click', async () => {
    try { await call('post-pin', { id: b.dataset.pin, pin: b.dataset.on === '1' }); await refresh(); } catch (e) { toast(errorText(e)); }
  }));
  body.querySelectorAll('[data-file]').forEach((b) => b.addEventListener('click', async () => {
    const [pid, i] = b.dataset.file.split(':');
    const f = st.board.find((p) => p.id === pid)?.files?.[i];
    if (!f || b.classList.contains('loading')) return;
    b.classList.add('loading');
    try { await deliverFile(await fetchFile(f), f.name, f.type); } catch (e) { toast(errorText(e)); } finally { b.classList.remove('loading'); }
  }));
  body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => confirmSheet({
    title: '¿Eliminar este anuncio?', text: 'Desaparecerá del tablón para todos los vecinos.', ok: 'Eliminar', danger: true,
    run: async () => { await call('post-del', { id: b.dataset.del }); await refresh(); toast('Anuncio eliminado'); },
  })));
}

function openPostSheet() {
  const sheet = openSheet('Nuevo anuncio');
  const files = []; // { file }
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">Nuevo anuncio</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    <input class="title-input" id="po-title" maxlength="140" placeholder="Título" autocomplete="off" />
    <textarea class="text-input" id="po-text" maxlength="6000" rows="6" placeholder="Escribe el anuncio para todos los vecinos"></textarea>
    <div class="files" id="po-files"></div>
    <button class="ghost-btn" type="button" id="po-attach">${icon('clip', 18)} Adjuntar archivos (actas, circulares…)</button>
    <input type="file" id="po-input" multiple hidden />
    <label class="check-row"><input type="checkbox" id="po-pin" /> <span>Fijarlo arriba del tablón</span></label>
    <p class="form-error" id="po-err" role="alert"></p>
    <div class="editor-actions"><span class="small muted">Firmado como ${ROLE_BOARD[st.me.role]}</span><button class="done-btn" type="button" id="po-ok" disabled>Publicar</button></div>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  const title = sheet.querySelector('#po-title');
  const text = sheet.querySelector('#po-text');
  const ok = sheet.querySelector('#po-ok');
  const err = sheet.querySelector('#po-err');
  const input = sheet.querySelector('#po-input');
  const check = () => { ok.disabled = !(title.value.trim() || text.value.trim() || files.length); };
  const drawFiles = () => {
    sheet.querySelector('#po-files').innerHTML = files.map((f, i) => `<div class="file-chip">${icon(/pdf/.test(f.type) ? 'pdf' : 'clip', 18)}<span><b>${esc(f.name)}</b><small>${fmtSize(f.size)}</small></span>
      <button class="icon-btn sm" type="button" data-rm="${i}" aria-label="Quitar">${icon('close', 15)}</button></div>`).join('');
    sheet.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { files.splice(Number(b.dataset.rm), 1); drawFiles(); }));
    sheet.querySelector('#po-attach').hidden = files.length >= 5;
    check();
  };
  [title, text].forEach((i) => i.addEventListener('input', check));
  sheet.querySelector('#po-attach').addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    err.textContent = '';
    for (const f of input.files) {
      if (files.length >= 5) { err.textContent = 'Como máximo 5 archivos por anuncio.'; break; }
      if (f.size > MAX_FILE_BYTES) { err.textContent = `«${f.name}» ocupa más de 10 MB.`; continue; }
      files.push(f);
    }
    input.value = '';
    drawFiles();
  });
  ok.addEventListener('click', async () => {
    ok.disabled = true;
    err.textContent = '';
    try {
      const metas = [];
      for (const [i, f] of files.entries()) {
        ok.textContent = `Subiendo ${i + 1} de ${files.length}…`;
        metas.push(await uploadFile(f.name, f.type, new Uint8Array(await f.arrayBuffer())));
      }
      ok.textContent = 'Publicando…';
      await call('post', { title: title.value, text: text.value, pin: sheet.querySelector('#po-pin').checked, files: metas });
      closeSheet();
      await refresh();
      toast('Anuncio publicado');
    } catch (e) { err.textContent = errorText(e); ok.disabled = false; ok.textContent = 'Publicar'; }
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
      <p class="label">Nombre e icono</p>
      <div class="identity">
        <span class="icon-preview">${comIcon?.data ? `<img src="${comIcon.data}" alt="" />` : logoSVG(56)}</span>
        <span class="tile-text"><b class="com-name">${esc(st.community.name)}</b>
          <small>${comIcon?.data ? 'El nombre y el icono salen arriba en la app y en todos los documentos PDF.' : 'El nombre sale arriba en la app y en los PDF. Elige un icono de tu galería para que salga junto a él.'}</small></span>
      </div>
      ${pres ? `<div class="row-btns">
        <button class="ghost-btn sm-btn" type="button" data-rename>${icon('edit', 15)} Cambiar nombre</button>
        <button class="ghost-btn sm-btn" type="button" data-icon>${icon('image', 15)} ${comIcon?.data ? 'Cambiar icono' : 'Elegir icono'}</button>
        ${comIcon?.data ? `<button class="ghost-btn sm-btn danger" type="button" data-icon-del>${icon('trash', 15)} Quitar icono</button>` : ''}
      </div>` : '<p class="small muted">Solo el presidente puede cambiar el nombre y el icono.</p>'}
    </section>

    <section class="card stack">
      <p class="label">Código de la comunidad</p>
      <div class="pub-code"><small>Código de la comunidad</small><b>${esc(st.community.pub)}</b></div>
      <p class="small muted">Compártelo con los vecinos: con él, cada uno pide su código desde la app sin dar datos personales. Las solicitudes te llegan aquí y el código se le deja en su buzón.</p>
      <div class="row-btns">
        <button class="ghost-btn sm-btn" type="button" data-copy-pub>${icon('copy', 15)} Copiar código</button>
        <button class="ghost-btn sm-btn" type="button" data-share>${icon('share', 15)} Compartir enlace</button>
      </div>
    </section>

    <button class="row docs-row" type="button" data-docs>
      <span class="tile-ico">${icon('pdf', 22)}</span>
      <span class="row-main"><span class="row-top"><b>Documentos</b></span><span class="row-sub wrap">Convocatorias de junta, comisión de obras, listado de asistencia, comunicados y aviso de la app, en PDF o en el tablón.</span></span>
    </button>

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
    <div class="row-btns"><button class="done-btn" type="button" data-add-units>${icon('plus', 18, 1.8)} Añadir viviendas o locales</button></div>
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
  body.querySelector('[data-icon]')?.addEventListener('click', pickIcon);
  body.querySelector('[data-docs]').addEventListener('click', openDocsSheet);
  body.querySelector('[data-icon-del]')?.addEventListener('click', () => confirmSheet({
    title: '¿Quitar el icono?', text: 'Volverá a salir el logo de la app.', ok: 'Quitar', danger: true,
    run: async () => { const r = await call('icon-set', { data: '' }); st.community.iconV = r.v; comIcon = null; save(ICON_KEY, null); setBrand(); renderView(); },
  }));
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

// Alta de viviendas y locales: generadas por plantas y puertas, o escritas una por línea
const DOOR_PRESETS = ['A, B, C, D', 'A, B', 'Izquierda, Derecha', 'Izquierda, Centro, Derecha'];
function openUnitsSheet() {
  const sheet = openSheet('Añadir viviendas');
  let mode = 'gen';
  const draw = () => {
    sheet.innerHTML = `
      <div class="sheet-head"><h2 class="sheet-title">Añadir viviendas y locales</h2>
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
      <div class="row-btns">${DOOR_PRESETS.map((d) => `<button class="ghost-btn sm-btn" type="button" data-doors="${esc(d)}">${esc(d)}</button>`).join('')}</div>
      <label class="check-row"><input type="checkbox" id="g-bajo" /> <span>Añadir también los bajos (Bajo A, Bajo Izquierda…)</span></label>
      <div class="gen-grid">
        <div class="stack"><p class="field-label">Locales</p><input class="title-input" id="g-locals" type="number" inputmode="numeric" min="0" max="50" value="0" /></div>
        <p class="small muted" style="align-self:end;padding-bottom:12px">Se llamarán Local 1, Local 2…</p>
      </div>`
      : `<p class="field-label">Una vivienda por línea</p>
      <textarea class="text-input" id="g-list" rows="7" placeholder="1º Izquierda&#10;1º Derecha&#10;Ático&#10;Local 1"></textarea>`}
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
      const locals = Math.max(0, Math.min(50, Number(sheet.querySelector('#g-locals').value) || 0));
      const out = [];
      if (sheet.querySelector('#g-bajo').checked) doors.forEach((d) => out.push(`Bajo ${d}`));
      for (let f = Math.min(from, to); f <= Math.max(from, to); f++) if (f > 0) doors.forEach((d) => out.push(`${f}º ${d}`));
      for (let l = 1; l <= locals; l++) out.push(`Local ${l}`);
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
    sheet.querySelectorAll('[data-doors]').forEach((b) => b.addEventListener('click', () => { sheet.querySelector('#g-doors').value = b.dataset.doors; update(); }));
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
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">${codes.length === 1 ? 'Código generado' : `${codes.length} códigos generados`}</h2></div>
    <p class="note banner">${icon('info', 16)} <span>Descarga las tarjetas en PDF o anota los códigos ahora: por seguridad no se pueden volver a ver. Si uno se pierde, genera otro desde la vivienda.</span></p>
    <div class="code-list">${codes.map((c) => `<div class="code-item"><b>${esc(c.label)}</b><code>${esc(c.code)}</code>
      <button class="icon-btn sm" type="button" data-copy="${esc(c.code)}" aria-label="Copiar">${icon('copy', 16)}</button></div>`).join('')}</div>
    <div class="row-btns end">
      <button class="ghost-btn" type="button" data-copy-all>${icon('copy', 18)} Copiar todos</button>
      <button class="ghost-btn" type="button" data-print>${icon('pdf', 18)} Tarjetas en PDF</button>
      <button class="done-btn" type="button" data-done>Hecho</button>
    </div>`;
  sheet.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copyText(b.dataset.copy, 'Código copiado')));
  sheet.querySelector('[data-copy-all]').addEventListener('click', () => copyText(codes.map((c) => `${c.label}: ${c.code}`).join('\n'), 'Códigos copiados'));
  sheet.querySelector('[data-print]').addEventListener('click', () => downloadCards(codes));
  // Para no perderlos por un toque fuera, solo se cierra con «Hecho»
  sheet.parentElement.onclick = null;
  sheet.querySelector('[data-done]').addEventListener('click', () => confirmSheet({
    title: '¿Has guardado los códigos?', text: 'Al cerrar ya no se podrán volver a ver.', ok: 'Sí, cerrar', cancel: 'Volver',
    run: async () => {}, back: () => showCodes(codes),
  }));
}
function openUnitSheet(u) {
  const sheet = openSheet(`Vivienda ${u.label}`);
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">Vivienda ${esc(u.label)}</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    <p class="small muted">${u.role ? `${ROLE_NAME[u.role]} de la comunidad. ` : ''}${u.seen ? `Último acceso: ${when(u.seen)}.` : 'Aún no ha entrado en la app.'}</p>
    <div class="stack">
      <button class="ghost-btn" type="button" data-rename-unit>${icon('edit', 18)} Cambiar el nombre</button>
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
  sheet.querySelector('[data-rename-unit]').addEventListener('click', () => openUnitRename(u));
  sheet.querySelector('[data-block]')?.addEventListener('click', async () => {
    try { await call('block', { mid: u.mid, blocked: !u.blocked }); closeSheet(); await refresh(); toast(u.blocked ? 'Desbloqueada' : 'Bloqueada en el chat'); } catch (e) { toast(errorText(e)); }
  });
  sheet.querySelector('[data-del]')?.addEventListener('click', () => confirmSheet({
    title: `¿Eliminar la vivienda ${u.label}?`, text: 'Su código dejará de funcionar y se borrará su conversación con la presidencia. Sus votos en encuestas abiertas dejarán de contar.', ok: 'Eliminar', danger: true,
    run: async () => { await call('unit-del', { mid: u.mid }); await refresh(); toast('Vivienda eliminada'); },
  }));
}

// Nombre de una vivienda o local (p. ej. «Local 1» → «Local izquierda»). El código no cambia.
function openUnitRename(u) {
  const sheet = openSheet('Cambiar el nombre');
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">Cambiar el nombre</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    <input class="title-input" id="ur-label" maxlength="24" value="${esc(u.label)}" autocomplete="off" />
    <p class="small muted">Es el nombre con el que se ve esta vivienda o local en el chat, en los mensajes y en los documentos. Su código sigue siendo el mismo.</p>
    <p class="form-error" id="ur-err" role="alert"></p>
    <div class="editor-actions"><button class="ghost-btn" type="button" data-back>Volver</button><button class="done-btn" type="button" id="ur-ok">Guardar</button></div>`;
  const input = sheet.querySelector('#ur-label');
  const err = sheet.querySelector('#ur-err');
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  sheet.querySelector('[data-back]').addEventListener('click', () => openUnitSheet(u));
  input.addEventListener('input', () => { err.textContent = ''; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sheet.querySelector('#ur-ok').click(); });
  sheet.querySelector('#ur-ok').addEventListener('click', async () => {
    const label = input.value.trim();
    if (!label) { err.textContent = 'Escribe un nombre.'; return; }
    if (label === u.label) { closeSheet(); return; }
    try {
      await call('unit-rename', { mid: u.mid, label });
      closeSheet();
      await refresh();
      toast(`Ahora se llama «${label}»`);
    } catch (e) { err.textContent = errorText(e); }
  });
  setTimeout(() => input.select(), 60);
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

// ---------- Avisos push ----------
// El servidor deja el texto de cada aviso en el buzón de este dispositivo y manda un push vacío; el
// service worker (sw.js) lo recoge y lo enseña. El identificador del dispositivo se guarda también en
// IndexedDB porque el service worker no puede leer localStorage.

const PUSH_KEY = 'micomunidad:push';
let pushPref = { device: '', on: false, ...load(PUSH_KEY, {}) };
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(navigator.userAgent);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const pushSupported = () => window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
// 'on' | 'off' | 'denied' | 'install' (iPhone sin instalar: Safari solo da avisos a las apps de la pantalla de inicio) | 'unsupported'
function pushState() {
  if (isIOS && !isStandalone()) return 'install';
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return pushPref.on && Notification.permission === 'granted' ? 'on' : 'off';
}
function kvSet(key, value) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('micomunidad', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => {
        const tx = req.result.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      };
      req.onerror = () => resolve(false);
    } catch (_) { resolve(false); }
  });
}
const randomHex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function subscribePush() {
  const reg = await navigator.serviceWorker.ready;
  const { publicKey } = await api('push-key');
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(publicKey) });
  if (!pushPref.device) { pushPref.device = randomHex(16); save(PUSH_KEY, pushPref); }
  await call('subscribe', { device: pushPref.device, sub: sub.toJSON() });
  await kvSet('push', { device: pushPref.device });
}
async function enablePush() {
  const state = pushState();
  if (state === 'install') return openInstallSheet();
  if (state === 'unsupported') return toast('Este navegador no admite avisos');
  if (state === 'denied') return openPushHelp();
  track('/avisos-activar');
  // Se pide el permiso lo primero, aún dentro del toque (iOS lo exige)
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    renderHome();
    toast(perm === 'denied' ? 'Has bloqueado los avisos' : 'Avisos sin activar');
    return;
  }
  try {
    await subscribePush();
    pushPref.on = true;
    save(PUSH_KEY, pushPref);
    toast('Avisos activados');
  } catch (_) {
    toast('No se han podido activar los avisos. Inténtalo de nuevo.');
  }
  renderHome();
}
async function disablePush(quiet) {
  const device = pushPref.device;
  pushPref.on = false;
  save(PUSH_KEY, pushPref);
  kvSet('push', null);
  try { if (device) await api('unsubscribe', { device }); } catch (_) { /* sin conexión */ }
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch (_) { /* nada que quitar */ }
  if (!quiet) { toast('Avisos desactivados'); renderHome(); }
}
// Al abrir la app se renueva la suscripción (las caducadas fallaban sin avisar en otras apps)
function refreshPush() {
  if (pushState() === 'on') subscribePush().catch(() => {});
}
// Al volver a la app se quitan los avisos que ya se ven dentro
async function clearNotifications() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    (await reg?.getNotifications())?.forEach((n) => n.close());
  } catch (_) { /* sin soporte */ }
}

function pushWhat() {
  return isAdmin()
    ? 'Te avisaremos de los mensajes y solicitudes de código de los vecinos, de los mensajes del chat, de las encuestas y del tablón.'
    : 'Te avisaremos de los anuncios del tablón, de las encuestas nuevas y sus resultados, de las respuestas de la presidencia y de los mensajes del chat.';
}
function pushBannerHTML() {
  const s = pushState();
  if (s === 'on') return '';
  const t = {
    off: ['Los avisos están desactivados', 'Actívalos para enterarte al momento de anuncios, encuestas y respuestas.', 'Activar'],
    install: ['Activa los avisos', `Para recibir avisos, primero añade la app a la pantalla de inicio${isIOS ? ' del iPhone' : ''}.`, 'Cómo'],
    denied: ['Los avisos están bloqueados', 'Permite las notificaciones de esta app en los ajustes para recibir avisos.', 'Ayuda'],
    unsupported: ['Sin avisos en este navegador', 'Para recibir avisos, abre la app en Safari (iPhone) o Chrome (Android).', ''],
  }[s];
  return `
    <section class="card push-banner">
      <span class="tile-ico">${icon('bellOff', 22)}</span>
      <span class="tile-text"><b>${t[0]}</b><small>${t[1]}</small></span>
      ${t[2] ? `<button class="done-btn" type="button" data-push>${t[2]}</button>` : ''}
    </section>`;
}
// Al abrir la app, si no están activados, se piden (una vez por apertura)
let pushAsked = false;
function maybeAskPush() {
  if (pushAsked || !sess.code || !st) return;
  pushAsked = true;
  const s = pushState();
  if (s !== 'off' && s !== 'install') return;
  if (document.querySelector('.sheet-backdrop')) return; // no tapar otra ventana
  openPushAsk();
}
function openPushAsk() {
  const install = pushState() === 'install';
  const s = openCenter(`
    <span class="big-ico-sm">${icon('bell', 30, 1.4)}</span>
    <h2 class="sheet-title">Activa los avisos</h2>
    <p class="small">${pushWhat()}</p>
    ${install ? `<p class="small muted">En ${isIOS ? 'el iPhone' : 'este móvil'} los avisos solo funcionan con la app añadida a la pantalla de inicio.</p>` : ''}
    <div class="center-actions"><button class="ghost-btn" type="button" data-no>Ahora no</button><button class="done-btn" type="button" data-yes>${install ? 'Cómo hacerlo' : 'Activar avisos'}</button></div>`);
  s.querySelector('[data-no]').addEventListener('click', closeSheet);
  s.querySelector('[data-yes]').addEventListener('click', () => { closeSheet(); enablePush(); });
}
function openPushSheet() {
  const s = pushState();
  const sheet = openCenter(`
    <span class="big-ico-sm">${icon(s === 'on' ? 'bell' : 'bellOff', 30, 1.4)}</span>
    <h2 class="sheet-title">Avisos ${s === 'on' ? 'activados' : 'desactivados'}</h2>
    <p class="small">${pushWhat()}</p>
    ${s === 'denied' ? '<p class="small muted">Están bloqueados en los ajustes: permite las notificaciones de esta app para poder activarlos.</p>' : ''}
    ${s === 'install' ? '<p class="small muted">Primero añade la app a la pantalla de inicio y ábrela desde su icono.</p>' : ''}
    ${s === 'unsupported' ? '<p class="small muted">Este navegador no admite avisos.</p>' : ''}
    <div class="center-actions">
      <button class="ghost-btn" type="button" data-close>Cerrar</button>
      ${s === 'on' ? '<button class="done-btn danger" type="button" data-off>Desactivar</button>'
      : s === 'unsupported' ? '' : `<button class="done-btn" type="button" data-on>${s === 'install' ? 'Cómo hacerlo' : s === 'denied' ? 'Ayuda' : 'Activar'}</button>`}
    </div>`);
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  sheet.querySelector('[data-off]')?.addEventListener('click', () => { closeSheet(); disablePush(); });
  sheet.querySelector('[data-on]')?.addEventListener('click', () => { closeSheet(); enablePush(); });
}
function openPushHelp() {
  const steps = isIOS
    ? 'En el iPhone: Ajustes › Notificaciones › Mi comunidad › Permitir notificaciones.'
    : isAndroid
      ? 'En Android: mantén pulsado el icono de la app › Información de la aplicación › Notificaciones › Permitir. Si la usas en Chrome, toca el candado junto a la dirección › Notificaciones › Permitir.'
      : 'En el navegador: toca el candado o el icono de ajustes junto a la dirección › Notificaciones › Permitir. Después vuelve a abrir la app.';
  openNotice('Avisos bloqueados', steps);
}
function openInstallSheet() {
  const steps = isIOS
    ? [['share', 'Pulsa el botón <b>Compartir</b> de Safari (abajo en el iPhone, arriba en el iPad).'],
      ['plus', 'Elige <b>Añadir a pantalla de inicio</b> y pulsa <b>Añadir</b>.'],
      ['bell', 'Abre la app desde su icono y pulsa <b>Activar avisos</b>.']]
    : [['dots', 'Pulsa el menú <b>⋮</b> del navegador, arriba a la derecha.'],
      ['plus', 'Elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.'],
      ['bell', 'Abre la app desde su icono y pulsa <b>Activar avisos</b>.']];
  const s = openCenter(`
    <span class="logo-slot">${logoSVG(56)}</span>
    <h2 class="sheet-title">Añade la app a tu pantalla de inicio</h2>
    <ol class="install-steps">${steps.map(([ic, t]) => `<li><span class="step-icon">${icon(ic, 20, 1.5)}</span><span>${t}</span></li>`).join('')}</ol>
    <div class="center-actions"><button class="done-btn" type="button" data-close>Entendido</button></div>`);
  s.querySelector('[data-close]').addEventListener('click', closeSheet);
}

// Abrir una sección desde un aviso (?go=… o mensaje del service worker)
function goTo(go) {
  if (!go || !st) return;
  closeSheet();
  if (go.startsWith('thread:')) { if (isAdmin()) openView('thread', go.slice(7)); return; }
  if (go === 'admin' && !isAdmin()) return;
  if (go === 'contact' && isAdmin()) return openView('threads');
  if (VIEW_TITLES[go] !== undefined) openView(go);
}

// ---------- Archivos (tablón) ----------

const FILE_CHUNK = 1200000;              // trozos de ≈1,2 MB en base64 (lo que acepta la base de datos en una llamada)
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB por archivo
function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const fmtSize = (n) => (n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1).replace('.', ',')} MB`);
const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
async function uploadFile(name, type, bytes, onProgress) {
  const b64 = bytesToB64(bytes);
  const parts = Math.max(1, Math.ceil(b64.length / FILE_CHUNK));
  const fid = randomHex(16);
  for (let i = 0; i < parts; i++) {
    await call('file-put', { fid, part: i, parts, data: b64.slice(i * FILE_CHUNK, (i + 1) * FILE_CHUNK) });
    onProgress?.((i + 1) / parts);
  }
  return { fid, parts, name, type: type || 'application/octet-stream', size: bytes.length };
}
const fileCache = new Map();
async function fetchFile(f) {
  if (fileCache.has(f.fid)) return fileCache.get(f.fid);
  let b64 = '';
  for (let i = 0; i < f.parts; i++) b64 += (await call('file-get', { fid: f.fid, part: i })).data;
  const bytes = b64ToBytes(b64);
  if (bytes.length < 4e6) fileCache.set(f.fid, bytes);
  return bytes;
}
// Entrega un archivo al usuario: en el móvil, menú Compartir (Guardar en Archivos, Imprimir, abrir…);
// en el ordenador, descarga. Si el móvil exige un toque nuevo (tras descargarlo), se pide con un botón.
async function deliverFile(bytes, name, type) {
  const blob = new Blob([bytes], { type: type || 'application/octet-stream' });
  const file = new File([blob], name, { type: blob.type });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) {
      if (e.name === 'AbortError') return;
      if (e.name === 'NotAllowedError') {
        const s = openCenter(`<span class="big-ico-sm">${icon('pdf', 30, 1.4)}</span><h2 class="sheet-title">${esc(name)}</h2><p class="small muted">${fmtSize(bytes.length)}</p>
          <div class="center-actions"><button class="ghost-btn" type="button" data-no>Cerrar</button><button class="done-btn" type="button" data-yes>Abrir o guardar</button></div>`);
        s.querySelector('[data-no]').addEventListener('click', closeSheet);
        s.querySelector('[data-yes]').addEventListener('click', async () => { closeSheet(); try { await navigator.share({ files: [file], title: name }); } catch (_) { /* cancelado */ } });
        return;
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60e3);
}

// ---------- Icono de la comunidad ----------
// Lo elige el presidente de su galería; sale arriba en la app y en todos los PDF junto al nombre.

const ICON_KEY = 'micomunidad:icon';
const ICON_PX = 360;
let comIcon = load(ICON_KEY, null); // { v, data }
async function syncIcon() {
  const v = st?.community?.iconV || 0;
  if (!v) { if (comIcon) { comIcon = null; save(ICON_KEY, null); setBrand(); } return; }
  if (comIcon?.v === v) return;
  try {
    const r = await call('icon-get');
    comIcon = r.data ? { v: r.v, data: r.data } : null;
    save(ICON_KEY, comIcon);
    setBrand();
    if (view?.name === 'admin') renderView();
  } catch (_) { /* se intentará en la próxima actualización */ }
}
// Recorta la imagen al centro en cuadrado, fondo blanco, JPEG pequeño
function imageToIcon(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = ICON_PX;
      const g = c.getContext('2d');
      g.fillStyle = '#fff';
      g.fillRect(0, 0, ICON_PX, ICON_PX);
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      g.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, ICON_PX, ICON_PX);
      URL.revokeObjectURL(url);
      let q = 0.86;
      let data = c.toDataURL('image/jpeg', q);
      while (data.length > 150000 && q > 0.4) { q -= 0.1; data = c.toDataURL('image/jpeg', q); }
      resolve(data);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')); };
    img.src = url;
  });
}
function pickIcon() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', async () => {
    const f = input.files[0];
    if (!f) return;
    try {
      const data = await imageToIcon(f);
      const r = await call('icon-set', { data });
      comIcon = { v: r.v, data };
      save(ICON_KEY, comIcon);
      st.community.iconV = r.v;
      setBrand();
      renderView();
      toast('Icono de la comunidad guardado');
    } catch (e) { toast(e.status ? errorText(e) : 'No se ha podido leer la imagen'); }
  });
  input.click();
}

// ---------- PDF (sin librerías) ----------
// Se escribe el PDF a mano con las fuentes estándar (Helvetica y Courier) y, si hay, el icono de la
// comunidad como imagen JPEG.

const HELV = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556,
  278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944,
  667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556,
  500, 722, 500, 500, 500, 334, 260, 334, 584]; // anchos de Helvetica (1/1000 del cuerpo), caracteres 32–126
const HELV_EXTRA = { 'º': 365, 'ª': 370, '«': 556, '»': 556, '¿': 611, '¡': 333, '·': 278, '—': 1000, '–': 556, '€': 556, '…': 1000, '•': 350, '“': 333, '”': 333, '‘': 222, '’': 222, '›': 333 };
const WINANSI = { '€': 0x80, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '›': 0x9b };
function charWidth(ch) {
  if (HELV_EXTRA[ch]) return HELV_EXTRA[ch];
  let c = ch.charCodeAt(0);
  if (c > 126) c = ch.normalize('NFD').charCodeAt(0);
  return HELV[c - 32] || 556;
}
const textWidth = (s, size, bold) => [...s].reduce((w, ch) => w + charWidth(ch), 0) * size / 1000 * (bold ? 1.07 : 1);
function pdfStr(s) {
  let out = '';
  for (const ch of s) {
    let c = WINANSI[ch] || ch.charCodeAt(0);
    if (c > 255) c = 63; // ?
    if (c === 40 || c === 41 || c === 92) out += `\\${ch}`;
    else if (c < 32 || c > 126) out += `\\${c.toString(8).padStart(3, '0')}`;
    else out += ch;
  }
  return `(${out})`;
}
function wrapText(s, size, maxW, bold) {
  const lines = [];
  let line = '';
  for (const word of String(s).split(/\s+/).filter(Boolean)) {
    const test = line ? `${line} ${word}` : word;
    if (textWidth(test, size, bold) > maxW && line) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}
const fx = (n) => String(Math.round(n * 100) / 100);
const BLUE = '0.145 0.388 0.922';
const LIGHT = '0.376 0.647 0.98';
const NAVY = '0.1 0.18 0.36';
const INK = '0.11 0.12 0.15';
const GREY = '0.42 0.45 0.5';
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const circlePath = (cx, cy, r) => {
  const k = 0.5523 * r;
  return `${fx(cx + r)} ${fx(cy)} m ${fx(cx + r)} ${fx(cy + k)} ${fx(cx + k)} ${fx(cy + r)} ${fx(cx)} ${fx(cy + r)} c ${fx(cx - k)} ${fx(cy + r)} ${fx(cx - r)} ${fx(cy + k)} ${fx(cx - r)} ${fx(cy)} c `
    + `${fx(cx - r)} ${fx(cy - k)} ${fx(cx - k)} ${fx(cy - r)} ${fx(cx)} ${fx(cy - r)} c ${fx(cx + k)} ${fx(cy - r)} ${fx(cx + r)} ${fx(cy - k)} ${fx(cx + r)} ${fx(cy)} c`;
};
const textOp = (x, y, s, size, font = 'F1', color = '') => `${color ? `${color} rg ` : ''}BT /${font} ${fx(size)} Tf ${fx(x)} ${fx(y)} Td ${pdfStr(s)} Tj ET`;

class Pdf {
  constructor() { this.pages = []; this.images = []; this.page = null; }
  addPage() { this.page = []; this.pages.push(this.page); }
  op(s) { this.page.push(s); }
  text(x, y, s, size, font, color) { this.op(textOp(x, y, s, size, font, color)); }
  center(cx, y, s, size, font = 'F1', color) { this.text(cx - textWidth(s, size, font === 'F2') / 2, y, s, size, font, color); }
  right(rx, y, s, size, font = 'F1', color) { this.text(rx - textWidth(s, size, font === 'F2'), y, s, size, font, color); }
  addImage(bytes, w, h) { this.images.push({ bytes, w, h }); return `Im${this.images.length}`; }
  build() {
    const enc = new TextEncoder();
    const chunks = [];
    const offs = [];
    let len = 0;
    const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); len += b.length; };
    const obj = (id, parts) => { offs[id] = len; push(`${id} 0 obj\n`); [].concat(parts).forEach(push); push('\nendobj\n'); };
    const imgBase = 7;
    const pageBase = imgBase + this.images.length;
    push('%PDF-1.4\n');
    push(new Uint8Array([37, 226, 227, 207, 211, 10]));
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, `<< /Type /Pages /Kids [${this.pages.map((_, i) => `${pageBase + i * 2} 0 R`).join(' ')}] /Count ${this.pages.length} >>`);
    ['Helvetica', 'Helvetica-Bold', 'Courier-Bold', 'Helvetica-Oblique'].forEach((f, i) => obj(3 + i, `<< /Type /Font /Subtype /Type1 /BaseFont /${f} /Encoding /WinAnsiEncoding >>`));
    this.images.forEach((im, i) => obj(imgBase + i, [`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`, im.bytes, '\nendstream']));
    const xobj = this.images.length ? `/XObject << ${this.images.map((_, i) => `/Im${i + 1} ${imgBase + i} 0 R`).join(' ')} >>` : '';
    this.pages.forEach((ops, i) => {
      const id = pageBase + i * 2;
      const content = ops.join('\n'); // solo ASCII: longitud = bytes
      obj(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> ${xobj} >> /Contents ${id + 1} 0 R >>`);
      obj(id + 1, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    });
    const total = pageBase + this.pages.length * 2;
    const xref = len;
    let tail = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) tail += `${String(offs[i]).padStart(10, '0')} 00000 n \n`;
    tail += `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    push(tail);
    const out = new Uint8Array(len);
    let p = 0;
    chunks.forEach((c) => { out.set(c, p); p += c.length; });
    return out;
  }
}

// Logo de la app (si la comunidad no tiene icono), con la esquina superior izquierda en (x, top)
function pdfLogo(x, top, size) {
  const s = size / 120;
  const arc = [];
  for (let a = -90; a <= 150; a += 4) arc.push(`${fx(60 + 52 * Math.cos(a * Math.PI / 180))} ${fx(60 + 52 * Math.sin(a * Math.PI / 180))} ${arc.length ? 'l' : 'm'}`);
  const rect = (rx, ry) => `${rx} ${ry} 7 6 re`;
  return [
    `q ${fx(s)} 0 0 ${fx(-s)} ${fx(x)} ${fx(top)} cm 1 J 1 j`,
    `${LIGHT} RG 1.2 w ${circlePath(60, 60, 52)} S`,
    `[2 5] 0 d 0.8 w ${circlePath(60, 60, 42)} S [] 0 d`,
    `${BLUE} RG 3 w ${arc.join(' ')} S`,
    `${LIGHT} rg ${circlePath(14.97, 86, 3)} f`,
    `${BLUE} RG 1.8 w 40 84 m 40 44 l 60 32 l 80 44 l 80 84 l S`,
    '1.4 w 32 84 m 88 84 l S 54 84 m 54 73 l 66 73 l 66 84 l S',
    `1.2 w ${rect(46, 49)} ${rect(67, 49)} ${rect(46, 61)} ${rect(56.5, 61)} S`,
    `${LIGHT} rg ${rect(56.5, 49)} f ${BLUE} rg ${rect(67, 61)} f`,
    'Q',
  ].join('\n');
}
// Emblema de la comunidad: su icono en un círculo, o el logo de la app
function pdfEmblem(pdf, x, top, size) {
  if (!comIcon?.data) { pdf.op(pdfLogo(x, top, size)); return; }
  if (!pdf.iconName) pdf.iconName = pdf.addImage(b64ToBytes(comIcon.data.split(',')[1]), ICON_PX, ICON_PX);
  const r = size / 2;
  pdf.op(`q ${circlePath(x + r, top - r, r)} W n q ${fx(size)} 0 0 ${fx(size)} ${fx(x)} ${fx(top - size)} cm /${pdf.iconName} Do Q Q`);
  pdf.op(`${NAVY} RG 0.7 w ${circlePath(x + r, top - r, r)} S`);
}

const WEEKDAYS_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS_FULL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function parseDay(v) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
const longDate = (d) => `${WEEKDAYS_FULL[d.getDay()]}, ${d.getDate()} de ${MONTHS_FULL[d.getMonth()]} de ${d.getFullYear()}`;
const plainDate = (d) => `${d.getDate()} de ${MONTHS_FULL[d.getMonth()]} de ${d.getFullYear()}`;
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const appUrl = () => `${location.host}${location.pathname}`.replace(/\/$/, '');

// ----- Tarjetas de los códigos: un A4 con cuatro (A6) para recortar y dejar en cada buzón -----

function pdfCard(pdf, x0, top, w, h, c, info) {
  const cx = x0 + w / 2;
  let y = top - 24;
  pdfEmblem(pdf, cx - 24, y, 48);
  y -= 64;
  wrapText(info.name.toUpperCase(), 9.5, w - 50, true).slice(0, 2).forEach((l) => { pdf.center(cx, y, l, 9.5, 'F2', NAVY); y -= 12; });
  y -= 12;
  pdf.center(cx, y, c.label, 22, 'F2', INK);
  y -= 20;
  pdf.center(cx, y, 'CÓDIGO DE ACCESO PERSONAL', 7.5, 'F1', GREY);
  y -= 8;
  const bw = w - 70;
  const bh = 30;
  pdf.op(`${BLUE} RG 0.8 w ${fx(cx - bw / 2)} ${fx(y - bh)} ${fx(bw)} ${fx(bh)} re S`);
  const cw = c.code.length * 0.6 * 17;
  pdf.text(cx - cw / 2, y - bh + 10, c.code, 17, 'F3', BLUE);
  y -= bh + 18;
  const left = x0 + 24;
  const maxW = w - 48;
  const para = (title, text) => {
    pdf.text(left, y, title, 9.6, 'F2', INK);
    y -= 12.5;
    wrapText(text, 9.2, maxW).forEach((l) => { pdf.text(left, y, l, 9.2, 'F1', '0.2 0.21 0.24'); y -= 12; });
    y -= 8;
  };
  para('Personal e intransferible', 'Este código identifica a tu vivienda en la app de la comunidad. No lo compartas ni lo publiques: quien lo tenga podrá leer, escribir y votar en nombre de tu vivienda.');
  para('Cómo entrar', `Abre ${info.url} en el móvil, pulsa «Ya tengo mi código» y escríbelo. Puedes añadir la app a la pantalla de inicio para tenerla a mano.`);
  para('¿Lo has perdido o lo has olvidado?', `Vuelve a solicitarlo desde la app en «Solicitar mi código», con el código de la comunidad ${info.pub}. Te dejaremos uno nuevo en tu buzón y el anterior dejará de funcionar.`);
  pdf.center(cx, top - h + 14, `Entregado el ${info.date} · La presidencia`, 6.5, 'F1', GREY);
}
function cardsDoc(codes) {
  const W = PAGE_W / 2;
  const H = PAGE_H / 2;
  const info = { name: st.community.name, pub: st.community.pub, url: appUrl(), date: plainDate(new Date()) };
  const pdf = new Pdf();
  for (let i = 0; i < codes.length; i += 4) {
    pdf.addPage();
    pdf.op(`0.6 G 0.5 w [4 3] 0 d ${fx(W)} 0 m ${fx(W)} ${PAGE_H} l S 0 ${fx(H)} m ${PAGE_W} ${fx(H)} l S [] 0 d`);
    codes.slice(i, i + 4).forEach((c, j) => pdfCard(pdf, (j % 2) * W, PAGE_H - Math.floor(j / 2) * H, W, H, c, info));
  }
  return pdf;
}
const cardsPDF = (codes) => cardsDoc(codes).build();
async function downloadCards(codes) {
  track('/tarjetas-pdf');
  const name = `codigos-${slugify(st.community.name) || 'comunidad'}${codes.length === 1 ? `-${slugify(codes[0].label)}` : ''}.pdf`;
  await openPdfViewer(cardsDoc(codes), name);
}

// ----- Documentos formales: cabecera con icono y nombre, letra grande y pie con página -----

const ML = 62;
const CW = PAGE_W - ML * 2;
const TOP = PAGE_H - 54;
const BOTTOM = 74;
const BODY = 12.5;  // cuerpo de texto: legible pegado en el portal
const LEAD = 18.5;

function formalDoc(spec) {
  const pdf = new Pdf();
  const name = st.community.name;
  let y = 0;
  const header = () => {
    pdf.addPage();
    pdfEmblem(pdf, ML, TOP, 50);
    const lines = wrapText(name, 16, CW - 66, true).slice(0, 2);
    let ny = TOP - 30 + (lines.length - 1) * 9.5;
    lines.forEach((l) => { pdf.text(ML + 64, ny, l, 16, 'F2', NAVY); ny -= 19; });
    pdf.op(`${NAVY} RG 1.3 w ${ML} ${fx(TOP - 64)} m ${fx(PAGE_W - ML)} ${fx(TOP - 64)} l S 0.4 w ${ML} ${fx(TOP - 67.5)} m ${fx(PAGE_W - ML)} ${fx(TOP - 67.5)} l S`);
    y = TOP - 104;
  };
  const ensure = (h) => { if (y - h < BOTTOM) header(); };
  const paragraph = (text, { size = BODY, lead = LEAD, font = 'F1', color = INK, x = ML, width = CW, after = 9 } = {}) => {
    for (const par of String(text).split('\n')) {
      if (!par.trim()) { y -= lead * 0.5; continue; }
      for (const l of wrapText(par, size, width, font === 'F2')) { ensure(lead); pdf.text(x, y, l, size, font, color); y -= lead; }
    }
    y -= after;
  };
  header();
  // Título
  const tl = wrapText(spec.title.toUpperCase(), 19, CW - 20, true);
  ensure(tl.length * 25 + 30);
  tl.forEach((l) => { pdf.center(PAGE_W / 2, y, l, 19, 'F2', NAVY); y -= 25; });
  if (spec.subtitle) { wrapText(spec.subtitle, 13, CW - 40).forEach((l) => { pdf.center(PAGE_W / 2, y, l, 13, 'F1', GREY); y -= 18; }); }
  pdf.op(`${LIGHT} RG 1 w ${fx(PAGE_W / 2 - 30)} ${fx(y + 2)} m ${fx(PAGE_W / 2 + 30)} ${fx(y + 2)} l S`);
  y -= 26;

  for (const b of spec.blocks) {
    if (b.t === 'p') paragraph(b.text, b);
    else if (b.t === 'note') paragraph(b.text, { size: 10.5, lead: 15, font: 'F4', color: GREY, after: 8 });
    else if (b.t === 'gap') y -= b.h || 10;
    else if (b.t === 'h') {
      ensure(56);
      y -= 6;
      pdf.text(ML, y, b.text.toUpperCase(), 12.5, 'F2', NAVY);
      pdf.op(`${LIGHT} RG 0.8 w ${ML} ${fx(y - 6)} m ${fx(ML + textWidth(b.text.toUpperCase(), 12.5, true))} ${fx(y - 6)} l S`);
      y -= 26;
    } else if (b.t === 'fields') {
      const LW = 170;
      const rows = b.rows.filter((r) => r[1]).map(([k, v]) => [k, wrapText(v, BODY + 0.5, CW - LW - 14, true)]);
      if (!rows.length) continue;
      const hgt = rows.reduce((h, r) => h + r[1].length * LEAD + 8, 0) + 6;
      ensure(hgt);
      const y0 = y + 14;
      pdf.op(`0.95 0.96 0.98 rg ${ML} ${fx(y0 - hgt)} ${fx(CW)} ${fx(hgt)} re f ${NAVY} rg ${ML} ${fx(y0 - hgt)} 3 ${fx(hgt)} re f`);
      rows.forEach(([k, lines]) => {
        pdf.text(ML + 16, y, k, BODY, 'F1', GREY);
        lines.forEach((l) => { pdf.text(ML + LW, y, l, BODY + 0.5, 'F2', INK); y -= LEAD; });
        y -= 8;
      });
      y -= 16;
    } else if (b.t === 'list') {
      const items = b.items.filter(Boolean);
      items.forEach((it, i) => {
        const ind = b.indent || 0;
        const lines = wrapText(it, BODY, CW - 30 - ind);
        ensure(Math.min(lines.length, 2) * LEAD);
        pdf.text(ML + 4 + ind, y, b.bullets ? '•' : `${i + 1}.`, BODY, 'F2', NAVY);
        lines.forEach((l) => { ensure(LEAD); pdf.text(ML + 30 + ind, y, l, BODY, 'F1', INK); y -= LEAD; });
        y -= 5;
      });
      y -= 8;
    } else if (b.t === 'big') {
      // Recuadro destacado (enlace de la app, código de la comunidad)
      const size = b.size || 22;
      const lines = wrapText(b.text, size, CW - 50, true);
      const hgt = (lines.length - 1) * (size + 8) + size * 0.72 + 30;
      ensure(hgt + 16);
      const top = y + 2;
      pdf.op(`${BLUE} RG 1.4 w 0.94 0.96 1 rg ${fx(ML + 10)} ${fx(top - hgt)} ${fx(CW - 20)} ${fx(hgt)} re B`);
      let by = top - 15 - size * 0.72;
      lines.forEach((l) => { pdf.center(PAGE_W / 2, by, l, size, b.mono ? 'F3' : 'F2', BLUE); by -= size + 8; });
      y = top - hgt - 16;
    } else if (b.t === 'step') {
      const lines = wrapText(b.text, 13.5, CW - 46);
      ensure(lines.length * 20 + 10);
      pdf.op(`${NAVY} rg ${circlePath(ML + 13, y + 4.5, 13)} f`);
      pdf.center(ML + 13, y, String(b.n), 13, 'F2', '1 1 1');
      lines.forEach((l) => { pdf.text(ML + 40, y, l, 13.5, 'F1', INK); y -= 20; });
      y -= 6;
    } else if (b.t === 'close') {
      if (y - 72 < 44) header(); // la firma puede bajar algo más que el texto, hasta encima del pie
      y -= 8;
      const when = `${b.place ? `En ${b.place}, a` : 'A'} ${plainDate(new Date())}.`;
      pdf.right(PAGE_W - ML, y, when, BODY, 'F1', INK);
      y -= 46;
      pdf.op(`${GREY} RG 0.6 w ${fx(PAGE_W - ML - 200)} ${fx(y + 14)} m ${fx(PAGE_W - ML)} ${fx(y + 14)} l S`);
      pdf.center(PAGE_W - ML - 100, y, b.sign || 'La Presidencia', BODY, 'F2', INK);
      y -= 24;
    } else if (b.t === 'slip') {
      // Autorización de representación para recortar
      if (y - 250 < BOTTOM) header(); else y -= 18;
      pdf.op(`${GREY} RG 0.6 w [5 4] 0 d ${ML} ${fx(y)} m ${fx(PAGE_W - ML)} ${fx(y)} l S [] 0 d`);
      pdf.center(PAGE_W / 2, y - 12, 'recortar por aquí', 8, 'F4', GREY);
      y -= 40;
      pdf.center(PAGE_W / 2, y, 'AUTORIZACIÓN DE REPRESENTACIÓN', 13.5, 'F2', NAVY);
      y -= 28;
      const blank = '______________________________';
      paragraph(`D./D.ª ${blank}, propietario/a de la vivienda __________, autoriza a D./D.ª ${blank} para que le represente en la ${b.meeting} de ${name}${b.date ? ` convocada para el ${b.date}` : ''}, con plenas facultades para deliberar y votar en todos los puntos del orden del día.`, { lead: 21 });
      y -= 6;
      paragraph('En ____________________, a ____ de ____________________ de ________.', { after: 26 });
      pdf.text(ML, y, 'Firma del propietario/a:', BODY, 'F1', INK);
      pdf.text(ML + CW / 2 + 10, y, 'Firma del representante:', BODY, 'F1', INK);
      y -= 40;
    } else if (b.t === 'attend') {
      attendTable(pdf, b, () => y, (v) => { y = v; }, header);
    }
  }
  // Pie en cada página: nombre de la comunidad y número de página
  const n = pdf.pages.length;
  pdf.pages.forEach((ops, i) => {
    ops.push(`${GREY} RG 0.4 w ${ML} 50 m ${fx(PAGE_W - ML)} 50 l S`);
    ops.push(textOp(ML, 36, name, 9, 'F1', GREY));
    const pg = `Página ${i + 1} de ${n}`;
    ops.push(textOp(PAGE_W - ML - textWidth(pg, 9), 36, pg, 9, 'F1', GREY));
  });
  return pdf;
}
const formalPDF = (spec) => formalDoc(spec).build();

// Tabla de asistencia: vivienda, presente, representado, quién le representa y firma
function attendTable(pdf, b, getY, setY, header) {
  const cols = [['Vivienda', 92], ['Presente', 62], ['Representado', 84], ['Representado por', 150], ['Firma', CW - 92 - 62 - 84 - 150]];
  const RH = 27;
  let y = getY();
  const head = () => {
    const top = y + 16;
    pdf.op(`${NAVY} rg ${ML} ${fx(top - 26)} ${fx(CW)} 26 re f`);
    let x = ML;
    cols.forEach(([t, w]) => { pdf.center(x + w / 2, top - 17, t, 10.5, 'F2', '1 1 1'); x += w; });
    y -= 26;
  };
  head();
  b.units.forEach((u, i) => {
    if (y - RH < BOTTOM) { setY(y); header(); y = getY(); head(); }
    const top = y + 16;
    if (i % 2) pdf.op(`0.95 0.96 0.98 rg ${ML} ${fx(top - RH)} ${fx(CW)} ${RH} re f`);
    pdf.op(`0.75 0.78 0.83 RG 0.5 w ${ML} ${fx(top - RH)} m ${fx(ML + CW)} ${fx(top - RH)} l S`);
    pdf.text(ML + 8, top - 18, u, BODY, 'F2', INK);
    let x = ML + cols[0][1];
    [1, 2].forEach((c) => { pdf.op(`${INK} RG 0.9 w ${fx(x + cols[c][1] / 2 - 6.5)} ${fx(top - 20)} 13 13 re S`); x += cols[c][1]; });
    y -= RH;
  });
  // Líneas verticales de la última página no hacen falta: filas alternas y casillas guían la vista
  y -= 26;
  if (y - 70 < BOTTOM) { setY(y); header(); y = getY(); }
  pdf.text(ML, y, `Viviendas presentes: ________     Representadas: ________     Total: ________ de ${b.units.length}`, BODY, 'F1', INK);
  y -= 46;
  pdf.op(`${GREY} RG 0.6 w ${fx(ML)} ${fx(y + 14)} m ${fx(ML + 200)} ${fx(y + 14)} l S ${fx(PAGE_W - ML - 200)} ${fx(y + 14)} m ${fx(PAGE_W - ML)} ${fx(y + 14)} l S`);
  pdf.center(ML + 100, y, 'El Presidente', BODY, 'F2', INK);
  pdf.center(PAGE_W - ML - 100, y, 'El Secretario', BODY, 'F2', INK);
  y -= 30;
  setY(y);
}

// ----- Visor de PDF dentro de la app -----
// Dibuja en <canvas> las mismas órdenes que forman cada página del PDF (solo las que usa esta app:
// trazos, rellenos, texto, recortes e imágenes), así se ve igual que el archivo sin librerías externas.

const WIN_REV = Object.fromEntries(Object.entries(WINANSI).map(([ch, c]) => [c, ch]));
const PDF_FONTS = { F1: ['400', 'normal', 'Helvetica, Arial, sans-serif'], F2: ['700', 'normal', 'Helvetica, Arial, sans-serif'], F3: ['700', 'normal', '"Courier New", Courier, monospace'], F4: ['400', 'italic', 'Helvetica, Arial, sans-serif'] };
function pdfUnescape(raw) {
  return raw.slice(1, -1).replace(/\\([0-7]{3}|.)/g, (_, e) => {
    if (/^[0-7]{3}$/.test(e)) { const c = parseInt(e, 8); return WIN_REV[c] || String.fromCharCode(c); }
    return e;
  });
}
function loadPdfImages(pdf) {
  return Promise.all(pdf.images.map((im) => new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([im.bytes], { type: 'image/jpeg' }));
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  })));
}
function drawPdfPage(ctx, ops, scale, images) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(scale, 0, 0, -scale, 0, PAGE_H * scale); // el PDF cuenta la altura desde abajo
  const g = { fill: '#000', stroke: '#000', font: 'F1', size: 12 };
  const stack = [];
  let args = [];
  let pathOpen = false;
  let clip = false;
  let tx = 0;
  let ty = 0;
  const rgb = (a) => `rgb(${a.map((v) => Math.round(v * 255)).join(',')})`;
  const startPath = () => { if (!pathOpen) { ctx.beginPath(); pathOpen = true; } };
  const endPath = () => { if (clip) { ctx.clip(); clip = false; } pathOpen = false; };
  const re = /\s*(\((?:\\.|[^\\)])*\)|\[[^\]]*\]|\/[A-Za-z0-9]+|-?\d*\.?\d+(?:e-?\d+)?|[A-Za-z*']+)/gy;
  const src = ops.join('\n');
  let m;
  re.lastIndex = 0;
  while ((m = re.exec(src))) {
    const tok = m[1];
    if (tok[0] === '(' || tok[0] === '[' || tok[0] === '/' || /^-?[\d.]/.test(tok)) { args.push(tok); continue; }
    const n = args.map(Number);
    switch (tok) {
      case 'q': ctx.save(); stack.push({ ...g }); break;
      case 'Q': ctx.restore(); Object.assign(g, stack.pop() || {}); break;
      case 'cm': ctx.transform(n[0], n[1], n[2], n[3], n[4], n[5]); break;
      case 'm': startPath(); ctx.moveTo(n[0], n[1]); break;
      case 'l': ctx.lineTo(n[0], n[1]); break;
      case 'c': ctx.bezierCurveTo(n[0], n[1], n[2], n[3], n[4], n[5]); break;
      case 're': startPath(); ctx.rect(n[0], n[1], n[2], n[3]); break;
      case 'h': ctx.closePath(); break;
      case 'S': ctx.strokeStyle = g.stroke; ctx.stroke(); endPath(); break;
      case 'f': ctx.fillStyle = g.fill; ctx.fill(); endPath(); break;
      case 'B': ctx.fillStyle = g.fill; ctx.fill(); ctx.strokeStyle = g.stroke; ctx.stroke(); endPath(); break;
      case 'W': clip = true; break;
      case 'n': endPath(); break;
      case 'rg': g.fill = rgb(n); break;
      case 'RG': g.stroke = rgb(n); break;
      case 'g': g.fill = rgb([n[0], n[0], n[0]]); break;
      case 'G': g.stroke = rgb([n[0], n[0], n[0]]); break;
      case 'w': ctx.lineWidth = n[0]; break;
      case 'J': ctx.lineCap = ['butt', 'round', 'square'][n[0]] || 'butt'; break;
      case 'j': ctx.lineJoin = ['miter', 'round', 'bevel'][n[0]] || 'miter'; break;
      case 'd': ctx.setLineDash(args[0].slice(1, -1).trim().split(/\s+/).filter(Boolean).map(Number)); break;
      case 'BT': tx = 0; ty = 0; break;
      case 'Tf': g.font = args[0].slice(1); g.size = n[1]; break;
      case 'Td': tx += n[0]; ty += n[1]; break;
      case 'Tj': {
        const [weight, style, family] = PDF_FONTS[g.font] || PDF_FONTS.F1;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(1, -1);
        ctx.font = `${style} ${weight} ${g.size}px ${family}`;
        ctx.fillStyle = g.fill;
        ctx.fillText(pdfUnescape(args[0]), 0, 0);
        ctx.restore();
        break;
      }
      case 'Do': {
        const img = images[Number(args[0].slice(3)) - 1];
        if (img) { ctx.save(); ctx.translate(0, 1); ctx.scale(1, -1); ctx.drawImage(img, 0, 0, 1, 1); ctx.restore(); }
        break;
      }
      default: break; // ET y otras sin efecto en pantalla
    }
    args = [];
  }
}
// Abre el visor con las páginas del documento; desde ahí se comparte, guarda o imprime el PDF
async function openPdfViewer(pdf, name) {
  track('/visor-pdf');
  closeSheet();
  const bytes = pdf.build();
  const images = await loadPdfImages(pdf);
  document.querySelector('.pdf-viewer')?.remove();
  const el = document.createElement('section');
  el.className = 'pdf-viewer';
  el.setAttribute('aria-label', 'Vista previa del PDF');
  el.innerHTML = `
    <header class="view-top">
      <button class="icon-btn back-btn" type="button" data-close aria-label="Cerrar">${icon('close', 20, 1.6)}</button>
      <div class="view-head"><b>${esc(name)}</b><small>${plural(pdf.pages.length, 'página', 'páginas')}</small></div>
      <div class="view-actions">
        <button class="icon-btn sm" type="button" data-zoom aria-label="Ampliar">${icon('zoom', 18)}</button>
        <button class="icon-btn sm" type="button" data-share aria-label="Compartir, guardar o imprimir">${icon('share', 18)}</button>
      </div>
    </header>
    <div class="pdf-pages"></div>`;
  document.body.append(el);
  document.body.classList.add('in-pdf');
  let zoom = 1;
  const pages = el.querySelector('.pdf-pages');
  const draw = () => {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const cssW = Math.min(820, pages.clientWidth - 24) * zoom;
    pages.classList.toggle('zoomed', zoom > 1);
    pages.innerHTML = '';
    pdf.pages.forEach((ops) => {
      const c = document.createElement('canvas');
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssW * dpr * PAGE_H / PAGE_W);
      c.style.width = `${cssW}px`;
      c.style.height = `${cssW * PAGE_H / PAGE_W}px`;
      drawPdfPage(c.getContext('2d'), ops, c.width / PAGE_W, images);
      pages.append(c);
    });
  };
  draw();
  const close = () => { el.remove(); document.body.classList.remove('in-pdf'); window.removeEventListener('resize', draw); };
  window.addEventListener('resize', draw);
  el.querySelector('[data-close]').addEventListener('click', close);
  el.querySelector('[data-zoom]').addEventListener('click', () => { zoom = zoom > 1 ? 1 : 2; draw(); });
  el.querySelector('[data-share]').addEventListener('click', () => deliverFile(bytes, name, 'application/pdf'));
}

// ----- Plantillas de documentos (parte fija + datos opcionales) -----

const DOCS_KEY = 'micomunidad:docs'; // últimos datos usados en cada plantilla (lugar, localidad, firma…)
const ORDER_ORD = ['Lectura y aprobación, si procede, del acta de la junta anterior.', 'Examen y aprobación, si procede, de las cuentas del ejercicio.', 'Aprobación, si procede, del presupuesto para el próximo ejercicio.', 'Nombramiento o renovación de cargos.', 'Ruegos y preguntas.'].join('\n');
const fmtTime = (t) => (t ? `${t} h` : '');
const lines = (s) => String(s || '').split('\n').map((l) => l.trim().replace(/^[-•\d.)\s]+/, '')).filter(Boolean);
const defaultSign = () => (st?.me?.role === 'vice' ? 'El Vicepresidente' : 'El Presidente');
const F = {
  fecha: { k: 'fecha', label: 'Fecha', type: 'date' },
  hora1: { k: 'hora1', label: 'Hora (primera convocatoria)', type: 'time', def: '19:00' },
  hora2: { k: 'hora2', label: 'Hora (segunda convocatoria)', type: 'time', def: '19:30' },
  hora: { k: 'hora', label: 'Hora', type: 'time', def: '19:00' },
  lugar: { k: 'lugar', label: 'Lugar', type: 'text', ph: 'Portal, local de la comunidad…' },
  obs: { k: 'obs', label: 'Observaciones', type: 'textarea', opt: true },
  localidad: { k: 'localidad', label: 'Localidad (para la fecha de firma)', type: 'text', ph: 'Madrid', opt: true },
  firma: { k: 'firma', label: 'Firma', type: 'text', def: () => defaultSign() },
  deleg: { k: 'deleg', label: 'Incluir la autorización de representación para recortar', type: 'check', def: true },
};
function meetingFields(v) {
  const d = parseDay(v.fecha);
  return [['Fecha', d ? longDate(d) : ''], ['Primera convocatoria', fmtTime(v.hora1)], ['Segunda convocatoria', fmtTime(v.hora2)], ['Lugar', v.lugar]];
}
function boardMeeting(v, extra = []) {
  return meetingFields(v).filter((r) => r[1]).map(([k, val]) => `${k}: ${val}`).concat(extra).join('\n');
}
const LEGAL_NOTE = 'Se ruega la asistencia puntual. Los propietarios que no puedan asistir podrán delegar su representación por escrito en otra persona. Conforme al artículo 15.2 de la Ley de Propiedad Horizontal, los propietarios que no estén al corriente en el pago de las deudas vencidas con la comunidad podrán participar en las deliberaciones, pero no tendrán derecho a voto.';
const TEMPLATES = [
  {
    id: 'app', name: 'Aviso: nueva app de la comunidad', desc: 'Para el portal: enlace bien visible e instrucciones sencillas.', icon: 'home',
    fields: [{ k: 'obs', label: 'Texto añadido', type: 'textarea', opt: true }, F.localidad, F.firma],
    build: (v) => ({
      title: 'Nueva app de la comunidad',
      blocks: [
        { t: 'p', text: 'La comunidad estrena una aplicación para el móvil. Con ella podrás leer los anuncios de la presidencia, votar en las encuestas, escribir a la presidencia de forma privada y hablar con tus vecinos. No hace falta dar ningún dato personal: ni nombre, ni teléfono, ni correo.' },
        { t: 'h', text: 'Cómo empezar' },
        { t: 'step', n: 1, text: 'Abre en el móvil esta dirección:' },
        { t: 'big', text: appUrl(), size: 22 },
        { t: 'step', n: 2, text: 'Pulsa «Solicitar mi código» y escribe el código de la comunidad y tu piso y puerta:' },
        { t: 'big', text: st.community.pub, size: 26, mono: true },
        { t: 'step', n: 3, text: 'En unos días recibirás en tu buzón el código personal de tu vivienda. Escríbelo en «Ya tengo mi código» y listo.' },
        { t: 'step', n: 4, text: 'Consejo: añade la app a la pantalla de inicio del móvil para tenerla siempre a mano y activa los avisos:' },
        { t: 'list', bullets: true, indent: 36, items: ['iPhone (Safari): botón Compartir › Añadir a pantalla de inicio › Añadir.', 'Android (Chrome): menú de los tres puntos, arriba a la derecha › Instalar aplicación (o Añadir a pantalla de inicio) › Instalar.'] },
        ...(v.obs ? [{ t: 'gap', h: 4 }, { t: 'p', text: v.obs }] : []),
        { t: 'note', text: 'Cada vivienda tiene un único código, personal e intransferible. Si lo pierdes, puedes volver a solicitarlo desde la app.' },
        { t: 'close', place: v.localidad, sign: v.firma },
      ],
      board: { title: 'Nueva app de la comunidad', text: `La comunidad ya tiene app: ${location.origin}${location.pathname}\n\nPara entrar, pulsa «Solicitar mi código» con el código de la comunidad ${st.community.pub} y tu piso y puerta. Recibirás tu código personal en el buzón.${v.obs ? `\n\n${v.obs}` : ''}` },
    }),
  },
  {
    id: 'ordinaria', name: 'Convocatoria de Junta General Ordinaria', desc: 'Fecha, horas, lugar y orden del día.', icon: 'users',
    fields: [F.fecha, F.hora1, F.hora2, F.lugar, { k: 'orden', label: 'Orden del día (un punto por línea)', type: 'textarea', def: ORDER_ORD, rows: 6 }, F.obs, F.deleg, F.localidad, F.firma],
    build: (v) => {
      const d = parseDay(v.fecha);
      return {
        title: 'Convocatoria de Junta General Ordinaria',
        blocks: [
          { t: 'p', text: 'Por la presente, y de conformidad con lo dispuesto en el artículo 16 de la Ley de Propiedad Horizontal, se convoca a todos los propietarios de la comunidad a la Junta General Ordinaria, que se celebrará en el lugar, fecha y hora que se indican:' },
          { t: 'fields', rows: meetingFields(v) },
          { t: 'h', text: 'Orden del día' },
          { t: 'list', items: lines(v.orden) },
          ...(v.obs ? [{ t: 'p', text: v.obs }] : []),
          { t: 'note', text: LEGAL_NOTE },
          { t: 'close', place: v.localidad, sign: v.firma },
          ...(v.deleg ? [{ t: 'slip', meeting: 'Junta General Ordinaria', date: d ? plainDate(d) : '' }] : []),
        ],
        board: { title: 'Convocatoria de Junta General Ordinaria', text: `${boardMeeting(v)}\n\nOrden del día:\n${lines(v.orden).map((l, i) => `${i + 1}. ${l}`).join('\n')}${v.obs ? `\n\n${v.obs}` : ''}` },
      };
    },
  },
  {
    id: 'extraordinaria', name: 'Convocatoria de Junta General Extraordinaria', desc: 'Con motivo y orden del día.', icon: 'users',
    fields: [F.fecha, F.hora1, F.hora2, F.lugar, { k: 'motivo', label: 'Motivo de la convocatoria', type: 'textarea', opt: true }, { k: 'orden', label: 'Orden del día (un punto por línea)', type: 'textarea', def: 'Ruegos y preguntas.', rows: 5 }, F.obs, F.deleg, F.localidad, F.firma],
    build: (v) => {
      const d = parseDay(v.fecha);
      return {
        title: 'Convocatoria de Junta General Extraordinaria',
        blocks: [
          { t: 'p', text: 'Por la presente, y de conformidad con lo dispuesto en el artículo 16 de la Ley de Propiedad Horizontal, se convoca a todos los propietarios de la comunidad a la Junta General Extraordinaria, que se celebrará en el lugar, fecha y hora que se indican:' },
          { t: 'fields', rows: meetingFields(v) },
          ...(v.motivo ? [{ t: 'h', text: 'Motivo de la convocatoria' }, { t: 'p', text: v.motivo }] : []),
          { t: 'h', text: 'Orden del día' },
          { t: 'list', items: lines(v.orden) },
          ...(v.obs ? [{ t: 'p', text: v.obs }] : []),
          { t: 'note', text: LEGAL_NOTE },
          { t: 'close', place: v.localidad, sign: v.firma },
          ...(v.deleg ? [{ t: 'slip', meeting: 'Junta General Extraordinaria', date: d ? plainDate(d) : '' }] : []),
        ],
        board: { title: 'Convocatoria de Junta General Extraordinaria', text: `${boardMeeting(v)}${v.motivo ? `\n\nMotivo: ${v.motivo}` : ''}\n\nOrden del día:\n${lines(v.orden).map((l, i) => `${i + 1}. ${l}`).join('\n')}${v.obs ? `\n\n${v.obs}` : ''}` },
      };
    },
  },
  {
    id: 'obras', name: 'Reunión de la comisión de obras', desc: 'Convocatoria con los asuntos a tratar.', icon: 'gear',
    fields: [F.fecha, F.hora, F.lugar, { k: 'asuntos', label: 'Asuntos a tratar (uno por línea)', type: 'textarea', rows: 5 }, { k: 'miembros', label: 'Miembros convocados', type: 'textarea', opt: true, ph: 'Viviendas 1º A, 3º B…' }, F.obs, F.localidad, F.firma],
    build: (v) => {
      const d = parseDay(v.fecha);
      const rows = [['Fecha', d ? longDate(d) : ''], ['Hora', fmtTime(v.hora)], ['Lugar', v.lugar]];
      return {
        title: 'Convocatoria de reunión de la comisión de obras',
        blocks: [
          { t: 'p', text: 'Se convoca a los miembros de la comisión de obras de la comunidad a la reunión que se celebrará en el lugar, fecha y hora indicados, con el fin de tratar los asuntos que se relacionan a continuación:' },
          { t: 'fields', rows },
          ...(lines(v.asuntos).length ? [{ t: 'h', text: 'Asuntos a tratar' }, { t: 'list', items: lines(v.asuntos) }] : []),
          ...(v.miembros ? [{ t: 'h', text: 'Miembros convocados' }, { t: 'p', text: v.miembros }] : []),
          ...(v.obs ? [{ t: 'p', text: v.obs }] : []),
          { t: 'note', text: 'La reunión está abierta a cualquier propietario interesado, con voz pero sin voto en los acuerdos de la comisión.' },
          { t: 'close', place: v.localidad, sign: v.firma },
        ],
        board: { title: 'Reunión de la comisión de obras', text: `${rows.filter((r) => r[1]).map(([k, val]) => `${k}: ${val}`).join('\n')}${lines(v.asuntos).length ? `\n\nAsuntos:\n${lines(v.asuntos).map((l, i) => `${i + 1}. ${l}`).join('\n')}` : ''}${v.obs ? `\n\n${v.obs}` : ''}` },
      };
    },
  },
  {
    id: 'asistencia', name: 'Listado de asistencia para la reunión', desc: 'Vivienda, presente, representado y quién le representa.', icon: 'check', noBoard: true,
    fields: [{ k: 'reunion', label: 'Reunión', type: 'select', options: ['Junta General Ordinaria', 'Junta General Extraordinaria', 'Reunión de la comisión de obras', 'Otra'], def: 'Junta General Ordinaria' },
      { k: 'otra', label: 'Nombre de la reunión (si es «Otra»)', type: 'text', opt: true }, F.fecha, F.lugar],
    build: (v) => {
      const d = parseDay(v.fecha);
      const units = (st.units || []).map((u) => u.label);
      return {
        title: 'Listado de asistencia',
        subtitle: [v.reunion === 'Otra' ? (v.otra || 'Reunión') : v.reunion, d ? longDate(d) : '', v.lugar].filter(Boolean).join(' · '),
        blocks: [{ t: 'attend', units }],
      };
    },
  },
  {
    id: 'comunicado', name: 'Comunicado de la presidencia', desc: 'Texto libre con formato oficial.', icon: 'board',
    fields: [{ k: 'titulo', label: 'Título', type: 'text', ph: 'Corte de agua el martes' }, { k: 'texto', label: 'Texto', type: 'textarea', rows: 7 }, F.localidad, F.firma],
    build: (v) => ({
      title: v.titulo || 'Comunicado',
      blocks: [{ t: 'p', text: v.texto || '' }, { t: 'close', place: v.localidad, sign: v.firma }],
      board: { title: v.titulo || 'Comunicado', text: v.texto || '' },
    }),
  },
];

function openDocsSheet() {
  track('/documentos');
  const sheet = openSheet('Documentos');
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">Documentos</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    <p class="small muted">Elige un modelo, rellena los datos que necesites (los que dejes en blanco no aparecen) y crea el PDF o publícalo en el tablón con el PDF adjunto.${comIcon ? '' : ' Para que salga el icono de la comunidad, añádelo en Gestión.'}</p>
    <div class="rows">${TEMPLATES.map((t) => `
      <button class="row" type="button" data-tpl="${t.id}">
        <span class="tile-ico">${icon(t.icon, 20)}</span>
        <span class="row-main"><span class="row-top"><b class="wrap-b">${esc(t.name)}</b></span><span class="row-sub wrap">${esc(t.desc)}</span></span>
      </button>`).join('')}</div>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  sheet.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => openDocEditor(TEMPLATES.find((t) => t.id === b.dataset.tpl))));
}
function openDocEditor(tpl) {
  const saved = (load(DOCS_KEY, {}) || {})[tpl.id] || {};
  const common = (load(DOCS_KEY, {}) || {})._common || {};
  const val = (f) => {
    if (saved[f.k] !== undefined && (f.k !== 'fecha' || saved.fecha >= isoDay(new Date()))) return saved[f.k];
    if (['lugar', 'localidad', 'firma'].includes(f.k) && common[f.k]) return common[f.k];
    return typeof f.def === 'function' ? f.def() : f.def ?? '';
  };
  const sheet = openSheet(tpl.name);
  const fieldHTML = (f) => {
    const v = val(f);
    const label = `<p class="field-label">${esc(f.label)}${f.opt ? ' <span class="muted">(opcional)</span>' : ''}</p>`;
    if (f.type === 'check') return `<label class="check-row"><input type="checkbox" data-k="${f.k}" ${v ? 'checked' : ''} /> <span>${esc(f.label)}</span></label>`;
    if (f.type === 'textarea') return `${label}<textarea class="text-input" data-k="${f.k}" rows="${f.rows || 3}" placeholder="${esc(f.ph || '')}">${esc(v)}</textarea>`;
    if (f.type === 'select') return `${label}<select class="select" data-k="${f.k}">${f.options.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    return `${label}<input class="title-input" data-k="${f.k}" type="${f.type}" value="${esc(v)}" placeholder="${esc(f.ph || '')}" autocomplete="off" />`;
  };
  sheet.innerHTML = `
    <div class="sheet-head"><h2 class="sheet-title">${esc(tpl.name)}</h2>
      <button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${icon('close', 18)}</button></div>
    ${tpl.fields.map(fieldHTML).join('')}
    <p class="form-error" data-err role="alert"></p>
    <div class="row-btns end">
      ${tpl.noBoard ? '' : `<button class="ghost-btn" type="button" data-board>${icon('board', 18)} Publicar en el tablón</button>`}
      <button class="done-btn" type="button" data-pdf>${icon('pdf', 18, 1.6)} Crear PDF</button>
    </div>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  const read = () => {
    const v = {};
    sheet.querySelectorAll('[data-k]').forEach((el) => { v[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
    const all = load(DOCS_KEY, {}) || {};
    all[tpl.id] = v;
    all._common = { ...(all._common || {}), ...Object.fromEntries(['lugar', 'localidad', 'firma'].filter((k) => v[k]).map((k) => [k, v[k]])) };
    save(DOCS_KEY, all);
    return v;
  };
  const fileName = () => `${slugify(tpl.name)}-${isoDay(new Date())}.pdf`;
  sheet.querySelector('[data-pdf]').addEventListener('click', async () => {
    const spec = tpl.build(read());
    track(`/documento/${tpl.id}`);
    try { await openPdfViewer(formalDoc(spec), fileName()); } catch (e) { sheet.querySelector('[data-err]').textContent = 'No se ha podido crear el PDF.'; }
  });
  sheet.querySelector('[data-board]')?.addEventListener('click', () => {
    const v = read();
    const spec = tpl.build(v);
    if (!spec.board.title && !spec.board.text) { sheet.querySelector('[data-err]').textContent = 'Escribe el contenido.'; return; }
    confirmSheet({
      title: '¿Publicar en el tablón?',
      text: `Se publicará «${spec.board.title}» para todos los vecinos, con el PDF adjunto, y les llegará un aviso.`,
      ok: 'Publicar',
      back: () => openDocEditor(tpl),
      run: async () => {
        const bytes = formalPDF(spec);
        const meta = await uploadFile(fileName(), 'application/pdf', bytes);
        await call('post', { title: spec.board.title, text: spec.board.text, files: [meta] });
        closeSheet();
        await refresh();
        toast('Publicado en el tablón');
      },
    });
  });
}

// ---------- Menú ⋯ ----------

function menuItems() {
  const items = [{ icon: 'palette', label: 'Opciones de visualización', run: openDisplaySheet }];
  if (!sess.code) items.push({ icon: 'mail', label: 'Solicitar mi código', run: openRequestSheet });
  if (sess.code && st && isAdmin()) items.push({ icon: 'pdf', label: 'Documentos', run: openDocsSheet });
  if (sess.code && st) items.push({ icon: pushState() === 'on' ? 'bell' : 'bellOff', label: `Avisos: ${pushState() === 'on' ? 'activados' : 'desactivados'}`, run: openPushSheet });
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
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').then(refreshPush).catch(() => {});
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'refresh') refresh();
    if (e.data?.type === 'go') { if (st) goTo(e.data.go); else linkGo = e.data.go; }
  });
  clearNotifications();
}
