const BACKENDS = (process.env.REACT_APP_API_BACKENDS || process.env.REACT_APP_API_BASE || 'http://localhost:8001,http://localhost:8002,http://localhost:8003')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .filter((v, i, arr) => /^https?:\/\//i.test(v) && arr.indexOf(v) === i);

  //Hashiranje ključa da bi se dobio index backenda, maltene RNG
function pickBackendByKey(key) {
  if (!key || BACKENDS.length === 0) return BACKENDS[0] || 'http://localhost:8001';
  const h = Math.abs(String(key).split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
  const idx = h % BACKENDS.length;
  return BACKENDS[idx];
}
  //Wrapper
async function request(path, options = {}) {
  const base = options.base || BACKENDS[0] || 'http://localhost:8001';
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
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

export async function login(username, base) {
  return request('/login', { method: 'POST', body: JSON.stringify({ username }), base });
}

export const api = { BACKENDS, pickBackendByKey, getRooms, createRoom, getMessages, sendMessage, login };
