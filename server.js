const express = require('express');
const multer = require('multer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'evidence.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS evidence (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    filename    TEXT    NOT NULL,
    mimetype    TEXT    NOT NULL,
    size        INTEGER NOT NULL,
    uploaded_at TEXT    NOT NULL
  );
`);

// Seed two default sessions once
if (db.prepare('SELECT COUNT(*) as c FROM sessions').get().c === 0) {
  db.prepare("INSERT INTO sessions VALUES (1, 'Session 1')").run();
  db.prepare("INSERT INTO sessions VALUES (2, 'Session 2')").run();
}

// Safe migration: add session_id to evidence if not present
try {
  db.exec('ALTER TABLE evidence ADD COLUMN session_id INTEGER NOT NULL DEFAULT 1');
} catch (_) { /* column already exists — nothing to do */ }

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'client/dist')));

/* ── Sessions ──────────────────────────────────────────────── */

app.get('/api/sessions', (req, res) => {
  const rows = db.prepare(`
    SELECT s.id, s.name, COUNT(e.id) AS evidence_count
    FROM sessions s
    LEFT JOIN evidence e ON e.session_id = s.id
    GROUP BY s.id
    ORDER BY s.id
  `).all();
  res.json(rows);
});

app.put('/api/sessions/:id', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  const result = db.prepare('UPDATE sessions SET name = ? WHERE id = ?')
    .run(name.trim(), parseInt(req.params.id));
  if (result.changes === 0) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true });
});

/* ── Evidence ──────────────────────────────────────────────── */

app.get('/api/evidence', (req, res) => {
  const sessionId = parseInt(req.query.session) || 1;
  const items = db.prepare(
    'SELECT * FROM evidence WHERE session_id = ? ORDER BY uploaded_at ASC'
  ).all(sessionId);
  res.json(items);
});

app.post('/api/evidence', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  const id        = uuidv4();
  const name      = (req.body.name || '').trim() || req.file.originalname;
  const sessionId = parseInt(req.body.session_id) || 1;
  const now       = new Date().toISOString();

  db.prepare(`
    INSERT INTO evidence (id, name, filename, mimetype, size, uploaded_at, session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, req.file.filename, req.file.mimetype, req.file.size, now, sessionId);

  res.json({
    id, name, filename: req.file.filename,
    mimetype: req.file.mimetype, size: req.file.size,
    uploaded_at: now, session_id: sessionId
  });
});

app.put('/api/evidence/:id', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const result = db.prepare('UPDATE evidence SET name = ? WHERE id = ?')
    .run(name.trim(), req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

app.delete('/api/evidence/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  fs.unlink(path.join(UPLOADS_DIR, item.filename), () => {});
  db.prepare('DELETE FROM evidence WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('*', (req, res) => {
  const idx = path.join(__dirname, 'client/dist/index.html');
  fs.existsSync(idx)
    ? res.sendFile(idx)
    : res.status(503).send('Frontend not built. Run: cd client && npm run build');
});

app.listen(PORT, () => console.log(`CyberCourt running on http://localhost:${PORT}`));
