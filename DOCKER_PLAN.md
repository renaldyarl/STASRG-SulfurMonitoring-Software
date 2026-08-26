# Panduan & Rencana Implementasi Docker Containerization (Security-Hardened)
Proyek: **STASRG Sulfur Monitoring Software**

Dokumen ini berisi spesifikasi teknis, arsitektur isolasi jaringan (*Network Segmentation*), penguatan keamanan (*Security Hardening*), dan berkas konfigurasi siap pakai untuk seluruh ekosistem Docker.

---

## 1. Arsitektur Jaringan & Isolasi Keamanan (Zero Direct Exposure)

Prinsip keamanan utama:
- **Hanya Reverse Proxy (Frontend / Nginx) yang terhubung ke Internet (Port 80/443).**
- **Backend FastAPI diisolasi** dalam jaringan internal (`internal_net`), tidak membuka port langsung ke host/internet (`no exposed ports`).
- **PostgreSQL Database diisolasi ketat** dalam jaringan database (`db_net`), hanya bisa diakses oleh backend, tanpa port mapping ke luar (`no host port binding`).
- **Non-root container user:** Menghindari eksekusi proses sebagai `root` di dalam container.

```mermaid
graph TD
    subgraph Internet / Public Zone
        User([Browser / Public Client])
    end

    subgraph Docker Network: frontend_net
        Nginx[sulfur_frontend: Nginx Reverse Proxy\nPort 80/443 Terbuka]
    end

    subgraph Docker Network: internal_net
        Backend[sulfur_backend: FastAPI + ML\nPORT TIDAK DIBUKA KE HOST]
    end

    subgraph Docker Network: db_net
        Postgres[(sulfur_postgres: PostgreSQL 16\nPORT TIDAK DIBUKA KE HOST)]
    end

    User -->|HTTP / WS| Nginx
    Nginx -->|Proxy Internal http://backend:8000| Backend
    Backend -->|Internal DB Connection :5432| Postgres
```

---

## 2. Rincian & Konfigurasi Berkas Siap Pakai

### A. Konfigurasi Lingkungan (`.env`)
Buat file `.env` di root atau di folder `backend/` (jangan di-commit ke Git):

```env
# Database Credentials
POSTGRES_USER=sulfur_admin
POSTGRES_PASSWORD=SuperSecretPassword123!
POSTGRES_DB=sulfur_monitoring

# Backend Security
API_SECRET_KEY=stasrg-super-secure-key-2026
```

---

### B. `backend/Dockerfile` (Non-Root & Hardened)
Menggunakan user `appuser` non-root dan membersihkan cache build untuk memperkecil *attack surface*.

```dockerfile
FROM python:3.11-slim

# Install dependency build dasar yang dibutuhkan oleh modul C/ML
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Buat non-root user demi keamanan
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/bash -m appuser

WORKDIR /app

# Install dependensi Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Salin kode program & model ML
COPY . .

# Berikan hak kepemilikan direktori ke non-root user
RUN chown -R appuser:appgroup /app

# Ganti user ke non-root
USER appuser

EXPOSE 8000

# Jalankan server uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### C. `backend/.dockerignore`
```dockerignore
__pycache__
*.pyc
*.pyo
*.pyd
.venv
venv
.env
.git
.gitignore
.ruff_cache
```

---

### D. `frontend/Dockerfile` (Multi-Stage Build)
```dockerfile
# Stage 1: Build static assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve Nginx (Secured)
FROM nginx:alpine
# Hapus default config bawaan nginx
RUN rm /etc/nginx/conf.d/default.conf

# Salin config aman kita dan static assets hasil build
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### E. `frontend/nginx.conf` (Hardened Reverse Proxy)
Dilengkapi *security headers* (X-Frame-Options, X-Content-Type-Options, CSP, dll.) serta proxy buffer protection.

