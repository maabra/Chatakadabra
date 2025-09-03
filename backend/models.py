from pydantic import BaseModel

# Komentar za change za Source Control
class Room(BaseModel):
    id: int
    name: str


class RoomCreate(BaseModel):
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


class LoginIn(BaseModel):
    username: str


class LoginOut(BaseModel):
    id: int
    username: str
