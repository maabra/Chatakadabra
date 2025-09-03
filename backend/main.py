from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List
import time

app = FastAPI(title="Chatakadabra API", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Room(BaseModel):
    id: int
    name: str


class MessageIn(BaseModel):
    text: str
    user: str


class MessageOut(BaseModel):
    id: int
    roomId: int
    text: str
    user: str
    timestamp: float


# Privremeni "DB"
rooms: List[Room] = [
    Room(id=1, name="General Chat"),
    Room(id=2, name="Test 1"),
    Room(id=3, name="Test 2"),
]
messages_by_room: Dict[int, List[MessageOut]] = {1: [], 2: [], 3: []}


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/rooms", response_model=List[Room])
def list_rooms():
    return rooms


@app.post("/rooms", response_model=Room)
def create_room(name: str):
    new = Room(id=int(time.time() * 1000), name=name)
    rooms.append(new)
    messages_by_room[new.id] = []
    return new


@app.get("/rooms/{room_id}/messages", response_model=List[MessageOut])
def get_messages(room_id: int):
    if room_id not in messages_by_room:
        raise HTTPException(status_code=404, detail="Room not found")
    return messages_by_room[room_id]


@app.post("/rooms/{room_id}/messages", response_model=MessageOut)
def send_message(room_id: int, payload: MessageIn):
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
    return msg
