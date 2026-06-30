import { useState, useEffect } from 'react';
import Gallery from './components/Gallery';
import Viewer from './components/Viewer';
import UploadModal from './components/UploadModal';
import SessionTabs from './components/SessionTabs';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(1);
  const [evidence, setEvidence] = useState([]);
  const [viewerItem, setViewerItem] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    const res = await fetch('/api/sessions');
    setSessions(await res.json());
  };

  const fetchEvidence = async (sessionId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/evidence?session=${sessionId}`);
      setEvidence(await res.json());
    } finally {
      setLoading(false);
    }
  };

  // Load sessions once on mount
  useEffect(() => { fetchSessions(); }, []);

  // Reload evidence whenever session changes; close viewer to avoid stale item
  useEffect(() => {
    setViewerItem(null);
    fetchEvidence(activeSession);
  }, [activeSession]);

  const handleSwitchSession = (id) => {
    if (id !== activeSession) setActiveSession(id);
  };

  const handleRenameSession = async (id, name) => {
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) setSessions(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleUpload = (newItem) => {
    setEvidence(prev => [...prev, newItem]);
    setSessions(prev => prev.map(s =>
      s.id === activeSession ? { ...s, evidence_count: (s.evidence_count ?? 0) + 1 } : s
    ));
    setShowUpload(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently remove this evidence item?')) return;
    await fetch(`/api/evidence/${id}`, { method: 'DELETE' });
    setEvidence(prev => prev.filter(e => e.id !== id));
    setSessions(prev => prev.map(s =>
      s.id === activeSession ? { ...s, evidence_count: Math.max(0, (s.evidence_count ?? 1) - 1) } : s
    ));
    if (viewerItem?.id === id) setViewerItem(null);
  };

  const handleRename = async (id, name) => {
    const res = await fetch(`/api/evidence/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      setEvidence(prev => prev.map(e => e.id === id ? { ...e, name } : e));
      if (viewerItem?.id === id) setViewerItem(prev => ({ ...prev, name }));
    }
  };

  const activeSessionObj = sessions.find(s => s.id === activeSession);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-gavel">⚖</div>
            <div className="header-titles">
              <h1>CyberCourt</h1>
              <span>Digital Evidence Repository</span>
            </div>
          </div>
          <div className="header-right">
            <div className="exhibit-count">
              <span className="count-num">{evidence.length}</span>
              <span className="count-label">Exhibit{evidence.length !== 1 ? 's' : ''}</span>
            </div>
            <button className="btn-upload" onClick={() => setShowUpload(true)}>
              <span className="btn-upload-icon">+</span>
              Upload Evidence
            </button>
          </div>
        </div>
      </header>

      <SessionTabs
        sessions={sessions}
        activeSession={activeSession}
        onSwitch={handleSwitchSession}
        onRename={handleRenameSession}
      />

      <main className="main-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading evidence…</p>
          </div>
        ) : (
          <Gallery
            evidence={evidence}
            sessionName={activeSessionObj?.name ?? ''}
            onView={setViewerItem}
            onDelete={handleDelete}
            onRename={handleRename}
          />
        )}
      </main>

      {viewerItem && (
        <Viewer
          item={viewerItem}
          items={evidence}
          onClose={() => setViewerItem(null)}
          onDelete={handleDelete}
          onRename={handleRename}
          onNavigate={setViewerItem}
        />
      )}

      {showUpload && (
        <UploadModal
          sessionId={activeSession}
          sessionName={activeSessionObj?.name ?? ''}
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
          nextExhibit={evidence.length + 1}
        />
      )}
    </div>
  );
}
