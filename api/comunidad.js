// Función serverless de Vercel: datos de «Mi comunidad» (tablón, chat de vecinos, mensajes a la
// presidencia y encuestas de una comunidad de vecinos).
//
// Nadie da datos personales. Cada vivienda tiene un código propio que el presidente imprime y deja en
// su buzón; con ese código se entra en la app. El servidor solo guarda el resumen SHA-256 del código,
// así que tampoco lo puede leer: si un vecino lo pierde, se genera uno nuevo y el viejo deja de valer.
// Los permisos (publicar en el tablón, moderar el chat, encuestas, viviendas) se comprueban AQUÍ,
// según el cargo de la vivienda que llama: presidente ('pres') o vicepresidente ('vice').
//
//   GET  /api/comunidad                                   -> { configured }
//   POST { action: 'create', name, label }                -> { code, pub }       (nueva comunidad; quien la crea es el presidente)
//   POST { action: 'request', pub, label }                -> { ok, name }        (un vecino pide su código; lo ve la presidencia)
//   POST { action: 'community', pub }                     -> { name }            (nombre a partir del código público)
//   Con el código de la vivienda en `code`:
//   POST { action: 'state', code }                        -> todo lo de la pantalla principal
//   POST { action: 'post' | 'post-del' | 'post-pin', code, … }            (tablón; solo cargos)
//   POST { action: 'chat-poll', code, room?, after }      -> { msgs, open, blocked }   (room: 'general' o un chat con miembros)
//   POST { action: 'chat-send', code, room?, text }       -> { s }
//   POST { action: 'chat-del' | 'chat-open' | 'block', code, room?, … }   (moderación; solo cargos)
//   POST { action: 'room-create' | 'room-edit' | 'room-del', code, … }    (cargos: chats con solo algunas viviendas)
//   Llamadas con la presidencia (WebRTC: la voz y el vídeo van directos entre móviles; aquí solo pasan las señales):
//   POST { action: 'ice', code }                          -> { iceServers }   (STUN, y TURN si Vercel tiene las claves de Cloudflare)
//   POST { action: 'call-send', code, mid?, device, sig } -> { s }   (sig: { k: ring|accept|reject|busy|offer|answer|end, cid, to?, sdp?, video? })
//   POST { action: 'call-poll', code, mid?, after }       -> { signals }
//   POST { action: 'dm-get', code, mid? }                 -> { msgs }   (vecino: su conversación; cargos: la de `mid`)
//   POST { action: 'dm-send', code, text, mid? }          -> { ok }
//   POST { action: 'poll-create' | 'poll-close' | 'poll-del', code, … }   (encuestas; solo cargos)
//   POST { action: 'poll-vote', code, id, opt }           -> { ok }
//   POST { action: 'units-add', code, labels }            -> { codes: [{ mid, label, code }] }   (solo cargos)
//   POST { action: 'unit-code' | 'unit-del' | 'req-del', code, … }        (solo cargos)
//   POST { action: 'unit-rename', code, mid, label }      (solo cargos: cambia el nombre de la vivienda o local)
//   POST { action: 'rename', code, name }                 (cargos)
//   POST { action: 'handover', code, pres, vice }         (cargos: nuevos presidente y vicepresidente)
//   POST { action: 'icon-set', code, data }              (cargos: icono de la comunidad, JPEG en data URL; '' lo quita)
//   POST { action: 'icon-get', code }                     -> { data }
//   POST { action: 'file-put', code, fid, part, parts, data } (cargos: trozo en base64 de un archivo del tablón)
//   POST { action: 'file-get', code, fid, part }          -> { data }
//   Avisos push:
//   POST { action: 'push-key' }                           -> { publicKey }   (clave VAPID pública)
//   POST { action: 'subscribe', code, device, sub }       -> { ok }          (este dispositivo recibe avisos de su vivienda)
//   POST { action: 'unsubscribe', device }                -> { ok }
//   POST { action: 'notes', device }                      -> { notes }       (avisos pendientes; los pide el service worker)
//
// Los avisos son pushes vacíos: el servidor deja el texto en el buzón del dispositivo (`vec:n:`) y el
// service worker lo recoge con `notes` al recibir el push. Así no hace falta cifrar el contenido del push.
//
// Almacenamiento: Upstash Redis (integración de Vercel), vía su API REST. Todas las claves empiezan
// por «vec:», así que puede compartir base de datos con otras apps sin mezclarse.

