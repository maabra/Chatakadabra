const BACKENDS = (process.env.REACT_APP_API_BACKENDS || process.env.REACT_APP_API_BASE || 'http://localhost:8000')
  .split(',')
  .map(s => s.trim()) // Novo naučeno sa RS vježbi
  .filter(Boolean);
const DEFAULT_BASE = BACKENDS[0] || 'http://localhost:8000';

function pickBackendByKey(key) {
  if (!key || BACKENDS.length === 0) return DEFAULT_BASE;
  const h = Math.abs(String(key).split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
  const idx = h % BACKENDS.length;
  return BACKENDS[idx];
}

async function request(path, options = {}) {
  const base = options.base || DEFAULT_BASE;
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
export async function health() {
  return request('/health');
}

export async function getRooms(base) {
  return request('/rooms', { base });
}

export async function createRoom(name, base) {
  return request('/rooms', { method: 'POST', body: JSON.stringify({ name }), base });
}

export async function getMessages(roomId, base) {
  return request(`/rooms/${roomId}/messages`, { base });
}

export async function sendMessage(roomId, text, user, base) {
  return request(`/rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text, user }),
    base,
  });
}

// Login (POST /login { username })
export async function login(username, base) {
  return request('/login', { method: 'POST', body: JSON.stringify({ username }), base });
}

// WebSocket otvaranje za sobu
export function openRoomSocket(roomId, base) {
  const chosen = base || DEFAULT_BASE;
  const wsBase = chosen.replace(/^http/, 'ws');
  return new WebSocket(`${wsBase}/ws/rooms/${roomId}`);
}

export const api = { BACKENDS, DEFAULT_BASE, pickBackendByKey, health, getRooms, createRoom, getMessages, sendMessage, login, openRoomSocket };
