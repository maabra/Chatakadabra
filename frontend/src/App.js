import React, { useEffect, useState } from 'react';
import './App.css';
import Login from './components/Login.js';
import ChatList from './components/ChatList';
import ChatRoom from './components/ChatRoom';
import NetworkInspector from './components/NetworkInspector';
import { api } from './api';

// frontend: npm start
// backend: uvicorn main:app --reload --host 0.0.0.0 --port 8000

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomSocket, setRoomSocket] = useState(null);
  const [jwtToken, setJwtToken] = useState(null);

  const servers = [
    { id: 'b-1', name: 'backend-1', role: 'api' },
    { id: 'b-2', name: 'backend-2', role: 'api' },
    { id: 'b-3', name: 'backend-3', role: 'api' }
  ];
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const pickServerIndex = (userId) => userId % servers.length;
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // const initialRooms = [
  //   { id: 1, name: 'General Chat', users: 12 },
  //   { id: 2, name: 'Test 1', users: 8 },
  //   { id: 3, name: 'Test 2', users: 15 }
  // ];
  // const [rooms, setRooms] = useState(initialRooms);
  // const seedMessages = (roomName) => {
  //   const now = Date.now();
  //   const byRoom = { 'General Chat': 'Bob', 'Test 2': 'Alice', 'Test 1': 'Charlie' };
  //   const user = byRoom[roomName] || 'Alice';
  //   return [
  //     { id: now, type: 'text', user: 'message:', text: `Welcome to ${roomName}!`, timestamp: new Date(), isSystem: true },
  //     { id: now + 1, type: 'text', user, text: '1', timestamp: new Date() }
  //   ];
  // };
  // const buildInitialMessages = (rs) => rs.reduce((acc, r) => { acc[r.id] = seedMessages(r.name); return acc; }, {});
  // const [messagesByRoom, setMessagesByRoom] = useState(buildInitialMessages(initialRooms));

  const [rooms, setRooms] = useState([]);
  const [messagesByRoom, setMessagesByRoom] = useState({});
  const [apiReady, setApiReady] = useState(false);

  // Hashiranje - test
  const hashString = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i); return Math.abs(h); };
  const pickServerIndexForUsername = (username) => hashString(username) % servers.length;

  // Standardizacija poruke
  const normalizeFromApi = (m) => {
    const idx = pickServerIndexForUsername(m.user || 'unknown');
    const ts = typeof m.timestamp === 'number' ? new Date(m.timestamp * 1000) : new Date(m.timestamp);
    return { ...m, timestamp: ts, servedBy: servers[idx].name, serverIndex: idx };
  };

  // Loading
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
      await api.health();
      if (!mounted) return;
      setApiReady(true);
      const serverRooms = await api.getRooms();
      if (!mounted) return;
      setRooms(serverRooms.map(r => ({ id: r.id, name: r.name, users: 0 })));
      } catch (e) {
        if (!mounted) return;
        setApiReady(false);
        setRooms([]);
        setMessagesByRoom({});
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Prijava JWT
  const handleLogin = async (username) => {
    const userResp = await api.login(username.trim());
    setCurrentUser({ id: userResp.id, username: userResp.username });
    setCurrentServerIndex(pickServerIndex(userResp.id));
    // Spremi JWT
    setJwtToken(userResp.token);
  };

  // Odabir room-a
  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    if (roomSocket) {
      try { roomSocket.close(); } catch {}
      setRoomSocket(null);
    }
    (async () => {
      const msgs = await api.getMessages(room.id);
      const normalized = msgs.map(normalizeFromApi);
      setMessagesByRoom(prev => ({ ...prev, [room.id]: normalized }));
      const ws = api.openRoomSocket(room.id);
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          const normalized = normalizeFromApi(data);
          setMessagesByRoom(prev => ({
            ...prev,
            [room.id]: [...(prev[room.id] || []), normalized]
          }));
        } catch {
        }
      };
      ws.onclose = () => {
      };
      setRoomSocket(ws);
    })();
  };

  useEffect(() => {
    return () => {
      if (roomSocket) {
        try { roomSocket.close(); } catch {}
      }
    };
  }, [roomSocket]);

// Dodavanje room-a
  const handleAddRoom = (roomName) => {
    (async () => {
      try {
      const created = await api.createRoom(roomName);
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
      const saved = await api.sendMessage(roomId, text, username);
      const normalized = normalizeFromApi(saved);
      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), normalized]
      }));
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
        ops.push(api.sendMessage(roomId, text, user));
      }
      const results = await Promise.all(ops);
    })();
  }

  // Login komponenta, ponekad izbacuje error - još testirati
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // GLAVNI UI: naslovna traka, status traka, sidebar s listom soba, prostor za chat
  return (
    <div className="app-container">
      <div className="title-bar">
        <div className="title-bar-text">🪄 Chatakadabra v1.4</div>
        <div className="title-bar-controls">
          <button className="title-bar-control" title="Network Inspector" onClick={() => setInspectorOpen(true)}>i</button>
          <button className="title-bar-control" onClick={() => setCurrentUser(null)}>×</button>
        </div>
      </div>
      <div className="window-body">
        <div className="status-bar">
          <div className="status-field">User: {currentUser.username}</div>
          <div className="status-field">Connected: {apiReady ? 'API' : 'API DOWN'}</div>
          <div className="status-field">Rooms: {rooms.length}</div>
          {jwtToken && <div className="status-field">JWT: {jwtToken.slice(0, 16)}...</div>}
        </div>
        <div className="main-content">
          <div className="sidebar">
            <ChatList rooms={rooms} onRoomSelect={handleRoomSelect} onAddRoom={handleAddRoom} selectedRoom={selectedRoom} serverInfo={{ current: servers[currentServerIndex], index: currentServerIndex, total: servers.length }} />
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
                    <img src={process.env.PUBLIC_URL + '/images/speechbubble.gif'} alt="Cube spinning gif" style={{ width: '96px', height: '96px', imageRendering: 'pixelated' }} />
                  </div>
                  <div className="info-box">
                    <p>RS project, wow!</p>
                    <p>Cool texts!</p>
                    <p>Fancy UI!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {inspectorOpen && (
        <NetworkInspector servers={servers} currentServerIndex={currentServerIndex} messagesByRoom={messagesByRoom} selectedRoom={selectedRoom} onClose={() => setInspectorOpen(false)} />
      )}
    </div>
  );
}

export default App;