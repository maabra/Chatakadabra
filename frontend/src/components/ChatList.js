import React, { useState } from 'react';

const ChatList = ({ rooms, onRoomSelect, onAddRoom, selectedRoom, serverInfo }) => {
  const [newRoomName, setNewRoomName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      onAddRoom(newRoomName.trim());
      setNewRoomName('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="chat-list-panel">
      <div className="panel-header">
        <h3>Chat Rooms</h3>
        <button 
          className="add-room-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'CANCEL' : 'NEW'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-room-form">
          <form onSubmit={handleAddRoom}>
            <input
              type="text"
              placeholder="Room name..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              maxLength="40"
              autoFocus
            />
            <button type="submit">Add</button>
          </form>
        </div>
      )}

      <div className="rooms-list">
        {rooms.map(room => (
          <div
            key={room.id}
            className={`room-item ${selectedRoom?.id === room.id ? 'selected' : ''}`}
            onClick={() => onRoomSelect(room)}
          >
            <div className="room-name">{room.name}</div>
            <div className="room-users">{room.users} users</div>
          </div>
        ))}
      </div>

      <div className="panel-footer">
        <div className="room-count">{rooms.length} rooms available</div>
        {/* {serverInfo?.current && (
          <div className="server-info">
            Backend: {serverInfo.current.name} ({serverInfo.index + 1}/{serverInfo.total})
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ChatList;
