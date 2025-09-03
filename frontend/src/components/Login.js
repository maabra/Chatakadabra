import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="login-container">
      <div className="login-window">
        <div className="title-bar">
          <div className="title-bar-text">Chatakadabra</div>
        </div>
        
        <div className="window-body login-body">
          <div className="login-header">
            <h2>Login to app</h2>
            <p></p>
            <p>Enter username below</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field-row">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Type name here..."
                maxLength="20"
                autoFocus
              />
            </div>

            <div className="field-row">
              <button type="submit" disabled={!username.trim()}>
                Enter
              </button>
            </div>
          </form>

          <div className="login-footer">
            <p>Splash text!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
