# ⚖ CyberCourt — Digital Evidence System

A self-hosted web application for managing and presenting digital evidence during mock cybercourt trials.  
Supports images and videos with zoom/pan inspection, fullscreen mode, per-session evidence separation, and drag-and-drop uploads — all running in a single Docker container.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Option A — Docker (Recommended)](#option-a--docker-recommended)
- [Option B — Local Development](#option-b--local-development)
- [Usage Guide](#usage-guide)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Two court sessions** — Session 1 and Session 2, each with their own isolated evidence gallery; rename sessions by double-clicking their tab
- **Upload evidence** — Drag-and-drop or click to upload; give each file a custom exhibit name; supports images and video files up to 500 MB
- **Evidence gallery** — Grid view with exhibit numbers, file size, and upload date; double-click any name to rename inline
- **Full-screen viewer** — Click any exhibit to open a full-screen viewer
  - **Images**: scroll-wheel zoom, drag to pan, double-click to zoom in, zoom in/out/reset buttons
  - **Videos**: full HTML5 player with playback controls
  - Navigate between exhibits with arrow keys or on-screen buttons
- **Delete evidence** — Remove individual items with confirmation
- **Persistent storage** — SQLite database + uploaded files survive container restarts via Docker volume mounts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, `react-zoom-pan-pinch` |
| Backend | Node.js, Express |
| Database | SQLite (`better-sqlite3`) |
| File uploads | Multer |
| Container | Docker + Docker Compose |

---

## Prerequisites

### For Docker setup (recommended)

| Requirement | Minimum version | Download |
|-------------|----------------|---------|
| Docker Desktop | 24.x or later | https://www.docker.com/products/docker-desktop |
| Docker Compose | v2.x (bundled with Docker Desktop) | Included with Docker Desktop |

> **Verify your installation:**
> ```bash
> docker --version        # Docker version 24.x.x or higher
> docker compose version  # Docker Compose version v2.x.x or higher
> ```

### For local development setup

| Requirement | Minimum version | Download |
|-------------|----------------|---------|
| Node.js | 18.x LTS or later (20.x recommended) | https://nodejs.org |
| npm | 9.x or later (bundled with Node.js) | Bundled with Node.js |

> **Verify your installation:**
> ```bash
> node --version   # v18.x.x or higher
> npm --version    # 9.x.x or higher
> ```

---

## Option A — Docker (Recommended)

This is the easiest way to run CyberCourt. Everything — the server, database, and frontend — runs in one container.

### Step 1 — Clone or download the project

```bash
git clone <your-repo-url> mocktrial
cd mocktrial
```

Or if you downloaded a ZIP, extract it and open a terminal inside the `mocktrial` folder.

### Step 2 — Build and start the container

```bash
docker compose up --build
```

> This command will:
> 1. Pull the `node:20-alpine` base image (~50 MB, first run only)
> 2. Install backend npm dependencies
> 3. Install frontend npm dependencies
> 4. Build the React app (compiled into static files)
> 5. Start the Express server on port 3000
>
> **First build takes about 60–90 seconds.** Subsequent builds are much faster thanks to Docker layer caching.

### Step 3 — Open the app

```
http://localhost:3000
```

### Running in the background

```bash
docker compose up --build -d      # -d = detached (background) mode
docker compose logs -f            # stream server logs
docker compose stop               # pause the container
docker compose start              # resume the container
docker compose down               # stop and remove the container (data is safe)
```

### Rebuilding after code changes

```bash
docker compose up --build -d
```

### Data persistence

All data is stored **outside** the container via volume mounts in the project folder:

```
mocktrial/
├── data/
│   └── evidence.db     ← SQLite database (evidence names, sessions, metadata)
└── uploads/
    └── *.png / *.mp4   ← Uploaded evidence files
```

These folders are created automatically on first run. Deleting the container (`docker compose down`) does **not** delete your evidence — only manually removing these folders does.

---

## Option B — Local Development

Use this if you want live hot-reload while editing code.

### Step 1 — Install backend dependencies

In the project root (`mocktrial/`):

```bash
npm install
```

This installs:
- `express` — web server
- `better-sqlite3` — SQLite database
- `multer` — file upload handling
- `uuid` — unique ID generation

### Step 2 — Install frontend dependencies

```bash
cd client
npm install
```

This installs:
- `react` + `react-dom` — UI framework
- `react-zoom-pan-pinch` — image zoom and pan
- `vite` + `@vitejs/plugin-react` — build tool and dev server

### Step 3 — Start the backend server

Open **Terminal 1** in the project root:

```bash
npm start
```

You should see:
```
CyberCourt running on http://localhost:3000
```

> To auto-restart on file changes, install nodemon and use:
> ```bash
> npm install -g nodemon
> nodemon server.js
> ```

### Step 4 — Start the frontend dev server

Open **Terminal 2** inside the `client/` folder:

```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### Step 5 — Open the app

```
http://localhost:5173
```

> The frontend dev server (port 5173) automatically proxies `/api` and `/uploads` requests to the backend (port 3000) — configured in `client/vite.config.js`.

### Building for production (local)

To build the React app and serve everything from Express on port 3000:

```bash
cd client
npm run build
cd ..
npm start
```

Then open `http://localhost:3000`.

---

## Usage Guide

### Uploading Evidence

1. Click **+ Upload Evidence** in the top-right corner
2. Drag and drop a file onto the upload zone, or click to browse
3. Enter a descriptive name for the exhibit (e.g. `Exhibit 1 — Network Screenshot`)
4. Click **Submit Evidence**
5. The exhibit appears in the gallery instantly

**Supported file types:** Images (JPG, PNG, GIF, WEBP, SVG, BMP) and Videos (MP4, WEBM, MOV, AVI, MKV)  
**Maximum file size:** 500 MB

### Switching Sessions

Two court sessions are provided by default. Evidence uploaded in one session is completely invisible in the other.

- Click **Session 1** or **Session 2** in the session bar to switch
- The upload modal always shows which session you are currently uploading to
- **Rename a session:** hover over the session tab and click the ✏ pencil icon, or double-click the session name

### Viewing Evidence

- Click the **View** button on any card, or click the thumbnail directly
- The viewer opens full-screen
- **Images:** use the `+` / `−` buttons or scroll wheel to zoom; drag to pan; double-click to zoom in further
- **Videos:** use the built-in video controls to play, pause, seek, and adjust volume
- **Fullscreen mode:** click the **Fullscreen** button in the top-right of the viewer (or press `F`)

### Renaming Evidence

- **In the gallery:** double-click the exhibit name on any card, or click the ✏ button
- **In the viewer:** double-click the exhibit title at the top, or click **✏ Rename**
- Press `Enter` to save, `Escape` to cancel

### Deleting Evidence

- Click the 🗑 button on a card, or the **🗑 Delete** button inside the viewer
- A confirmation prompt appears before permanent deletion
- The file is removed from both the database and disk

---

## Keyboard Shortcuts

These shortcuts are active while the evidence viewer is open:

| Key | Action |
|-----|--------|
| `F` | Toggle fullscreen mode |
| `Esc` | Exit fullscreen (if in fullscreen), or close viewer |
| `←` | Previous exhibit |
| `→` | Next exhibit |

---

## Project Structure

```
mocktrial/
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Container + volume config
├── .dockerignore
├── package.json                # Backend dependencies
├── server.js                   # Express server, REST API, SQLite
│
├── client/                     # React frontend
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.js          # Vite + dev proxy config
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx             # Root component, state management
│       ├── App.css             # Global styles + dark court theme
│       └── components/
│           ├── SessionTabs.jsx # Court session selector
│           ├── Gallery.jsx     # Evidence grid
│           ├── EvidenceCard.jsx# Individual card with rename/delete
│           ├── Viewer.jsx      # Full-screen image/video viewer
│           └── UploadModal.jsx # Drag-and-drop upload form
│
├── data/                       # Created automatically
│   └── evidence.db             # SQLite database
└── uploads/                    # Created automatically
    └── (uploaded files)
```

---

## API Reference

All endpoints return JSON.

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions` | List all sessions with evidence counts |
| `PUT` | `/api/sessions/:id` | Rename a session — body: `{ "name": "string" }` |

### Evidence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/evidence?session=1` | List all evidence for a session (ordered by upload date) |
| `POST` | `/api/evidence` | Upload evidence — `multipart/form-data`: `file`, `name`, `session_id` |
| `PUT` | `/api/evidence/:id` | Rename evidence — body: `{ "name": "string" }` |
| `DELETE` | `/api/evidence/:id` | Delete evidence (removes file from disk and DB) |

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/uploads/:filename` | Serve an uploaded file |

---

## Troubleshooting

### Port 3000 is already in use

```bash
# Find what is using port 3000
netstat -ano | findstr :3000        # Windows
lsof -i :3000                       # macOS / Linux

# Change the port in docker-compose.yml:
ports:
  - "3001:3000"    # host:container — now open at localhost:3001
```

### Docker build fails on `better-sqlite3`

`better-sqlite3` is a native module and compiles during `npm install`. This is handled inside the Docker image (Alpine Linux + Node 20). If building locally on Windows and you get a build error:

```bash
npm install --global windows-build-tools   # run as Administrator
npm install
```

Or use the Docker path instead — it avoids native compilation issues entirely.

### Uploaded files are missing after restarting the container

Ensure the `./uploads` and `./data` folders exist in the project root. Docker Compose mounts them as volumes. If you ran the container with `docker run` instead of `docker compose up`, the volumes may not have been mounted — always use `docker compose`.

### Database resets on every restart

Same cause as above — the `./data` volume mount is missing. Use `docker compose up` and verify:

```bash
docker inspect cybercourt-evidence | findstr -i "mounts" -A 10
```

### Video won't play in the viewer

Ensure the video format is supported by your browser:
- **Recommended:** MP4 (H.264) or WEBM — supported by all modern browsers
- **AVI / MOV / MKV:** may require browser codec support; convert to MP4 if playback fails

### `npm run dev` frontend can't reach the backend

Check that the backend is running on port 3000 and that `client/vite.config.js` has the proxy configured:

```js
server: {
  proxy: {
    '/api': 'http://localhost:3000',
    '/uploads': 'http://localhost:3000'
  }
}
```

---

## License

This project is for educational and mock trial use only.
