import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import Login from './components/Login.js';
import ChatList from './components/ChatList';
import ChatRoom from './components/ChatRoom';
import { api } from './api';

// frontend: npm start
// backend: uvicorn main:app --reload --host 0.0.0.0 --port 8000
// docker compose up --build

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messagesByRoom, setMessagesByRoom] = useState({});
  //const [apiReady, setApiReady] = useState(false);
  const seenIdsRef = useRef(new Map());
  const markSeen = (roomId, id) => {
    const key = typeof roomId === 'string' ? parseInt(roomId, 10) : roomId;
    let set = seenIdsRef.current.get(key);
    if (!set) {
      set = new Set();
      seenIdsRef.current.set(key, set);
    }
    const exists = set.has(id);
    if (!exists) set.add(id);
    return !exists;
  };

  // Standardizacija poruke
  const normalizeFromApi = (m) => {
    const ts = typeof m.timestamp === 'number' ? new Date(m.timestamp * 1000) : new Date(m.timestamp);
    return { ...m, timestamp: ts };
  };

  // Loading
  useEffect(() => {
    let mounted = true;
  (async () => {
      try {
  const base = api.BACKENDS[0] || 'http://localhost:8001';
  const serverRooms = await api.getRooms(base);
        if (!mounted) return;
        // setApiReady(true);
        setRooms(serverRooms.map(r => ({ id: r.id, name: r.name, users: 0 })));
      } catch (e) {
        if (!mounted) return;
        // setApiReady(false);
        setRooms([]);
        setMessagesByRoom({});
      }
  })();
    return () => { mounted = false; };
  }, []);

  // Login
  const handleLogin = async (username) => {
    const base = api.pickBackendByKey(username.trim());
    const userResp = await api.login(username.trim(), base);
    setCurrentUser({ id: userResp.id, username: userResp.username });
  };

  // Odabir room-a
  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  (async () => {
      try {
  const base = api.pickBackendByKey(room.id);
  const msgs = await api.getMessages(room.id, base);
        console.debug('[room fetch]', room.id, msgs);
        const normalized = msgs.map(normalizeFromApi);
        normalized.forEach(m => markSeen(room.id, m.id));
        setMessagesByRoom(prev => ({ ...prev, [room.id]: normalized }));
      } catch (e) {
        console.error('Failed to load messages for room', room.id, e);
        setMessagesByRoom(prev => ({ ...prev, [room.id]: [] }));
      }
  })();
  };

  // Dodavanje room-a
  const handleAddRoom = (roomName) => {
  (async () => {
      try {
        const base = api.pickBackendByKey(roomName);
        const created = await api.createRoom(roomName, base);
        setRooms(prev => [...prev, { id: created.id, name: created.name, users: 0 }]);
        setMessagesByRoom(prev => ({ ...prev, [created.id]: [] }));
      } catch {
      }
  })();
  };

  // Slanje poruke
  const handleSendMessage = (roomId, text, username) => {
  (async () => {
      try {
        const base = api.pickBackendByKey(roomId);
        const created = await api.sendMessage(roomId, text, username, base);
        const normalized = normalizeFromApi(created);
        if (markSeen(roomId, normalized.id)) {
          setMessagesByRoom(prev => {
            const list = prev[roomId] || [];
            if (list.some(m => m.id === normalized.id)) return prev;
            return { ...prev, [roomId]: [...list, normalized] };
          });
        }
      } catch {
      }
  })();
  };

  // Spam generator
  const spoofUsers = ['Alice','Bob','Marko','Danijela','Eve','Frank','Petra','Heidi'];
  const spoofTexts = ['Wow!','hi!','Nice','hello!','Hi','Hi!','Cool!','Test','ok','yo'];
  function handleSpam(roomId, count = 10) {
  (async () => {
      const ops = [];
      for (let i = 0; i < count; i++) {
        const user = spoofUsers[Math.floor(Math.random() * spoofUsers.length)];
        const text = spoofTexts[Math.floor(Math.random() * spoofUsers.length) % spoofTexts.length];
        const base = api.pickBackendByKey(roomId);
        ops.push(api.sendMessage(roomId, text, user, base));
      }
      try {
        const results = await Promise.all(ops);
        const appended = [];
        results.forEach(msg => {
          const norm = normalizeFromApi(msg);
            if (markSeen(roomId, norm.id)) appended.push(norm);
        });
        if (appended.length) {
          setMessagesByRoom(prev => {
            const list = prev[roomId] || [];
            const existingIds = new Set(list.map(m => m.id));
            const merged = [...list, ...appended.filter(m => !existingIds.has(m.id))];
            return { ...prev, [roomId]: merged };
          });
        }
      } catch (e) {
      }
  })();
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // GLAVNI UI: naslovna traka, status traka, sidebar s listom soba, prostor za chat
  return (
    <div className="app-container">
      <div className="title-bar">
        <div className="title-bar-text">🪄 Chatakadabra v1.10</div>
        <div className="title-bar-controls">
          <button className="title-bar-control" onClick={() => setCurrentUser(null)}>×</button>
        </div>
      </div>
      <div className="window-body">
        <div className="status-bar">
          <div className="status-field">User: {currentUser.username}</div>
          {/*<div className="status-field">Connected: {apiReady ? 'API' : 'API DOWN'}</div>*/}
          <div className="status-field">Rooms: {rooms.length}</div>
        </div>
        <div className="main-content">
          <div className="sidebar">
            <ChatList rooms={rooms} onRoomSelect={handleRoomSelect} onAddRoom={handleAddRoom} selectedRoom={selectedRoom} />
          </div>
          <div className="chat-area">
            {selectedRoom ? (
              <ChatRoom room={selectedRoom} currentUser={currentUser} messages={messagesByRoom[selectedRoom.id] || []} onSend={handleSendMessage} onSpam={handleSpam} />
            ) : (
              <div className="welcome-panel">
                <div className="welcome-content">
                  <h2>Hello!</h2>
                  <p>Select chat on left side</p>
                  <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'center' }}>
                    <img src={process.env.PUBLIC_URL + '/images/speechbubble.gif'} alt="Speech bubble gif" style={{ width: '96px', height: '96px', imageRendering: 'pixelated' }} />
                  </div>
                  <div className="info-box">
                    <p>RS project, wow!</p>
                    <p>Cool chats!</p>
                    <p>Fancy UI!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;