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
  return request('/rooms', { method: 'POST', body: JSON.stringify({ name }) });
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

// Login (POST /login { username })
export async function login(username) {
  return request('/login', { method: 'POST', body: JSON.stringify({ username }) });
}

// WebSocket otvaranje za sobu
export function openRoomSocket(roomId) {
  const wsBase = BASE_URL.replace(/^http/, 'ws');
  return new WebSocket(`${wsBase}/ws/rooms/${roomId}`);
}

export const api = { BASE_URL, health, getRooms, createRoom, getMessages, sendMessage, login, openRoomSocket };
