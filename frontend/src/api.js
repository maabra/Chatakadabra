const BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
export async function health() {
  return request('/health');
}

export async function getRooms() {
  return request('/rooms');
}

export async function createRoom(name) {
  return request(`/rooms?name=${encodeURIComponent(name)}`, { method: 'POST' });
}

export async function getMessages(roomId) {
  return request(`/rooms/${roomId}/messages`);
}

export async function sendMessage(roomId, text, user) {
  return request(`/rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text, user }),
  });
}

export const api = { BASE_URL, health, getRooms, createRoom, getMessages, sendMessage };
