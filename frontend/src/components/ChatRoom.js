import React, { useState, useEffect, useRef } from 'react';

const ChatRoom = ({ room, currentUser }) => {
  const [messages, setMessages] = useState([
    { id: 1, user: 'System', text: `Welcome to ${room.name}!`, timestamp: new Date(), isSystem: true },
    { id: 2, user: 'Alice', text: 'Hey everyone! 👋', timestamp: new Date(Date.now() - 120000) },
    { id: 3, user: 'Bob', text: 'What\'s up?', timestamp: new Date(Date.now() - 60000) },
    { id: 4, user: 'Charlie', text: 'Anyone know about the new updates?', timestamp: new Date(Date.now() - 30000) }
  ]);
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
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        user: currentUser.username,
        text: newMessage.trim(),
        timestamp: new Date(),
        isSystem: false
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
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
          <span>Connected</span>
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
                <span className="message-user">
                  {message.isSystem ? 'SYSTEM' : 'USER'} {message.user}
                </span>
                <span className="message-time">
                  {formatTime(message.timestamp)}
                </span>
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
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
