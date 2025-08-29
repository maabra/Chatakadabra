import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import ChatList from './components/ChatList';
import ChatRoom from './components/ChatRoom';
import NetworkInspector from './components/NetworkInspector';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const servers = [
    { id: 'b-1', name: 'backend-1', role: 'api' },
    { id: 'b-2', name: 'backend-2', role: 'api' },
    { id: 'b-3', name: 'backend-3', role: 'api' }
  ];
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const pickServerIndex = (userId) => userId % servers.length;
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const initialRooms = [
    { id: 1, name: 'General Chat', users: 12 },
    { id: 2, name: 'Test 1', users: 8 },
    { id: 3, name: 'Test 2', users: 15 }
  ];
  const [rooms, setRooms] = useState(initialRooms);

  const seedMessages = (roomName) => {
    const now = Date.now();
    const byRoom = {
      'General Chat': 'Bob',
      'Test 2': 'Alice',
      'Test 1': 'Charlie'
    };
    const user = byRoom[roomName] || 'Alice';
    return [
      { id: now, type: 'text', user: 'message:', text: `Welcome to ${roomName}!`, timestamp: new Date(), isSystem: true },
      { id: now + 1, type: 'text', user, text: '1', timestamp: new Date() }
    ];
  };

  const buildInitialMessages = (rs) => rs.reduce((acc, r) => {
    acc[r.id] = seedMessages(r.name);
    return acc;
  }, {});

  const [messagesByRoom, setMessagesByRoom] = useState(buildInitialMessages(initialRooms));

  // Simple hash to pick a backend for a given username (simulated distribution)
  const hashString = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
  };
  const pickServerIndexForUsername = (username) => hashString(username) % servers.length;

  const handleLogin = (username) => {
    const id = Date.now();
    setCurrentUser({ username, id });
    setCurrentServerIndex(pickServerIndex(id));
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  };

  const handleAddRoom = (roomName) => {
    const newRoom = {
      id: Date.now(),
      name: roomName,
      users: 1
    };
    setRooms([...rooms, newRoom]);
  setMessagesByRoom((prev) => ({ ...prev, [newRoom.id]: [] }));
  };

  const handleSendMessage = (roomId, text, username) => {
    const idx = pickServerIndexForUsername(username);
    const msg = {
      id: Date.now(),
      type: 'text',
      user: username,
      text: text.trim(),
      timestamp: new Date(),
      isSystem: false,
      servedBy: servers[idx].name,
      serverIndex: idx
    };
    setMessagesByRoom((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), msg]
    }));
  };

  const spoofUsers = ['Alice','Bob','Charlie','Dana','Eve','Frank','Grace','Heidi'];
  const spoofTexts = ['Wow!','hi!','Nice','hello!','Hi','Hi!','Cool!','Test','ok','yo'];

  const handleSpam = (roomId, count = 10) => {
    const nowBase = Date.now();
    const burst = [];
    for (let i = 0; i < count; i++) {
      const user = spoofUsers[Math.floor(Math.random() * spoofUsers.length)];
      const text = spoofTexts[Math.floor(Math.random() * spoofTexts.length)];
      const idx = pickServerIndexForUsername(user);
      burst.push({
        id: nowBase + i,
        type: 'text',
        user,
        text,
        timestamp: new Date(),
        isSystem: false,
        servedBy: servers[idx].name,
        serverIndex: idx
      });
    }
    setMessagesByRoom((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), ...burst]
    }));
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <div className="title-bar">
        <div className="title-bar-text">🪄 Chatakadabra v1.1</div>
        <div className="title-bar-controls">
          <button className="title-bar-control" title="Network Inspector" onClick={() => setInspectorOpen(true)}>i</button>
          <button className="title-bar-control" onClick={() => setCurrentUser(null)}>
            ×
          </button>
        </div>
      </div>

      <div className="window-body">
        <div className="status-bar">
          <div className="status-field">User: {currentUser.username}</div>
          <div className="status-field">Connected to app</div>
          <div className="status-field">Rooms: {rooms.length}</div>
        </div>

        <div className="main-content">
          <div className="sidebar">
            <ChatList 
              rooms={rooms}
              onRoomSelect={handleRoomSelect}
              onAddRoom={handleAddRoom}
              selectedRoom={selectedRoom}
              serverInfo={{ current: servers[currentServerIndex], index: currentServerIndex, total: servers.length }}
            />
          </div>

          <div className="chat-area">
            {selectedRoom ? (
              <ChatRoom 
                room={selectedRoom}
                currentUser={currentUser}
                messages={messagesByRoom[selectedRoom.id] || []}
                onSend={handleSendMessage}
                onSpam={handleSpam}
              />
            ) : (
              <div className="welcome-panel">
                <div className="welcome-content">
                  <h2>Hello!</h2>
                  <p>Select chat on left side</p>
                  <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'center' }}>
                    <img
                      src={process.env.PUBLIC_URL + '/images/speechbubble.gif'}
                      alt="Cube spinning gif"
                      style={{ width: '96px', height: '96px', imageRendering: 'pixelated' }}
                    />
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
        <NetworkInspector
          servers={servers}
          currentServerIndex={currentServerIndex}
          messagesByRoom={messagesByRoom}
          selectedRoom={selectedRoom}
          onClose={() => setInspectorOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