function findRedisEnv(env = process.env) {
  const known = [['KV_REST_API_URL', 'KV_REST_API_TOKEN'], ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']];
  for (const [u, t] of known) if (env[u] && env[t]) return { url: env[u], token: env[t] };
  for (const k of Object.keys(env)) {
    const m = k.match(/^(.*)(REST_API_URL|REDIS_REST_URL)$/);
    if (!m || !/^https?:\/\//.test(env[k] || '')) continue;
    const tk = m[1] + m[2].replace('URL', 'TOKEN');
    if (env[tk]) return { url: env[k], token: env[tk] };
  }
  return { url: null, token: null };
}
const { url: REDIS_URL, token: REDIS_TOKEN } = findRedisEnv();
const crypto = globalThis.crypto || require('crypto').webcrypto;

const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin 0/O ni 1/I/L, que se confunden en papel
const CODE_LEN = 12;           // 12 caracteres ≈ 60 bits: imposible de adivinar a ciegas
const PUB_LEN = 6;             // código público de la comunidad (para pedir el código propio)
const MAX_UNITS = 400;         // viviendas por comunidad
const MAX_LABEL = 24;
const MAX_NAME = 60;
const MAX_TEXT = 2000;         // mensaje de chat o a la presidencia
const MAX_POST = 6000;         // anuncio del tablón
const KEEP_POSTS = 150;
const KEEP_CHAT = 500;
const KEEP_DM = 300;
const KEEP_POLLS = 60;
const KEEP_REQ = 200;
const MAX_FAILS = 20;          // códigos equivocados por IP cada 15 minutos
const CREATES_PER_DAY = 5;     // comunidades nuevas por IP y día
const REQUESTS_PER_HOUR = 10;  // solicitudes de código por IP y hora
const MSGS_PER_MIN = 20;       // mensajes por minuto y vivienda
const DEVICE = /^[a-f0-9]{32}$/;
const FID = /^[a-f0-9]{32}$/;
const MAX_PART = 1300000;      // trozo de archivo en base64 (≈1 MB)
const MAX_PARTS = 12;          // ≈12 MB por archivo (la app limita a 10 MB)
const MAX_FILES = 5;           // archivos por anuncio
const UPLOAD_TTL_S = 86400;    // un archivo subido que no llega a publicarse se borra al día
const MAX_ICON = 160000;       // icono de la comunidad (JPEG pequeño en base64)
const MAX_ROOMS = 20;          // chats además del general
const MAX_SIG = 60000;         // señal de llamada (descripción de la conexión; con vídeo es larga)
const CALL_TTL_S = 120;        // las señales solo sirven mientras se conecta la llamada
const CALL_RING_MS = 45e3;     // lo que suena una llamada sin contestar
const KEEP_SIGS = 60;
const STUN = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
let turnCache = null;          // credenciales TURN de Cloudflare (duran un día; se renuevan cada hora)
const PUSH_TTL_S = 24 * 3600;  // un aviso que no llega en un día ya no se entrega
const KEEP_NOTES = 20;         // avisos pendientes por dispositivo
const NOTES_TTL_S = 7 * 86400;
const DEVICE_TTL_S = 400 * 86400;

async function redis(...command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}
async function pipeline(commands) {
  if (!commands.length) return [];
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error(json.error || 'pipeline');
  return json.map((r) => r.result);
}
const getJSON = async (key, fallback) => { const raw = await redis('GET', key); try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
const setJSON = (key, value) => redis('SET', key, JSON.stringify(value));

async function sha256hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function randomCode(len) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return [...bytes].map((b) => CODE_CHARS[b % 32]).join('');
}
const randomId = (n = 10) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
const normCode = (c) => String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
const fmtCode = (c) => c.match(/.{1,4}/g).join('-');
const codeHash = (c) => sha256hex(`micomunidad:${normCode(c)}`);
const cleanText = (s, max) => String(s ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, max);
const cleanLabel = (s) => cleanText(s, MAX_LABEL).replace(/\s+/g, ' ');
const sameLabel = (a, b) => a.toLowerCase().replace(/[\s.ºª°-]/g, '') === b.toLowerCase().replace(/[\s.ºª°-]/g, '');

const K = {
  code: (h) => `vec:k:${h}`,
  pub: (p) => `vec:p:${p}`,
  com: (cid) => `vec:c:${cid}`,
  board: (cid) => `vec:c:${cid}:board`,
  chat: (cid) => `vec:c:${cid}:chat`,
  chatSeq: (cid) => `vec:c:${cid}:cs`,
  dm: (cid, mid) => `vec:c:${cid}:dm:${mid}`,
  dmIndex: (cid) => `vec:c:${cid}:dmi`,
  polls: (cid) => `vec:c:${cid}:polls`,
  req: (cid) => `vec:c:${cid}:req`,
  devs: (cid) => `vec:c:${cid}:devs`,   // hash dispositivo -> vivienda
  dev: (d) => `vec:dev:${d}`,           // { cid, mid, sub }
  notes: (d) => `vec:n:${d}`,
  file: (cid, fid, part) => `vec:c:${cid}:f:${fid}:${part}`,
  icon: (cid) => `vec:c:${cid}:icon`,
  roomChat: (cid, room) => (room === 'general' ? `vec:c:${cid}:chat` : `vec:c:${cid}:chat:${room}`),
  roomSeq: (cid, room) => (room === 'general' ? `vec:c:${cid}:cs` : `vec:c:${cid}:cs:${room}`),
  calls: (cid, mid) => `vec:c:${cid}:call:${mid}`,
  callSeq: (cid, mid) => `vec:c:${cid}:callseq:${mid}`,
  rings: (cid) => `vec:c:${cid}:rings`,
};

// Chats: el general (todas las viviendas) y los que creen los cargos con algunas viviendas
function roomOf(com, id) {
  if (!id || id === 'general') return { id: 'general', name: 'Todos los vecinos', members: null, open: com.chatOpen !== false };
  return (com.rooms || []).find((r) => r.id === id) || null;
}
const canSee = (com, room, mid) => !!room && (isAdmin(com, mid) || !room.members || room.members.includes(mid));
const visibleRooms = (com, mid) => [roomOf(com, 'general'), ...(com.rooms || [])].filter((r) => canSee(com, r, mid));

// Servidores para conectar las llamadas: STUN siempre; TURN (Cloudflare) si Vercel tiene
// CF_TURN_KEY_ID y CF_TURN_API_TOKEN: con datos móviles suele hacer falta para que conecten.
async function iceServers() {
  const env = process.env;
  if (env.CF_TURN_KEY_ID && env.CF_TURN_API_TOKEN) {
    if (turnCache && Date.now() - turnCache.at < 3600e3) return turnCache.servers;
    try {
      const res = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.CF_TURN_KEY_ID}/credentials/generate-ice-servers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.CF_TURN_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: 86400 }),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.iceServers)) {
        const servers = json.iceServers.map((x) => ({ ...x, urls: [].concat(x.urls).filter((u) => !/:53(\?|$)/.test(u)) })).filter((x) => x.urls.length);
        turnCache = { at: Date.now(), servers: [...STUN, ...servers] };
        return turnCache.servers;
      }
    } catch (_) { /* se sigue sin TURN */ }
  }
  if (env.TURN_URLS && env.TURN_USER && env.TURN_PASS) return [...STUN, { urls: env.TURN_URLS.split(',').map((u) => u.trim()), username: env.TURN_USER, credential: env.TURN_PASS }];
  return STUN;
}
const fileKeys = (cid, files) => (files || []).flatMap((f) => Array.from({ length: f.parts }, (_, i) => K.file(cid, f.fid, i)));
function cleanFiles(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, MAX_FILES).filter((f) => f && FID.test(f.fid || '') && Number.isInteger(f.parts) && f.parts >= 1 && f.parts <= MAX_PARTS)
    .map((f) => ({ fid: f.fid, parts: f.parts, name: cleanText(f.name, 120) || 'archivo', type: cleanText(f.type, 100), size: Math.max(0, Math.min(15e6, Number(f.size) || 0)) }));
}

