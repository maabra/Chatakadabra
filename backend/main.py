from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Set
import asyncio
import time
import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from boto3.dynamodb.conditions import Key
from decimal import Decimal

from models import Room, RoomCreate, MessageIn, MessageOut, LoginIn

app = FastAPI(title="Chatakadabra API", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache (ako je empty pri startu, DynamoDB ne funkcionira)
rooms: List[Room] = []
messages_by_room: Dict[int, List[MessageOut]] = {}
users: Dict[int, str] = {}
next_user_id: int = 1

# DynamoDB postavke
DYNAMO_ENDPOINT = os.getenv("DYNAMO_ENDPOINT")  # http://dynamodb-local:8000
DYNAMO_REGION = os.getenv("AWS_REGION", "us-east-1")
session = boto3.session.Session()
dynamodb = session.resource("dynamodb", endpoint_url=DYNAMO_ENDPOINT, region_name=DYNAMO_REGION)

ROOMS_TABLE = "chat_rooms"
MESSAGES_TABLE = "chat_messages"

# DynamoDB implementacija
def ensure_tables():
    client = dynamodb.meta.client
    try:
        existing = client.list_tables().get('TableNames', [])
    except NoCredentialsError:
        existing = []
    try:
        if ROOMS_TABLE not in existing:
            client.create_table(
                TableName=ROOMS_TABLE,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "N"}],
                BillingMode='PAY_PER_REQUEST'
            )
        if MESSAGES_TABLE not in existing:
            client.create_table(
                TableName=MESSAGES_TABLE,
                KeySchema=[{"AttributeName": "roomId", "KeyType": "HASH"}, {"AttributeName": "id", "KeyType": "RANGE"}],
                AttributeDefinitions=[
                    {"AttributeName": "roomId", "AttributeType": "N"},
                    {"AttributeName": "id", "AttributeType": "N"},
                ],
                BillingMode='PAY_PER_REQUEST'
            )
    except ClientError:
        pass

def seed_rooms_if_empty():
    table = dynamodb.Table(ROOMS_TABLE)
    resp = table.scan(Limit=1)
    if resp.get('Count', 0) == 0:
        base = [
            Room(id=1, name="General Chat"),
            Room(id=2, name="Test 1"),
            Room(id=3, name="Test 2"),
        ]
        with table.batch_writer() as bw:
            for r in base:
                bw.put_item(Item={"id": r.id, "name": r.name})

def load_rooms_cache():
    table = dynamodb.Table(ROOMS_TABLE)
    scan = table.scan()
    rs: List[Room] = []
    for item in scan.get('Items', []):
        rs.append(Room(id=int(item['id']), name=item['name']))
    rooms.clear()
    rooms.extend(rs)
    for r in rooms:
        messages_by_room.setdefault(r.id, [])

ensure_tables()
seed_rooms_if_empty()
load_rooms_cache()


@app.get("/rooms", response_model=List[Room])
async def list_rooms():
    return rooms

@app.post("/rooms", response_model=Room)
async def create_room(payload: RoomCreate):
    new = Room(id=int(time.time() * 1000), name=payload.name)
    # Persist
    dynamodb.Table(ROOMS_TABLE).put_item(Item={"id": new.id, "name": new.name})
    rooms.append(new)
    messages_by_room[new.id] = []
    return new

@app.get("/rooms/{room_id}/messages", response_model=List[MessageOut])
async def get_messages(room_id: int):
    messages_by_room.setdefault(room_id, [])
    if not messages_by_room[room_id]:
        table = dynamodb.Table(MESSAGES_TABLE)
        resp = table.query(KeyConditionExpression=Key('roomId').eq(room_id))
        loaded: List[MessageOut] = []
        for it in resp.get('Items', []):
            loaded.append(MessageOut(
                id=int(it['id']),
                roomId=room_id,
                text=it['text'],
                user=it['user'],
                timestamp=float(it['timestamp'])
            ))
        messages_by_room[room_id].extend(loaded)
    return messages_by_room[room_id]

@app.post("/rooms/{room_id}/messages", response_model=MessageOut)
async def send_message(room_id: int, payload: MessageIn):
    messages_by_room.setdefault(room_id, [])
    # Standardizacija oepet
    text = (payload.text or "").strip() or "..."
    user = payload.user or "Anon"
    msg = MessageOut(
        id=int(time.time() * 1000),
        roomId=room_id,
        text=text,
        user=user,
        timestamp=time.time(),
    )
    messages_by_room[room_id].append(msg)
    dynamodb.Table(MESSAGES_TABLE).put_item(Item={
        "roomId": msg.roomId,
        "id": msg.id,
        "text": msg.text,
        "user": msg.user,
    "timestamp": Decimal(str(msg.timestamp)),
    })
    return msg

@app.post("/login")
async def login(payload: LoginIn):
    global next_user_id
    uid = next_user_id
    next_user_id += 1
    users[uid] = payload.username
    return {"id": uid, "username": payload.username}

