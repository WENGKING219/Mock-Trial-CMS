import EvidenceCard from './EvidenceCard';

export default function Gallery({ evidence, sessionName, onView, onDelete, onRename }) {
  if (evidence.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-gavel">⚖</div>
        <h2>No Evidence on Record</h2>
        <p>No exhibits have been uploaded for <strong>{sessionName}</strong> yet.</p>
        <p className="empty-hint">Supports images and video files up to 500 MB.</p>
      </div>
    );
  }

  return (
    <div className="gallery-wrap">
      <div className="gallery-toolbar">
        <h2 className="gallery-title">{sessionName} — Evidence Gallery</h2>
        <span className="gallery-count">{evidence.length} item{evidence.length !== 1 ? 's' : ''} on record</span>
      </div>
      <div className="gallery-grid">
        {evidence.map((item, index) => (
          <EvidenceCard
            key={item.id}
            item={item}
            exhibitNumber={index + 1}
            onView={() => onView(item)}
            onDelete={() => onDelete(item.id)}
            onRename={(name) => onRename(item.id, name)}
          />
        ))}
      </div>
    </div>
  );
}
