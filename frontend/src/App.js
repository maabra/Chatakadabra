import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import ChatList from './components/ChatList';
import ChatRoom from './components/ChatRoom';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([
    { id: 1, name: 'General Chat', users: 12 },
    { id: 2, name: 'Test 1', users: 8 },
    { id: 3, name: 'Test 2', users: 15 }
  ]);

  const handleLogin = (username) => {
    setCurrentUser({ username, id: Date.now() });
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
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <div className="title-bar">
        <div className="title-bar-text">🪄 Chatakadabra v1.0</div>
        <div className="title-bar-controls">
          <button className="title-bar-control" onClick={() => setCurrentUser(null)}>
            ×
          </button>
        </div>
      </div>

      <div className="window-body">
        <div className="status-bar">
          <div className="status-field">User: {currentUser.username}</div>
          <div className="status-field">Connected</div>
          <div className="status-field">Rooms: {rooms.length}</div>
        </div>

        <div className="main-content">
          <div className="sidebar">
            <ChatList 
              rooms={rooms}
              onRoomSelect={handleRoomSelect}
              onAddRoom={handleAddRoom}
              selectedRoom={selectedRoom}
            />
          </div>

          <div className="chat-area">
            {selectedRoom ? (
              <ChatRoom 
                room={selectedRoom}
                currentUser={currentUser}
              />
            ) : (
              <div className="welcome-panel">
                <div className="welcome-content">
                  <h2>TITLE</h2>
                  <p>Select chat</p>
                  <div className="info-box">
                    <h3>Features:</h3>
                    <ul>
                      <li>TEMP TXT 1</li>
                      <li>TEMP TXT 2</li>
                      <li>TEMP TXT 3</li>
                    </ul>
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
