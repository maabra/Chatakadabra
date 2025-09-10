import React, { useState, useEffect, useRef } from 'react';

const ChatRoom = ({ room, currentUser, messages, onSend, onSpam }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSend(room.id, newMessage, currentUser.username);
    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('hr-HR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-room-panel">
      <div className="chat-header">
        <h3>{room.name}</h3>
        <div className="room-info">
          <span>{room.users} users online</span>
          <span>Connected to room</span>
        </div>
      </div>

      <div className="messages-container">
        <div className="messages-list">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.isSystem ? 'system-message' : ''} ${message.user === currentUser.username ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <span className="message-user">{message.isSystem ? 'SYSTEM' : 'USER'} {message.user}</span>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
              <div className="message-text">{message.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            placeholder="Type message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            maxLength="500"
            className="message-input"
          />
          <button type="submit" disabled={!newMessage.trim()}>
            Send
          </button>
          {onSpam && (
            <button type="button" onClick={() => onSpam(room.id, 10)}>
              Spam 10 RND
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
