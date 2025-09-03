// import React from 'react';

const NetworkInspector = ({ servers, currentServerIndex, messagesByRoom, selectedRoom, onClose }) => {
  const roomId = selectedRoom?.id;
  const msgs = roomId ? (messagesByRoom[roomId] || []) : [];
  const perBackend = servers.map((_, idx) => 0);
  msgs.forEach(m => {
    if (typeof m.serverIndex === 'number' && perBackend[m.serverIndex] !== undefined) {
      perBackend[m.serverIndex] += 1;
    }
  });
  const last = msgs.slice(-10).reverse();
// Komentar za change za Source Control 
  return (
    <div className="overlay-backdrop">
      <div className="overlay-window">
        <div className="title-bar" style={{ marginBottom: 4 }}>
          <div className="title-bar-text">Network Inspector</div>
          <div className="title-bar-controls">
            <button className="title-bar-control" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="inspector-body">
          <div className="inspector-section">
            <strong>Current backend:</strong>
            <div>
              {servers[currentServerIndex]?.name} ({currentServerIndex + 1}/{servers.length})
            </div>
          </div>

          <div className="inspector-section">
            <strong>Cluster nodes:</strong>
            <ul>
              {servers.map((s, i) => (
                <li key={s.id}>
                  {s.name} {i === currentServerIndex ? '(attached)' : ''}
                </li>
              ))}
            </ul>
          </div>

          <div className="inspector-section">
            <strong>Per-backend messages in this room:</strong>
            <ul>
              {servers.map((s, i) => (
                <li key={s.id}>{s.name}: {perBackend[i] || 0}</li>
              ))}
            </ul>
          </div>

          <div className="inspector-section">
            <strong>Last 10 messages:</strong>
            <div className="inspector-list">
              {last.length === 0 && <div>(no messages)</div>}
              {last.map(m => (
                <div key={m.id} className="inspector-item">
                  <div><strong>{m.user}</strong>: {m.text}</div>
                  <div className="inspector-meta">{m.servedBy ? m.servedBy : 'local'} · {new Date(m.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkInspector;
