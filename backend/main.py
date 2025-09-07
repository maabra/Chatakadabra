from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Set
import asyncio
import time
import jwt

from models import Room, RoomCreate, MessageIn, MessageOut, LoginIn

app = FastAPI(title="Chatakadabra API", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Privremeni "DB"
rooms: List[Room] = [
    Room(id=1, name="General Chat"),
    Room(id=2, name="Test 1"),
    Room(id=3, name="Test 2"),
]
messages_by_room: Dict[int, List[MessageOut]] = {1: [], 2: [], 3: []}
room_subscribers: Dict[int, Set[WebSocket]] = {}
users: Dict[int, str] = {}
next_user_id: int = 1


@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/rooms", response_model=List[Room])
async def list_rooms():
    return rooms


@app.post("/rooms", response_model=Room)
async def create_room(payload: RoomCreate):
    new = Room(id=int(time.time() * 1000), name=payload.name)
    rooms.append(new)
    messages_by_room[new.id] = []
    return new


@app.get("/rooms/{room_id}/messages", response_model=List[MessageOut])
async def get_messages(room_id: int):
    if room_id not in messages_by_room:
        raise HTTPException(status_code=404, detail="Room not found")
    return messages_by_room[room_id]


async def _broadcast(room_id: int, msg: MessageOut):
    subs = room_subscribers.get(room_id)
    if not subs:
        return
    for ws in list(subs):
        await ws.send_json(msg.dict())


@app.post("/rooms/{room_id}/messages", response_model=MessageOut)
async def send_message(room_id: int, payload: MessageIn):
    if room_id not in messages_by_room:
        raise HTTPException(status_code=404, detail="Room not found")
    msg = MessageOut(
        id=int(time.time() * 1000),
        roomId=room_id,
        text=payload.text.strip(),
        user=payload.user,
        timestamp=time.time(),
    )
    messages_by_room[room_id].append(msg)
    await _broadcast(room_id, msg)
    return msg


SECRET = "dev-insecure-secret"  # placeholder


@app.post("/login")
async def login(payload: LoginIn):
    global next_user_id
    uid = next_user_id
    next_user_id += 1
    users[uid] = payload.username
    payload_data = {"sub": uid}
    # secret
    token = jwt.encode(payload_data, SECRET, algorithm='HS256')
    return {"id": uid, "username": payload.username, "token": token}


@app.websocket("/ws/rooms/{room_id}")
async def ws_room(websocket: WebSocket, room_id: int):
    await websocket.accept()
    subs = room_subscribers.setdefault(room_id, set())
    subs.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    finally:
        subs.discard(websocket)