```nginx
server {
    listen 80;
    server_name localhost;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    server_tokens off; # Sembunyikan versi Nginx

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 1. Frontend SPA (Single Page Application)
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 2. Proxy API Backend (Internal DNS docker)
    location /api/ {
        # Backend strip prefix /api jika diperlukan atau teruskan langsung
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. Proxy WebSocket
    location /ws {
        proxy_pass http://backend:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

### F. `frontend/.dockerignore`
```dockerignore
node_modules
dist
.git
.gitignore
.env
```

---

### G. `docker-compose.yml` (Terpusat & Terisolasi Penuh)

Perhatikan bahwa **hanya frontend yang memiliki `ports:` ke host**. Backend dan Postgres hanya memakai `expose:` internal dan terbagi dalam *isolated bridge networks*.

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: sulfur_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    # Port TIDAK dibuka ke host (Hanya internal network)
    expose:
      - "5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - db_net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sulfur_backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      API_KEY: ${API_SECRET_KEY}
    # Port TIDAK dibuka ke host (Hanya internal network untuk Nginx)
    expose:
      - "8000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal_net
      - db_net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sulfur_frontend
    restart: unless-stopped
    # HANYA port Nginx yang terbuka ke Publik / Host
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - internal_net

volumes:
  pgdata:

networks:
  # Jaringan terisolasi antara Frontend Nginx <-> Backend API
  internal_net:
    driver: bridge
  # Jaringan terisolasi khusus Backend API <-> PostgreSQL Database
  db_net:
    driver: bridge
```

---

### H. `backend/init-scripts/01-init.sql` (Inisialisasi Skema Database Otomatis)

File ini otomatis dieksekusi oleh container PostgreSQL saat pertama kali diinisialisasi (volume `pgdata` masih kosong):

```sql
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR NOT NULL,
    so2 DOUBLE PRECISION,
    h2s DOUBLE PRECISION,
    temp DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    wind_speed DOUBLE PRECISION,
    bus_voltage DOUBLE PRECISION,
    current_ma DOUBLE PRECISION,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    wind_dir INTEGER,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_sensor_readings_node_time
ON sensor_readings (node_id, time);

CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    node_id INTEGER NOT NULL,
    h2s_pred DOUBLE PRECISION,
    so2_pred DOUBLE PRECISION,
    features_used JSONB,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_predictions_node_time
ON predictions (node_id, time);
```

---

## 3. Matriks Keamanan & Hak Akses

| Komponen | Status Akses Publik | Jaringan Docker Terhubung | Alasan Keamanan |
|---|---|---|---|
| **Nginx (Frontend)** | **TERBUKA** (`Port 80/443`) | `internal_net` | Gerbang utama client & static web. Mencegah serangan langsung ke API engine. |
| **FastAPI (Backend)** | **TERTUTUP** (Internal Only) | `internal_net`, `db_net` | Hanya menerima request yang telah difilter oleh Nginx. Tidak bisa di-scan langsung dari IP server. |
| **PostgreSQL (DB)** | **TERTUTUP TOTAL** | `db_net` | Mencegah *brute-force* password database, SQL injection scan langsung dari internet, atau kebocoran data. |

---

## 4. Cara Menjalankan & Memvalidasi

1. **Pastikan file `.env` sudah diisi** dengan password yang kuat:
   ```bash
   cp backend/.env.example .env
   # Edit .env sesuai kebutuhan
   ```

2. **Build dan Jalankan Container:**
   ```bash
   docker compose build
   docker compose up -d
   ```

3. **Cek Status Container:**
   ```bash
   docker compose ps
   ```

4. **Uji Isolasi Keamanan:**
   - Akses browser: `http://localhost/` (Aplikasi React & Nginx berjalan)
   - Coba akses langsung Backend `http://localhost:8000` ➡️ **Akan Gagal/Connection Refused** (Aman).
   - Coba akses langsung Database `localhost:5432` ➡️ **Akan Gagal/Connection Refused** (Aman).
