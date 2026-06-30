import { useState, useRef } from 'react';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadModal({ sessionId, sessionName, onUpload, onClose, nextExhibit }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const setSelectedFile = (f) => {
    setFile(f);
    setError('');
    if (!name) setName(f.name.replace(/\.[^/.]+$/, ''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setSelectedFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file to upload.'); return; }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name.trim() || file.name);
    formData.append('session_id', sessionId);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        onUpload(JSON.parse(xhr.responseText));
      } else {
        setError('Upload failed. Please try again.');
        setUploading(false);
      }
    };

    xhr.onerror = () => {
      setError('Connection error. Please check the server.');
      setUploading(false);
    };

    xhr.open('POST', '/api/evidence');
    xhr.send(formData);
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget && !uploading) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-icon">📁</span>
            <div>
              <h2>Upload Evidence</h2>
              <span>Exhibit {nextExhibit} → <strong>{sessionName}</strong></span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={uploading}>✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div
            className={`drop-zone ${dragging ? 'drop-active' : ''} ${file ? 'drop-filled' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              onChange={e => e.target.files[0] && setSelectedFile(e.target.files[0])}
              style={{ display: 'none' }}
            />
            {file ? (
              <div className="drop-file-info">
                <span className="drop-check">✓</span>
                <div>
                  <div className="drop-filename">{file.name}</div>
                  <div className="drop-filesize">{formatSize(file.size)}</div>
                </div>
                {!uploading && (
                  <button
                    type="button"
                    className="drop-clear"
                    onClick={e => { e.stopPropagation(); setFile(null); setName(''); }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <div className="drop-empty">
                <div className="drop-upload-icon">⬆</div>
                <p className="drop-main">Drag & drop a file here</p>
                <p className="drop-sub">or click to browse · Images & videos · Max 500 MB</p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Evidence Name</label>
            <input
              className="form-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`e.g. Exhibit ${nextExhibit} — Network capture screenshot`}
              maxLength={200}
              disabled={uploading}
            />
            <span className="form-hint">A descriptive name helps identify this exhibit in court.</span>
          </div>

          {error && <div className="upload-error">{error}</div>}

          {uploading && (
            <div className="progress-wrap">
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-label">Uploading… {progress}%</span>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading…' : 'Submit Evidence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
