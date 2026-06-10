# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Hard rule: no git/GitHub activity

Claude is **strictly prohibited** from performing any git or GitHub actions in this repository. Do **not** run `git commit`, `git push`, `git branch`, `git merge`, `git reset`, `git checkout`, `git rebase`, `gh` commands, or open/modify PRs or issues — not even when it would normally be implied by a task. Read-only inspection is fine only if explicitly requested. The user owns all version-control operations.

## What this is

Field monitoring dashboard for sulfur-gas (SO₂/H₂S) sensor nodes. An ESP32 reads a field of sensors and streams CSV over USB serial; a FastAPI backend parses the serial stream, broadcasts it over WebSocket, and serves per-node XGBoost prediction models; a React/Vite frontend renders live cards, a Leaflet map of the nodes, and time-series charts.

```
ESP32 → USB Serial (CSV) → FastAPI (parse + broadcast) → WebSocket/REST → React dashboard
```

`backend/SYSTEM_DIAGRAM.md` has the full mermaid architecture, data-flow, and ML-pipeline diagrams — read it for the big picture. The README (`README.md`) is in Indonesian.

## Commands

### Backend (`backend/`)
```bash
python -m venv venv
venv\Scripts\activate            # Windows (source venv/bin/activate on Linux/macOS)
pip install -r requirements.txt
python main.py                   # runs uvicorn on http://127.0.0.1:8000 with --reload
```
There is no test suite or linter configured for the backend.

**Database (optional):** readings + predictions persist to PostgreSQL. It's optional — if the DB is unreachable the app still boots and just serves no persistence (`db_ready` stays False, CRUD calls no-op). Easiest setup is Docker:
```bash
docker compose up -d   # from backend/; Postgres on host port 5433 (avoids native PG on 5432)
cp .env.example .env   # optional; default DATABASE_URL already matches compose
```
Tables are auto-created at startup via `init_db()`.

**Seeding without hardware:** `scripts/seed_stream.py` POSTs synthetic readings to the dev-only `POST /api/ingest` so data flows through the exact same pipeline as the serial worker (WebSocket broadcast + DB persist). Backend must be running first:
```bash
python scripts/seed_stream.py                 # 10 readings/sec, forever (Ctrl+C to stop)
python scripts/seed_stream.py --rate 10 --duration 30 --nodes 1,2,3
```

### Frontend (`frontend/`)
```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run preview
```
No test runner is configured for the frontend.

## Critical setup: serial port

The serial port is **hardcoded** in `backend/app/api.py` and must be edited to match your OS/microcontroller before live mode works:
```python
SERIAL_PORT = "/dev/ttyACM0"  # Linux/ESP32C3; Windows is "COM3" etc. (check Device Manager)
BAUD_RATE = 115200
```
If the port can't be opened the backend still starts — it just logs the failure and serves no live data.

## Architecture notes

