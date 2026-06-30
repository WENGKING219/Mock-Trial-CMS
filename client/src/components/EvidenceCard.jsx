import { useState } from 'react';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export default function EvidenceCard({ item, exhibitNumber, onView, onDelete, onRename }) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(item.name);

  const isImage = item.mimetype.startsWith('image/');
  const isVideo = item.mimetype.startsWith('video/');

  const commitRename = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== item.name) onRename(trimmed);
    else setNameInput(item.name);
    setEditingName(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') { setNameInput(item.name); setEditingName(false); }
  };

  return (
    <div className="evidence-card">
      <div className="card-thumb" onClick={onView}>
        {isImage && (
          <img src={`/uploads/${item.filename}`} alt={item.name} loading="lazy" />
        )}
        {isVideo && (
          <div className="thumb-video-placeholder">
            <div className="thumb-play-btn">▶</div>
            <div className="thumb-video-label">VIDEO</div>
          </div>
        )}
        {!isImage && !isVideo && (
          <div className="thumb-placeholder">📄</div>
        )}
        <div className="card-thumb-overlay">
          <span>View Evidence</span>
        </div>
        <span className={`type-badge ${isImage ? 'badge-img' : isVideo ? 'badge-vid' : 'badge-file'}`}>
          {isImage ? 'IMAGE' : isVideo ? 'VIDEO' : 'FILE'}
        </span>
      </div>

      <div className="card-info">
        <div className="exhibit-tag">Exhibit {exhibitNumber}</div>

        {editingName ? (
          <input
            className="name-edit-input"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            autoFocus
            maxLength={200}
          />
        ) : (
          <h3
            className="card-name"
            title={`${item.name}\n(Double-click to rename)`}
            onDoubleClick={() => setEditingName(true)}
          >
            {item.name}
          </h3>
        )}

        <div className="card-meta">
          <span>{formatSize(item.size)}</span>
          <span className="meta-dot">·</span>
          <span>{formatDate(item.uploaded_at)}</span>
        </div>
      </div>

      <div className="card-actions">
        <button className="btn-card-view" onClick={onView}>View</button>
        <button className="btn-card-rename" onClick={() => setEditingName(true)} title="Rename">✏</button>
        <button className="btn-card-delete" onClick={onDelete} title="Delete">🗑</button>
      </div>
    </div>
  );
}
