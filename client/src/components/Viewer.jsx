import { useState, useEffect, useCallback, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Viewer({ item, items, onClose, onDelete, onRename }) {
  const [current, setCurrent] = useState(item);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(item.name);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef(null);

  const index = items.findIndex(i => i.id === current.id);
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;
  const isImage = current.mimetype.startsWith('image/');
  const isVideo = current.mimetype.startsWith('video/');

  // Sync fullscreen state with browser
  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  // Exit fullscreen when viewer unmounts
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) document.exitFullscreen();
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const goTo = useCallback((dir) => {
    const next = items[index + dir];
    if (!next) return;
    setCurrent(next);
    setNameInput(next.name);
    setEditingName(false);
  }, [index, items]);

  useEffect(() => {
    const onKey = (e) => {
      if (editingName) return;
      if (e.key === 'Escape') {
        // When in fullscreen the browser exits it; let it handle Esc natively.
        // Only close the viewer when already out of fullscreen.
        if (!document.fullscreenElement) onClose();
        return;
      }
      if (e.key === 'ArrowLeft') goTo(-1);
      if (e.key === 'ArrowRight') goTo(1);
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, onClose, editingName, toggleFullscreen]);

  const commitRename = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== current.name) {
      onRename(current.id, trimmed);
      setCurrent(prev => ({ ...prev, name: trimmed }));
    } else {
      setNameInput(current.name);
    }
    setEditingName(false);
  };

  const handleDelete = () => {
    onDelete(current.id);
  };

  const handleClose = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    onClose();
  };

  return (
    <div
      ref={viewerRef}
      className="viewer-overlay"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="viewer">
        <div className="viewer-header">
          <div className="viewer-header-left">
            <span className="viewer-exhibit-badge">Exhibit {index + 1}</span>
            {editingName ? (
              <input
                className="viewer-name-input"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') { setNameInput(current.name); setEditingName(false); }
                }}
                autoFocus
                maxLength={200}
              />
            ) : (
              <h2
                className="viewer-title"
                onDoubleClick={() => setEditingName(true)}
                title="Double-click to rename"
              >
                {current.name}
              </h2>
            )}
          </div>
          <div className="viewer-header-right">
            <button
              className={`viewer-btn viewer-btn-fullscreen ${isFullscreen ? 'active' : ''}`}
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                  </svg>
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                  Fullscreen
                </>
              )}
            </button>
            <button className="viewer-btn viewer-btn-rename" onClick={() => setEditingName(true)} title="Rename evidence">
              ✏ Rename
            </button>
            <button className="viewer-btn viewer-btn-delete" onClick={handleDelete} title="Delete evidence">
              🗑 Delete
            </button>
            <button className="viewer-btn viewer-btn-close" onClick={handleClose} title="Close (Esc)">
              ✕
            </button>
          </div>
        </div>

        <div className="viewer-stage">
          {hasPrev && (
            <button className="nav-arrow nav-prev" onClick={() => goTo(-1)} title="Previous (←)">
              ‹
            </button>
          )}

          <div className="viewer-content">
            {isImage && (
              <TransformWrapper
                key={current.id}
                initialScale={1}
                minScale={0.05}
                maxScale={30}
                wheel={{ step: 0.08 }}
                doubleClick={{ mode: 'zoomIn', step: 2 }}
                centerOnInit
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <div className="image-viewer-wrap">
                    <div className="zoom-controls">
                      <button onClick={() => zoomIn(0.5)} title="Zoom In">
                        <span>+</span>
                      </button>
                      <button onClick={() => zoomOut(0.5)} title="Zoom Out">
                        <span>−</span>
                      </button>
                      <button onClick={() => resetTransform()} title="Reset View">
                        <span>⟲</span>
                      </button>
                      <span className="zoom-hint">Scroll to zoom · Drag to pan · Double-click to zoom in</span>
                    </div>
                    <TransformComponent
                      wrapperClass="transform-wrapper"
                      contentClass="transform-content"
                    >
                      <img
                        src={`/uploads/${current.filename}`}
                        alt={current.name}
                        draggable={false}
                      />
                    </TransformComponent>
                  </div>
                )}
              </TransformWrapper>
            )}

            {isVideo && (
              <div className="video-viewer-wrap">
                <video
                  key={current.id}
                  src={`/uploads/${current.filename}`}
                  controls
                  autoPlay
                  className="video-player"
                />
              </div>
            )}

            {!isImage && !isVideo && (
              <div className="unsupported-viewer">
                <div className="unsupported-icon">📄</div>
                <p>Preview not available for this file type.</p>
                <a
                  href={`/uploads/${current.filename}`}
                  download={current.name}
                  className="btn-download"
                >
                  Download File
                </a>
              </div>
            )}
          </div>

          {hasNext && (
            <button className="nav-arrow nav-next" onClick={() => goTo(1)} title="Next (→)">
              ›
            </button>
          )}
        </div>

        <div className="viewer-footer">
          <span className="viewer-file-info">
            {current.mimetype} · {formatSize(current.size)}
          </span>
          <span className="viewer-footer-keys">
            {!isFullscreen && <span>F — Fullscreen</span>}
            <span>← → Navigate</span>
            <span>Esc — {isFullscreen ? 'Exit Fullscreen' : 'Close'}</span>
          </span>
          <span className="viewer-counter">
            {index + 1} / {items.length}
          </span>
        </div>
      </div>
    </div>
  );
}