### Backend (FastAPI)
- `main.py` — app entry. The `lifespan` handler calls `load_all_models()` then `start_serial_worker()` at startup. All routes are mounted under the `/api` prefix; CORS is wide open (`allow_origins=["*"]`).
- `app/api.py` — REST + WebSocket. A **background daemon thread** (`serial_to_websocket_task`) reads serial lines, expects **exactly 7 comma-separated floats** (`so2,h2s,temp,humidity,wind_speed,bus_voltage,current_ma`), wraps them in a dict (adding hardcoded `lat`/`lng`/`wind_dir`/`timestamp`), and pushes to all WebSocket clients via `asyncio.run_coroutine_threadsafe(...)` onto the main event loop. `ConnectionManager` holds the client list. Lines that don't split into 7 parts are silently dropped.
- `app/ml_service.py` — loads `models/node_{1..6}_xgb.pkl` (pickled) into an in-memory registry at startup. **Node R has no model** and is excluded from all predictions. `build_features()` is the single source of truth for the model input contract: an **11-element vector** in fixed order — `[h2s, so2, hum, temp, windspeed, hour, minute, minute_of_day, h2s_diff, so2_diff, gas_ratio_so2_h2s]`. The last six are derived (time fields from `datetime.now()`, diffs from `*_prev` args, ratio = so2/h2s guarded against div-by-zero). Model output is `[h2s, so2]` predicted concentrations. Keep this order in sync between `ml_service.py`, the `/predict` endpoints, and any caller building raw vectors for `/predict/batch`.
- `app/serialMonitor.py` — standalone serial reader, not wired into the app.
- `app/config.py` / `app/database.py` / `app/models.py` / `app/crud.py` — persistence layer. `config.py` reads `DATABASE_URL` from env/`.env` (pydantic-settings). `database.py` builds the async SQLAlchemy engine and exposes `db_ready` + `init_db()`. `models.py` defines two tables: `sensor_readings` (`node_id` is TEXT so it holds `"r"` too) and `predictions` (`node_id` is INT — only nodes 1–6). `crud.py` write helpers are all guarded by `db_ready` and wrapped in try/except so a DB hiccup never crashes the serial loop or a request.
- **Single ingestion path:** `ingest_reading(data)` in `api.py` does `manager.broadcast(data)` + `crud.save_reading(data)`. Both the serial worker and the dev-only `POST /api/ingest` endpoint call it, so seeded data is indistinguishable from real hardware downstream.

Key REST endpoints (all under `/api`): `GET /status`, `GET /models/status`, `GET /predict/{node_id}` (query params), `POST /predict/all`, `POST /predict/batch`, `POST /ingest` (dev/seed), `GET /readings`; WebSocket at `/api/ws/sensors`.

### Frontend (React 19 + Vite 7)
- Components are **plain `.jsx`** (not TypeScript) despite `npm run build` running `tsc -b`; `components.json` has `"tsx": false`. The only TS file is `vite-env.d.ts`.
- Routing: `main.jsx` wraps in `BrowserRouter`; `DashboardLayout.jsx` defines routes (`/` overview, `/sensors`, `/history`, `/settings`) inside a shadcn `SidebarProvider`.
- **Live vs Dummy data**: `DashboardMainContent.jsx` has a `dataSource` toggle (`"dummy" | "live"`, defaults to `"dummy"`). Dummy mode regenerates random per-node data every 3s; live mode opens `ws://127.0.0.1:8000/api/ws/sensors`. The backend WebSocket URL is **hardcoded in the components**, separate from the REST base URL.
- REST calls go through `src/lib/api.js`, an axios instance with `baseURL: "http://127.0.0.1:8000/api"` (also hardcoded — there is no `.env`).
- **Sensor node list is duplicated**, not shared: `SENSOR_NODES` (id/label/lat/lng for nodes 1–6 and "r") is redefined inline in `DashboardMainContent.jsx`, `GpsDashboard.jsx`, `SensorsPage.jsx`, and `LogsPage.jsx`. Update all copies together when node coords change.
- UI: shadcn/ui ("new-york" style) in `src/components/ui/`, Tailwind v4 (config via `@tailwindcss/postcss`, no `tailwind.config`), Leaflet/react-leaflet for the map, Recharts for charts, lucide-react icons. Path alias `@` → `src/`.
- **Offline map tiles:** `GpsDashboard.jsx` renders `<TileLayer url="/tiles/{z}/{x}/{y}.jpg" />`, served from `public/tiles/` so the map works with zero network calls. Tiles are pre-fetched (Esri World Imagery, NOT OSM — OSM forbids bulk download) by `npm run tiles` (`scripts/download-tiles.mjs`), covering the Kawah Putih node grid at zoom 16–18 (~46 files, <1 MB — small by design). Keep `BBOX`/`MIN_Z`/`MAX_Z` in the script in sync with the grid constants in `GpsDashboard.jsx`.

### ML prediction flow
`LogsPage.jsx` is where predictions are triggered: it calls `GET /api/predict/{node_id}` with raw sensor values; the backend derives the remaining features and returns predicted H₂S/SO₂, which the page charts against a horizon.
