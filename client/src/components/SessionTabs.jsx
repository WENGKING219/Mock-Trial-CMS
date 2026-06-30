import { useState } from 'react';

export default function SessionTabs({ sessions, activeSession, onSwitch, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [nameInput, setNameInput] = useState('');

  const startEdit = (e, session) => {
    e.stopPropagation();
    setEditingId(session.id);
    setNameInput(session.name);
  };

  const commitEdit = () => {
    const trimmed = nameInput.trim();
    if (trimmed && editingId !== null) onRename(editingId, trimmed);
    setEditingId(null);
  };

  return (
    <div className="session-bar">
      <div className="session-bar-inner">
        <span className="session-bar-label">Court Session</span>
        <div className="session-tabs">
          {sessions.map((session, idx) => {
            const isActive = activeSession === session.id;
            const isEditing = editingId === session.id;
            return (
              <div
                key={session.id}
                className={`session-tab ${isActive ? 'session-tab-active' : ''}`}
                onClick={() => !isEditing && onSwitch(session.id)}
                title={isActive ? '' : `Switch to ${session.name}`}
              >
                <span className="session-tab-index">{idx + 1}</span>

                {isEditing ? (
                  <input
                    className="session-name-input"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                    maxLength={40}
                  />
                ) : (
                  <span
                    className="session-tab-name"
                    onDoubleClick={e => startEdit(e, session)}
                    title="Double-click to rename"
                  >
                    {session.name}
                  </span>
                )}

                <span className="session-tab-count">
                  {session.evidence_count ?? 0}
                  <span className="session-tab-count-label"> exhibit{session.evidence_count !== 1 ? 's' : ''}</span>
                </span>

                {!isEditing && (
                  <button
                    className="session-tab-rename-btn"
                    onClick={e => startEdit(e, session)}
                    title="Rename session"
                  >
                    ✏
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