// ---------- Avisos push (VAPID, RFC 8292, con WebCrypto) ----------

const b64u = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const utf8 = (s) => new TextEncoder().encode(s);
let vapidCache;
async function vapidKeys() {
  if (vapidCache) return vapidCache;
  let raw = await redis('GET', 'vec:vapid');
  if (!raw) {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    await redis('SET', 'vec:vapid', JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d }), 'NX');
    raw = await redis('GET', 'vec:vapid'); // por si otra llamada la creó a la vez
  }
  const jwk = JSON.parse(raw);
  const key = await crypto.subtle.importKey('jwk', { ...jwk, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const pub = new Uint8Array(65);
  pub[0] = 4;
  pub.set(unb64u(jwk.x), 1);
  pub.set(unb64u(jwk.y), 33);
  vapidCache = { key, publicKey: b64u(pub) };
  return vapidCache;
}
async function vapidHeader(endpoint, subject) {
  const { key, publicKey } = await vapidKeys();
  const head = b64u(utf8(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(utf8(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, utf8(`${head}.${body}`));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${publicKey}`;
}
async function sendPush(sub, subject) {
  const headers = { Authorization: await vapidHeader(sub.endpoint, subject), TTL: String(PUSH_TTL_S), Urgency: 'normal', 'Content-Length': '0' };
  const res = await fetch(sub.endpoint, { method: 'POST', headers });
  return res.status;
}
let SUBJECT = 'https://comunidad.vercel.app'; // se ajusta en cada llamada con el dominio real
async function forgetDevice(device, cid) {
  const cmds = [['DEL', K.dev(device)], ['DEL', K.notes(device)]];
  if (cid) cmds.push(['HDEL', K.devs(cid), device]);
  await pipeline(cmds);
}
// Avisa a las viviendas de la comunidad. `to`: 'all' | 'admins' | mid; `skip`: vivienda que lo provoca.
// note = { title, body, go, tag }
async function notify(cid, com, to, skip, note) {
  try {
    const flat = (await redis('HGETALL', K.devs(cid))) || [];
    const targets = [];
    for (let i = 0; i < flat.length; i += 2) {
      const [device, mid] = [flat[i], flat[i + 1]];
      if (mid === skip || !com.units[mid]) continue;
      if (to === 'all' || (to === 'admins' && isAdmin(com, mid)) || to === mid || (Array.isArray(to) && (to.includes(mid) || isAdmin(com, mid)))) targets.push(device);
    }
    if (!targets.length) return;
    const n = JSON.stringify({ ...note, t: Date.now() });
    const subs = await pipeline(targets.flatMap((d) => [
      ['RPUSH', K.notes(d), n], ['LTRIM', K.notes(d), -KEEP_NOTES, -1], ['EXPIRE', K.notes(d), NOTES_TTL_S], ['GET', K.dev(d)],
    ]));
    await Promise.all(targets.map(async (device, i) => {
      const raw = subs[i * 4 + 3];
      if (!raw) { await redis('HDEL', K.devs(cid), device); return; }
      try {
        const status = await sendPush(JSON.parse(raw).sub, SUBJECT);
        if (status === 404 || status === 410) await forgetDevice(device, cid);
      } catch (_) { /* el servicio push no responde: este aviso se pierde, el dato no */ }
    }));
  } catch (_) { /* los avisos nunca impiden guardar */ }
}
// Quita los dispositivos de una vivienda (al cambiar su código o eliminarla: tendrán que volver a entrar)
async function dropUnitDevices(cid, mid, keep = '') {
  const flat = (await redis('HGETALL', K.devs(cid))) || [];
  const ds = [];
  for (let i = 0; i < flat.length; i += 2) if (flat[i + 1] === mid && flat[i] !== keep) ds.push(flat[i]);
  if (ds.length) await pipeline(ds.flatMap((d) => [['DEL', K.dev(d)], ['DEL', K.notes(d)], ['HDEL', K.devs(cid), d]]));
}
const short = (s, n = 110) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const clientIp = (req) => String(req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'desconocida').split(',')[0].trim();
// Límite por ventana de tiempo: true si ya se ha llegado
async function limited(key, max, seconds) {
  const [n] = await pipeline([['INCR', key], ['EXPIRE', key, seconds, 'NX']]);
  return Number(n) > max;
}

const roleOf = (com, mid) => (com.pres === mid ? 'pres' : com.vice === mid ? 'vice' : '');
const isAdmin = (com, mid) => !!roleOf(com, mid);

// Asigna un código nuevo a una vivienda (el anterior deja de valer)
async function issueCode(cid, com, mid) {
  const code = randomCode(CODE_LEN);
  const h = await codeHash(code);
  const old = com.units[mid].h;
  com.units[mid].h = h;
  com.units[mid].issued = Date.now();
  const cmds = [['SET', K.code(h), `${cid}:${mid}`]];
  if (old) cmds.push(['DEL', K.code(old)]);
  await pipeline(cmds);
  return fmtCode(code);
}
function newUnit(com, label) {
  let mid;
  do mid = randomId(5); while (com.units[mid]);
  com.units[mid] = { label, created: Date.now(), h: '', blocked: false, seen: 0 };
  return mid;
}

// Cierra las encuestas vencidas y publica su resultado en el tablón
function pollResult(poll, com) {
  const counts = poll.opts.map(() => 0);
  Object.values(poll.votes || {}).forEach((i) => { if (counts[i] !== undefined) counts[i]++; });
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(0, ...counts);
  const winners = max > 0 ? poll.opts.filter((_, i) => counts[i] === max) : [];
  return { counts, total, units: Object.keys(com.units).length, winners };
}
async function closePoll(cid, com, poll, by) {
  poll.closed = Date.now();
  poll.result = pollResult(poll, com);
  const r = poll.result;
  const lines = poll.opts.map((o, i) => `• ${o}: ${r.counts[i]} ${r.counts[i] === 1 ? 'voto' : 'votos'}${r.total ? ` (${Math.round((r.counts[i] / r.total) * 100)} %)` : ''}`);
  const verdict = !r.total ? 'No ha votado nadie.'
    : r.winners.length === 1 ? `Opción más votada: «${r.winners[0]}».`
    : `Empate entre ${r.winners.map((w) => `«${w}»`).join(' y ')}.`;
  const text = `${verdict}\n\n${lines.join('\n')}\n\nHan votado ${r.total} de ${r.units} viviendas.`;
  await addPost(cid, { title: `Resultado de la encuesta: ${poll.q}`, text, by: by || '', role: by ? roleOf(com, by) : 'auto', kind: 'result', poll: poll.id });
  await notify(cid, com, 'all', '', { title: com.name, body: `📊 Resultado de la encuesta «${short(poll.q, 80)}»: ${short(verdict, 90)}`, go: 'board', tag: `poll-${poll.id}` });
}
async function addPost(cid, post) {
  const board = await getJSON(K.board(cid), []);
  board.push({ id: randomId(6), t: Date.now(), pin: false, ...post });
  // se guardan los últimos KEEP_POSTS, pero los fijados no se pierden
  const gone = [];
  while (board.length > KEEP_POSTS) {
    const i = board.findIndex((p) => !p.pin);
    gone.push(...board.splice(i < 0 ? 0 : i, 1));
  }
  await setJSON(K.board(cid), board);
  const keys = gone.flatMap((p) => fileKeys(cid, p.files));
  if (keys.length) await redis('DEL', ...keys);
}
async function loadPolls(cid, com) {
  const polls = await getJSON(K.polls(cid), []);
  let changed = false;
  for (const p of polls) {
    if (!p.closed && p.closes && p.closes <= Date.now()) { await closePoll(cid, com, p, ''); changed = true; }
  }
  if (changed) await setJSON(K.polls(cid), polls);
  return polls;
}
// Lo que ve cada vivienda de una encuesta: el recuento solo al cerrarse (los cargos lo ven siempre)
function pollView(p, com, mid) {
  const admin = isAdmin(com, mid);
  const live = pollResult(p, com);
  return {
    id: p.id, q: p.q, desc: p.desc || '', opts: p.opts, t: p.t, closes: p.closes || 0, closed: p.closed || 0,
    mine: p.votes && p.votes[mid] !== undefined ? p.votes[mid] : null,
    voters: live.total, units: live.units,
    result: p.closed ? p.result : admin ? live : null,
  };
}
const unitName = (com, mid) => (com.units[mid] ? com.units[mid].label : 'Vivienda eliminada');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!REDIS_URL || !REDIS_TOKEN) {
    const vars = Object.keys(process.env).filter((k) => /KV|REDIS|UPSTASH|REST_API/.test(k)).sort();
    return res.status(req.method === 'GET' ? 200 : 503).json({ configured: false, error: 'not-configured', vars });
  }
  if (req.method === 'GET') {
    try { await redis('PING'); const ice = await iceServers(); return res.status(200).json({ configured: true, turn: ice.length > STUN.length ? 'ok' : 'sin-claves' }); } catch (err) { return res.status(200).json({ configured: false, error: `redis: ${err.message}` }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  SUBJECT = `https://${req.headers?.host || 'comunidad.vercel.app'}`;
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { action } = body;
  const bad = (error = 'bad-request', status = 400) => res.status(status).json({ error });
  const ipKey = await sha256hex(clientIp(req));

  try {
    // ---------- Sin código ----------
    if (action === 'push-key') return res.status(200).json({ publicKey: (await vapidKeys()).publicKey });
    if (action === 'unsubscribe') {
      if (!DEVICE.test(body.device || '')) return bad();
      const d = await getJSON(K.dev(body.device), null);
      await forgetDevice(body.device, d && d.cid);
      return res.status(200).json({ ok: true });
    }
    if (action === 'notes') {
      if (!DEVICE.test(body.device || '')) return bad();
      const [raw] = await pipeline([['LRANGE', K.notes(body.device), 0, -1], ['DEL', K.notes(body.device)]]);
      const d = await getJSON(K.dev(body.device), null);
      const com = d && await getJSON(K.com(d.cid), null);
      return res.status(200).json({ notes: (raw || []).map((n) => JSON.parse(n)), name: com ? com.name : '' });
    }

    if (action === 'create') {
      const name = cleanText(body.name, MAX_NAME) || 'Mi comunidad';
      const label = cleanLabel(body.label);
      if (!label) return bad();
      if (await limited(`vec:rl:create:${ipKey}`, CREATES_PER_DAY, 86400)) return bad('too-many', 429);
      const cid = randomId(8);
      let pub;
      for (let i = 0; i < 10; i++) {
        pub = randomCode(PUB_LEN);
        if (await redis('SET', K.pub(pub), cid, 'NX')) break;
        pub = '';
      }
      if (!pub) return bad('busy', 503);
      const com = { id: cid, name, pub, created: Date.now(), pres: '', vice: '', chatOpen: true, units: {} };
      const mid = newUnit(com, label);
      com.pres = mid;
      const code = await issueCode(cid, com, mid);
      await setJSON(K.com(cid), com);
      await addPost(cid, { title: `Bienvenidos a ${name}`, text: 'Este es el tablón de anuncios de la comunidad. Aquí publicará la presidencia las noticias, convocatorias y resultados de las encuestas.', by: mid, role: 'pres' });
      return res.status(200).json({ code, pub, name });
    }

    if (action === 'community' || action === 'request') {
      const pub = normCode(body.pub);
      if (pub.length !== PUB_LEN) return bad('no-community', 404);
      const cid = await redis('GET', K.pub(pub));
      const com = cid && await getJSON(K.com(cid), null);
      if (!com) return bad('no-community', 404);
      if (action === 'community') return res.status(200).json({ name: com.name });
      const label = cleanLabel(body.label);
      if (!label) return bad();
      if (await limited(`vec:rl:req:${ipKey}`, REQUESTS_PER_HOUR, 3600)) return bad('too-many', 429);
      const reqs = await getJSON(K.req(cid), []);
      if (!reqs.some((r) => sameLabel(r.label, label))) {
        reqs.push({ id: randomId(6), label, t: Date.now() });
        await setJSON(K.req(cid), reqs.slice(-KEEP_REQ));
        await notify(cid, com, 'admins', '', { title: com.name, body: `🔑 La vivienda ${label} ha pedido su código de acceso`, go: 'admin', tag: 'requests' });
      }
      return res.status(200).json({ ok: true, name: com.name });
    }

    // ---------- Con el código de la vivienda ----------
    const failKey = `vec:rl:fail:${ipKey}`;
    if ((Number(await redis('GET', failKey)) || 0) >= MAX_FAILS) return bad('too-many', 429);
    const norm = normCode(body.code);
    const link = norm.length === CODE_LEN ? await redis('GET', K.code(await codeHash(norm))) : null;
    const [cid, mid] = String(link || '').split(':');
    const com = link && await getJSON(K.com(cid), null);
    if (!com || !com.units[mid]) {
      await pipeline([['INCR', failKey], ['EXPIRE', failKey, 900, 'NX']]);
      return bad('bad-code', 401);
    }
    const me = com.units[mid];
    const role = roleOf(com, mid);
    const admin = !!role; // presidente y vicepresidente tienen los mismos permisos
    const saveCom = () => setJSON(K.com(cid), com);
    const ok = (extra = {}) => res.status(200).json({ ok: true, ...extra });
    const needAdmin = () => bad('forbidden', 403);

    switch (action) {
      case 'subscribe': {
        const sub = body.sub;
        if (!DEVICE.test(body.device || '') || !sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || JSON.stringify(sub).length > 4000) return bad();
        const old = await getJSON(K.dev(body.device), null);
        const cmds = [
          ['SET', K.dev(body.device), JSON.stringify({ cid, mid, sub: { endpoint: sub.endpoint, keys: sub.keys || {} }, t: Date.now() }), 'EX', DEVICE_TTL_S],
          ['HSET', K.devs(cid), body.device, mid],
        ];
        if (old && old.cid !== cid) cmds.push(['HDEL', K.devs(old.cid), body.device]);
        await pipeline(cmds);
        return ok();
      }
      case 'state': {
        if (Date.now() - (me.seen || 0) > 3600e3) { me.seen = Date.now(); await saveCom(); }
        const rooms = visibleRooms(com, mid);
        const [board, polls, tails, dmIndex, reqs, ringsRaw] = await Promise.all([
          getJSON(K.board(cid), []),
          loadPolls(cid, com),
          pipeline(rooms.map((r) => ['LRANGE', K.roomChat(cid, r.id), -1, -1])),
          redis('HGETALL', K.dmIndex(cid)),
          admin ? getJSON(K.req(cid), []) : [],
          redis('HGETALL', K.rings(cid)),
        ]);
        // Llamadas sonando para esta vivienda: de la presidencia a ella, o (cargos) de un vecino a la presidencia
        const rings = [];
        for (let i = 0; i < (ringsRaw || []).length; i += 2) {
          const r = JSON.parse(ringsRaw[i + 1]);
          if (Date.now() - r.t > CALL_RING_MS) continue;
          const thread = ringsRaw[i];
          if (admin ? !r.fromRole && com.units[thread] : thread === mid && r.fromRole) rings.push({ thread, ...r, label: unitName(com, thread) });
        }
        const idx = {};
        for (let i = 0; i < (dmIndex || []).length; i += 2) idx[dmIndex[i]] = JSON.parse(dmIndex[i + 1]);
        const out = {
          community: { name: com.name, pub: com.pub, chatOpen: com.chatOpen, iconV: com.iconV || 0 },
          me: { mid, label: me.label, role, blocked: !!me.blocked },
          board: board.slice().reverse().map((p) => ({ ...p, byLabel: p.by ? unitName(com, p.by) : '' })),
          polls: polls.slice().reverse().map((p) => pollView(p, com, mid)),
          rooms: rooms.map((r, i) => {
            const last = tails[i] && tails[i][0] ? JSON.parse(tails[i][0]) : null;
            return { id: r.id, name: r.name, members: r.members ? r.members.filter((m) => com.units[m]) : null, open: r.open !== false, last: last ? { s: last.s, t: last.t, mine: last.mid === mid } : { s: 0, t: 0 } };
          }),
          rings,
          dm: idx[mid] || null,
        };
        if (admin) {
          out.threads = Object.entries(idx).filter(([m]) => com.units[m]).map(([m, v]) => ({ mid: m, label: unitName(com, m), ...v })).sort((a, b) => b.t - a.t);
          out.requests = reqs.slice().reverse();
          out.units = Object.entries(com.units).map(([m, u]) => ({ mid: m, label: u.label, role: roleOf(com, m), blocked: !!u.blocked, issued: u.issued || 0, seen: u.seen || 0 }))
            .sort((a, b) => a.label.localeCompare(b.label, 'es', { numeric: true }));
        }
        return res.status(200).json(out);
      }

      // ----- Tablón -----
      case 'post': {
        if (!admin) return needAdmin();
        const title = cleanText(body.title, 140);
        const text = cleanText(body.text, MAX_POST);
        const files = cleanFiles(body.files);
        if (!title && !text && !files.length) return bad();
        if (files.length) {
          const keys = fileKeys(cid, files);
          const exists = await pipeline(keys.map((k) => ['EXISTS', k]));
          if (exists.some((e) => !Number(e))) return bad('file-missing', 409);
          await pipeline(keys.map((k) => ['PERSIST', k])); // ya forma parte de un anuncio: no caduca
        }
        await addPost(cid, { title, text, by: mid, role, pin: !!body.pin, ...(files.length ? { files } : {}) });
        await notify(cid, com, 'all', mid, { title: com.name, body: `📌 ${short(title || text, 120)}`, go: 'board', tag: 'board' });
        return ok();
      }
      case 'post-del':
      case 'post-pin': {
        if (!admin) return needAdmin();
        const board = await getJSON(K.board(cid), []);
        const i = board.findIndex((p) => p.id === body.id);
        if (i < 0) return bad('gone', 404);
        let removed = null;
        if (action === 'post-del') [removed] = board.splice(i, 1);
        else board[i].pin = !!body.pin;
        await setJSON(K.board(cid), board);
        const keys = removed ? fileKeys(cid, removed.files) : [];
        if (keys.length) await redis('DEL', ...keys);
        return ok();
      }

      // ----- Chat de vecinos -----
      case 'chat-poll': {
        const room = roomOf(com, body.room);
        if (!canSee(com, room, mid)) return bad('gone', 404);
        const after = Math.max(0, Number(body.after) || 0);
        const raw = await redis('LRANGE', K.roomChat(cid, room.id), after ? -KEEP_CHAT : -200, -1);
        const all = (raw || []).map((m) => JSON.parse(m));
        const msgs = all.filter((m) => m.s > after).map((m) => ({ ...m, label: unitName(com, m.mid), role: roleOf(com, m.mid), text: m.del ? '' : m.text }));
        // los mensajes borrados después se avisan aparte para quitarlos de la pantalla
        const dels = all.filter((m) => m.del && m.s <= after).map((m) => m.s);
        return res.status(200).json({ msgs, dels, open: room.open !== false, blocked: !!me.blocked, name: room.name, members: room.members });
      }
      case 'chat-send': {
        const room = roomOf(com, body.room);
        if (!canSee(com, room, mid)) return bad('gone', 404);
        const text = cleanText(body.text, MAX_TEXT);
        if (!text) return bad();
        if (me.blocked) return bad('blocked', 403);
        if (room.open === false && !admin) return bad('closed', 403);
        if (await limited(`vec:rl:msg:${cid}:${mid}`, MSGS_PER_MIN, 60)) return bad('too-many', 429);
        const s = await redis('INCR', K.roomSeq(cid, room.id));
        const msg = { s, t: Date.now(), mid, text };
        await pipeline([['RPUSH', K.roomChat(cid, room.id), JSON.stringify(msg)], ['LTRIM', K.roomChat(cid, room.id), -KEEP_CHAT, -1]]);
        await notify(cid, com, room.members || 'all', mid, {
          title: room.id === 'general' ? `Chat · ${com.name}` : `${room.name} · ${com.name}`,
          body: `${me.label}${role ? ` (${role === 'pres' ? 'Presidente' : 'Vicepresidente'})` : ''}: ${short(text)}`,
          go: `chat:${room.id}`, tag: `chat-${room.id}`,
        });
        return ok({ s, t: msg.t });
      }
      case 'chat-del': {
        if (!admin) return needAdmin();
        const room = roomOf(com, body.room);
        if (!room) return bad('gone', 404);
        const key = K.roomChat(cid, room.id);
        const raw = await redis('LRANGE', key, 0, -1);
        const i = (raw || []).findIndex((m) => JSON.parse(m).s === Number(body.s));
        if (i < 0) return bad('gone', 404);
        const m = JSON.parse(raw[i]);
        m.del = Date.now();
        m.delBy = mid;
        m.text = '';
        await redis('LSET', key, i, JSON.stringify(m));
        return ok();
      }
      case 'chat-open': {
        if (!admin) return needAdmin();
        const room = roomOf(com, body.room);
        if (!room) return bad('gone', 404);
        if (room.id === 'general') com.chatOpen = !!body.open;
        else room.open = !!body.open;
        await saveCom();
        return ok({ open: !!body.open });
      }
      case 'room-create':
      case 'room-edit': {
        if (!admin) return needAdmin();
        const name = cleanText(body.name, 40);
        const members = [...new Set((Array.isArray(body.members) ? body.members : []).filter((m) => com.units[m]))];
        if (!name) return bad();
        com.rooms = com.rooms || [];
        if (action === 'room-create') {
          if (com.rooms.length >= MAX_ROOMS) return bad('too-many-rooms', 409);
          let id;
          do id = randomId(4); while (com.rooms.some((r) => r.id === id));
          com.rooms.push({ id, name, members, open: true, t: Date.now() });
          await saveCom();
          await notify(cid, com, members, mid, { title: com.name, body: `💬 Te han añadido al chat «${name}»`, go: `chat:${id}`, tag: `chat-${id}` });
          return ok({ id });
        }
        const room = com.rooms.find((r) => r.id === body.room);
        if (!room) return bad('gone', 404);
        const added = members.filter((m) => !room.members.includes(m));
        room.name = name;
        room.members = members;
        await saveCom();
        if (added.length) await notify(cid, com, added, mid, { title: com.name, body: `💬 Te han añadido al chat «${name}»`, go: `chat:${room.id}`, tag: `chat-${room.id}` });
        return ok({ id: room.id });
      }
      case 'room-del': {
        if (!admin) return needAdmin();
        const i = (com.rooms || []).findIndex((r) => r.id === body.room);
        if (i < 0) return bad('gone', 404);
        const [room] = com.rooms.splice(i, 1);
        await saveCom();
        await pipeline([['DEL', K.roomChat(cid, room.id)], ['DEL', K.roomSeq(cid, room.id)]]);
        return ok();
      }

      // ----- Llamadas con la presidencia -----
      case 'ice':
        return res.status(200).json({ iceServers: await iceServers() });
      case 'call-send': {
        const thread = admin && body.mid ? body.mid : mid;
        if (!com.units[thread]) return bad('gone', 404);
        const sig = body.sig || {};
        const k = String(sig.k || '');
        if (!['ring', 'accept', 'reject', 'busy', 'offer', 'answer', 'end'].includes(k) || !/^[a-f0-9]{16}$/.test(sig.cid || '') || !DEVICE.test(body.device || '')) return bad();
        if (sig.sdp && (typeof sig.sdp !== 'string' || sig.sdp.length > MAX_SIG)) return bad();
        if (await limited(`vec:rl:call:${cid}:${thread}`, 80, 60)) return bad('too-many', 429);
        const fromRole = thread !== mid ? role : ''; // un cargo llamando o contestando a una vivienda
        const s = await redis('INCR', K.callSeq(cid, thread));
        const t = Date.now();
        const m = { s, t, k, cid: sig.cid, to: DEVICE.test(sig.to || '') ? sig.to : '', sdp: sig.sdp || '', video: !!sig.video, dev: body.device, from: mid, fromRole, fromLabel: me.label };
        const cmds = [
          ['RPUSH', K.calls(cid, thread), JSON.stringify(m)], ['LTRIM', K.calls(cid, thread), -KEEP_SIGS, -1],
          ['EXPIRE', K.calls(cid, thread), CALL_TTL_S], ['EXPIRE', K.callSeq(cid, thread), 86400],
        ];
        if (k === 'ring') cmds.push(['HSET', K.rings(cid), thread, JSON.stringify({ cid: sig.cid, t, video: !!sig.video, fromRole, dev: body.device })]);
        if (k === 'accept' || k === 'end' || (k === 'reject' && !fromRole)) cmds.push(['HDEL', K.rings(cid), thread]);
        await pipeline(cmds);
        if (k === 'ring') {
          const what = sig.video ? 'videollamada' : 'llamada';
          if (fromRole) await notify(cid, com, thread, mid, { title: com.name, body: `📞 La presidencia te está haciendo una ${what}`, go: 'contact', tag: `call-${thread}` });
          else await notify(cid, com, 'admins', mid, { title: com.name, body: `📞 ${what === 'llamada' ? 'Llamada' : 'Videollamada'} de la vivienda ${me.label}`, go: `thread:${thread}`, tag: `call-${thread}` });
        }
        return ok({ s, t });
      }
      case 'call-poll': {
        const thread = admin && body.mid ? body.mid : mid;
        const after = Math.max(0, Number(body.after) || 0);
        const raw = (await redis('LRANGE', K.calls(cid, thread), 0, -1)) || [];
        return res.status(200).json({ signals: raw.map((x) => JSON.parse(x)).filter((x) => x.s > after) });
      }
      case 'block': {
        if (!admin) return needAdmin();
        const u = com.units[body.mid];
        if (!u) return bad('gone', 404);
        if (isAdmin(com, body.mid)) return bad('is-admin', 409);
        u.blocked = !!body.blocked;
        await saveCom();
        return ok();
      }

      // ----- Mensajes a la presidencia (solo los leen el presidente y el vicepresidente) -----
      case 'dm-get': {
        const who = admin && body.mid ? body.mid : mid;
        if (!admin && who !== mid) return needAdmin();
        if (!com.units[who]) return bad('gone', 404);
        const raw = await redis('LRANGE', K.dm(cid, who), 0, -1);
        const msgs = (raw || []).map((m) => JSON.parse(m)).map((m) => ({ ...m, byLabel: unitName(com, m.by), byRole: m.role || '' }));
        return res.status(200).json({ msgs, label: unitName(com, who) });
      }
      case 'dm-send': {
        const text = cleanText(body.text, MAX_TEXT);
        if (!text) return bad();
        // un cargo escribe en la conversación de otra vivienda; un vecino solo en la suya
        const who = admin && body.mid && body.mid !== mid ? body.mid : mid;
        if (!com.units[who]) return bad('gone', 404);
        if (await limited(`vec:rl:msg:${cid}:${mid}`, MSGS_PER_MIN, 60)) return bad('too-many', 429);
        const fromBoard = who !== mid; // respuesta de la presidencia
        const msg = { id: randomId(6), t: Date.now(), by: mid, role: fromBoard ? role : '', text };
        await pipeline([
          ['RPUSH', K.dm(cid, who), JSON.stringify(msg)],
          ['LTRIM', K.dm(cid, who), -KEEP_DM, -1],
          ['HSET', K.dmIndex(cid), who, JSON.stringify({ t: msg.t, from: fromBoard ? 'junta' : 'vecino', text: text.slice(0, 120) })],
        ]);
        if (body.quiet) { /* registro de una llamada contestada: sin aviso */ } else if (fromBoard) await notify(cid, com, who, mid, { title: com.name, body: `✉️ Respuesta de la presidencia: ${short(text)}`, go: 'contact', tag: 'dm' });
        else await notify(cid, com, 'admins', mid, { title: com.name, body: `✉️ Vivienda ${me.label}: ${short(text)}`, go: `thread:${mid}`, tag: `dm-${mid}` });
        return ok({ t: msg.t });
      }

      // ----- Encuestas -----
      case 'poll-create': {
        if (!admin) return needAdmin();
        const q = cleanText(body.q, 200);
        const opts = (Array.isArray(body.opts) ? body.opts : []).map((o) => cleanText(o, 120)).filter(Boolean);
        if (!q || opts.length < 2 || opts.length > 10 || new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) return bad();
        const closes = Number(body.closes) || 0;
        if (closes && closes < Date.now() + 60e3) return bad('past');
        const polls = await getJSON(K.polls(cid), []);
        const pid = randomId(6);
        polls.push({ id: pid, q, desc: cleanText(body.desc, 1500), opts, t: Date.now(), by: mid, closes, closed: 0, votes: {} });
        await setJSON(K.polls(cid), polls.slice(-KEEP_POLLS));
        await notify(cid, com, 'all', mid, { title: com.name, body: `🗳️ Nueva encuesta: ${short(q, 120)}`, go: 'polls', tag: `poll-${pid}` });
        return ok();
      }
      case 'poll-vote': {
        const polls = await loadPolls(cid, com);
        const p = polls.find((x) => x.id === body.id);
        if (!p) return bad('gone', 404);
        if (p.closed) return bad('closed', 409);
        const opt = Number(body.opt);
        if (!Number.isInteger(opt) || opt < 0 || opt >= p.opts.length) return bad();
        p.votes = p.votes || {};
        p.votes[mid] = opt; // un voto por vivienda; se puede cambiar mientras esté abierta
        await setJSON(K.polls(cid), polls);
        return ok();
      }
      case 'poll-close':
      case 'poll-del': {
        if (!admin) return needAdmin();
        const polls = await loadPolls(cid, com);
        const i = polls.findIndex((x) => x.id === body.id);
        if (i < 0) return bad('gone', 404);
        if (action === 'poll-del') polls.splice(i, 1);
        else if (!polls[i].closed) await closePoll(cid, com, polls[i], mid);
        await setJSON(K.polls(cid), polls);
        return ok();
      }

      // ----- Viviendas y códigos (cargos) -----
      case 'units-add': {
        if (!admin) return needAdmin();
        const labels = [...new Set((Array.isArray(body.labels) ? body.labels : []).map(cleanLabel).filter(Boolean))];
        if (!labels.length || labels.length > 100) return bad();
        const existing = Object.values(com.units).map((u) => u.label);
        const fresh = labels.filter((l) => !existing.some((e) => sameLabel(e, l)));
        if (Object.keys(com.units).length + fresh.length > MAX_UNITS) return bad('too-many-units', 409);
        const codes = [];
        for (const label of fresh) {
          const m = newUnit(com, label);
          codes.push({ mid: m, label, code: await issueCode(cid, com, m) });
        }
        // al dar de alta una vivienda que había pedido su código, la solicitud se da por atendida
        const reqs = await getJSON(K.req(cid), []);
        const left = reqs.filter((r) => !labels.some((l) => sameLabel(l, r.label)));
        await saveCom();
        if (left.length !== reqs.length) await setJSON(K.req(cid), left);
        return ok({ codes, skipped: labels.length - fresh.length });
      }
      case 'unit-code': {
        if (!admin) return needAdmin();
        if (!com.units[body.mid]) return bad('gone', 404);
        const code = await issueCode(cid, com, body.mid);
        await saveCom();
        // los móviles que usaban el código anterior dejan de recibir avisos (menos el de quien lo genera)
        await dropUnitDevices(cid, body.mid, body.mid === mid ? body.device : '');
        const reqs = await getJSON(K.req(cid), []);
        const left = reqs.filter((r) => !sameLabel(r.label, com.units[body.mid].label));
        if (left.length !== reqs.length) await setJSON(K.req(cid), left);
        return ok({ code, label: com.units[body.mid].label });
      }
      case 'unit-rename': {
        if (!admin) return needAdmin();
        const u = com.units[body.mid];
        if (!u) return bad('gone', 404);
        const label = cleanLabel(body.label);
        if (!label) return bad();
        if (Object.entries(com.units).some(([m, x]) => m !== body.mid && sameLabel(x.label, label))) return bad('label-taken', 409);
        u.label = label; // el código de la vivienda sigue siendo el mismo
        await saveCom();
        return ok({ label });
      }
      case 'unit-del': {
        if (!admin) return needAdmin();
        const u = com.units[body.mid];
        if (!u) return bad('gone', 404);
        if (isAdmin(com, body.mid)) return bad('is-admin', 409);
        delete com.units[body.mid];
        (com.rooms || []).forEach((r) => { r.members = r.members.filter((m) => m !== body.mid); });
        await dropUnitDevices(cid, body.mid);
        await pipeline([['DEL', K.code(u.h)], ['DEL', K.dm(cid, body.mid)], ['HDEL', K.dmIndex(cid), body.mid]]);
        await saveCom();
        return ok();
      }
      case 'req-del': {
        if (!admin) return needAdmin();
        const reqs = await getJSON(K.req(cid), []);
        await setJSON(K.req(cid), reqs.filter((r) => r.id !== body.id));
        return ok();
      }

      // ----- Archivos del tablón -----
      case 'file-put': {
        if (!admin) return needAdmin();
        const part = Number(body.part);
        const parts = Number(body.parts);
        if (!FID.test(body.fid || '') || !Number.isInteger(parts) || parts < 1 || parts > MAX_PARTS || !Number.isInteger(part) || part < 0 || part >= parts) return bad();
        if (typeof body.data !== 'string' || !body.data || body.data.length > MAX_PART || !/^[A-Za-z0-9+/=]+$/.test(body.data)) return bad();
        if (await limited(`vec:rl:file:${cid}`, 200, 3600)) return bad('too-many', 429);
        await redis('SET', K.file(cid, body.fid, part), body.data, 'EX', UPLOAD_TTL_S);
        return ok();
      }
      case 'file-get': {
        if (!FID.test(body.fid || '')) return bad();
        const data = await redis('GET', K.file(cid, body.fid, Number(body.part) || 0));
        if (!data) return bad('gone', 404);
        return res.status(200).json({ data });
      }
      case 'icon-get': {
        const data = await redis('GET', K.icon(cid));
        return res.status(200).json({ data: data || '', v: com.iconV || 0 });
      }

      // ----- Nombre, icono y cargos (presidente y vicepresidente, con los mismos permisos) -----
      case 'icon-set': {
        if (!admin) return needAdmin();
        const data = String(body.data || '');
        if (data && (data.length > MAX_ICON || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(data))) return bad();
        if (data) await redis('SET', K.icon(cid), data);
        else await redis('DEL', K.icon(cid));
        com.iconV = data ? Date.now() : 0;
        await saveCom();
        return ok({ v: com.iconV });
      }
      case 'rename': {
        if (!admin) return needAdmin();
        const name = cleanText(body.name, MAX_NAME);
        if (!name) return bad();
        com.name = name;
        await saveCom();
        return ok({ name });
      }
      case 'handover': {
        if (!admin) return needAdmin();
        const pres = body.pres;
        const vice = body.vice || '';
        if (!com.units[pres] || (vice && (!com.units[vice] || vice === pres))) return bad();
        const before = { pres: com.pres, vice: com.vice };
        com.pres = pres;
        com.vice = vice;
        // los nuevos cargos no pueden quedar bloqueados en el chat
        com.units[pres].blocked = false;
        if (vice) com.units[vice].blocked = false;
        await saveCom();
        if (before.pres !== pres || before.vice !== vice) {
          const text = `La presidencia de la comunidad pasa a la vivienda ${com.units[pres].label}${vice ? ` y la vicepresidencia a la vivienda ${com.units[vice].label}` : ''}. Gracias a quienes han ocupado los cargos hasta ahora.`;
          await addPost(cid, { title: 'Nuevos cargos de la comunidad', text, by: mid, role: role || 'pres', kind: 'handover' });
          await notify(cid, com, 'all', mid, { title: com.name, body: `👑 Nuevos cargos: presidencia para la vivienda ${com.units[pres].label}${vice ? `, vicepresidencia para la ${com.units[vice].label}` : ''}`, go: 'board', tag: 'board' });
        }
        return ok();
      }
      default:
        return bad('unknown-action');
    }
  } catch (err) {
    return res.status(500).json({ error: 'server', detail: String(err.message || err).slice(0, 200) });
  }
};
