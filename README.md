# Field Monitoring with Realtime Map Dashboard

## Cara Kerja

```
ESP32 -> USB SERIAL -> Python backend -> HTTP REST API dan WEBSOCKET -> Frontend
```

ESP32 family mengirimkan char melalui USB Serial yang kemudian akan dibaca oleh script python. Script python sekaligus menjadi API yang menyediakan data sensor. Data sensor dikirimkan melalui koneksi HTTP RESTFUL dan WEBSOCKET yang akan dibaca oleh Aplikasi berbasis WEB secara Lokal. 

---

### Tech Stack
#### Backend
Teknologi yang digunakan:
- FastAPI -> MiddleCORS atau pembuat API 
- pyserial -> menerima data USB serial dari ESP32
#### Frontend
- Vite: build tools untuk frontend
- React: framework
- TailwindCSS V4
- Shadcn-ui: UI components seperti `button`, `sidebar`

---

## Persiapan Sebelum Development
Windows / Linux anda sudah terinstall:
- Node JS dan NPM. Dianjurkan versi LTS. Link: https://nodejs.org/en/download
- Python. Link: https://www.python.org/downloads/
- Git. Link: https://git-scm.com/install/windows

Istilah yang perlu anda ketahui:
- Terminal folder navigation
- Perbedaan React Framework vs HTML CSS Javascript
- Vite.js dan UI components untuk React
- Python Virtual environment
- HTTPs Restful dan Websocket 
- `npm` dan `pip` packages
- USB Serial Monitor dan cara kerjanya
- Library: pyserial, FastAPI
- penggunaan `.gitignore` supaya repositori tidak bengkak

---

# Development

## Clone Repository 
Clone repository ini dan navigasi ke foldernya.
```
git clone https://github.com/bokumentation/STASRG-SulfurMonitoring-Software.git
cd STASRG-SulfurMonitoring-Software
```

Berikut struktur folder dan penjelasannya.
```txt
📁backend   -> tempat backend 
📁frontend  -> tempat frontend
📁src       -> hiraukan saja, ini untuk README repo
.gitignore  -> konfigurasi gitignore 
README.md
```


## Setup Backend
Teknologi yang digunakan:
- FastAPI -> MiddleCORS atau pembuat API 
- pyserial -> menerima data USB serial dari ESP32

#### Setup
1. Navigasi ke folder `backend`.
    ```bash
    cd backend
    ```
2. Buat Python Virtual Environment dan aktifkan (sesuaikan OS anda).
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```
3. Install `requirements.txt` menggunakan `pip`.
    ```bash
    pip install -r requirements.txt
    ```

#### Konfigurasi USB Serial (WAJIB)
Note: Gunakan sesuai jenis OS dan Mikrokontroler yang digunakan. Saya menggunakan Debian(linux), silahkan disesuaikan dengan OS anda. Contoh: Di Windows seharusnya COM X, bisa dicek di `Device Manager`

Lokasi kode ada di `app/api.py`
```python
# --- UBAH SERIAL PORT SESUSAI OS DAN MICROCONTROLLER ---
SERIAL_PORT = "/dev/ttyACM0"  # ESP32C3
# SERIAL_PORT = "/dev/ttyUSB0" # HELTEC ESP32S3
BAUD_RATE = 115200
```

#### Jalankan Backend
Jalankan backend Python
```bash
python main.py
```

Contoh output jika berhasil membaca serial monitor.

```
(venv) ➜  backend git:(main) ✗ python main.py
INFO:     Will watch for changes in these directories: ['/home/loq/git/STASRG-SulfurMonitoring-Software/backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [145115] using WatchFiles
INFO:     Started server process [145128]
INFO:     Waiting for application startup.
--- APP STARTUP ---
INFO:     Application startup complete.
--- SUCCESS: Serial Port Opened on /dev/ttyACM0 ---
```
---

## Setup Database (Opsional tapi Dianjurkan)
Backend menyimpan setiap pembacaan sensor dan hasil prediksi ke PostgreSQL.
**Database bersifat opsional**: kalau DB tidak bisa diakses, backend tetap jalan,
hanya saja tanpa penyimpanan (lihat log `--- App will run without persistence ---`).

Cara paling gampang adalah pakai Docker.

1. Dari folder `backend`, jalankan Postgres lewat Docker Compose.
    ```bash
    docker compose up -d
    ```
    Postgres dipetakan ke **host port 5433** (bukan 5432) supaya tidak bentrok
    dengan instalasi PostgreSQL native yang biasanya sudah memakai 5432.

2. (Opsional) Buat file `.env` di folder `backend` kalau mau mengubah koneksi
    default. Salin dari contoh:
    ```bash
    cp .env.example .env
    ```
    Isi default sudah cocok dengan Docker Compose di atas:
    ```
    DATABASE_URL=postgresql+asyncpg://sulfur:sulfur@localhost:5433/sulfur_monitoring
    ```

3. Jalankan backend (`python main.py`). Tabel dibuat otomatis saat startup.
    Kalau berhasil akan muncul:
    ```
    --- SUCCESS: Database connected and tables ready ---
    ```

---

## Mode Development Tanpa Hardware (Seeding)
Kalau ESP32 belum terpasang tapi mau menguji dashboard, peta, dan grafik, kamu
bisa **menyuntik data sensor sintetis** lewat seeder. Seeder mem-POST ke endpoint
dev `POST /api/ingest`, jadi datanya mengalir lewat pipeline yang sama persis
seperti data hardware asli (broadcast WebSocket + simpan ke DB).

Syarat: **backend harus sudah jalan** (`python main.py`) di terminal lain.

Dari folder `backend`:
```bash
# 10 pembacaan/detik, terus-menerus (Ctrl+C untuk berhenti)
python scripts/seed_stream.py

# atur laju & durasi
python scripts/seed_stream.py --rate 10 --duration 30

# pilih node tertentu saja
python scripts/seed_stream.py --nodes 1,2,3

# arahkan ke URL backend lain
python scripts/seed_stream.py --url http://127.0.0.1:8000/api/ingest
```
Opsi:
- `--rate` — jumlah pembacaan per detik (total, dibagi rata antar node). Default `10`.
- `--duration` — lama jalan dalam detik. `0` (default) = jalan terus.
- `--nodes` — daftar id node dipisah koma. Default semua node (`1..6` dan `r`).
- `--url` — endpoint ingest backend. Default `http://127.0.0.1:8000/api/ingest`.

Nilai tiap field (so2, h2s, suhu, dst.) bergerak random-walk biar terlihat
realistis. Buka dashboard di `http://localhost:5173/` dan ganti sumber data ke
**Live** untuk melihat datanya masuk.

---

## Setup Frontend

#### Setup
Setelah kita setup backend, langkah selanjutnya adalah menjalankan frontend. Berikut langkah2nya.

1. Navigasi ke folder `frontend`.
    ```bash
    cd frontend
    ```
2. Install package menggunakan `npm`.
    ```bash
    npm install
    ```
3. Jalankan menggunakan perintah `run dev`.
    ```bash
    npm run dev
    ```
4. Aplikasi akan jalan di `http://localhost:5173/`.
    Contoh output:
    ```
    ➜  frontend git:(main) ✗ npm run dev

    > frontend@0.0.0 dev
    > vite

    VITE v7.3.0  ready in 159 ms

    ➜  Local:   http://localhost:5173/
    ➜  Network: use --host to expose
    ➜  press h + enter to show help

    ```

Sekarang, masuk ke browser. ketikan `http://localhost:5173/`. Seharusnya langsung masuk ke halaman dashboard.

![alt text](src/img/image.png)

#### Peta Offline (Tiles)
Peta Leaflet di dashboard memakai **tile satelit yang sudah diunduh** ke
`frontend/public/tiles/{z}/{x}/{y}.jpg`, jadi peta tetap muncul **tanpa koneksi
internet**. Tile yang ada hanya menutup area node sensor (Kawah Putih) di zoom
16–18 — jumlahnya sedikit (puluhan file, <1 MB), jadi itu normal, bukan bengkak.

Tile sudah ikut di-bundle. Kamu **hanya perlu** menjalankan perintah ini kalau
folder `tiles/` kosong atau mau memperbarui area cakupan (butuh internet, cukup
sekali jalan):
```bash
cd frontend
npm run tiles
```
Untuk mengubah area atau rentang zoom, edit `BBOX` / `MIN_Z` / `MAX_Z` di
`frontend/scripts/download-tiles.mjs` (jaga tetap sinkron dengan grid di
`src/components/GpsDashboard.jsx`).

Happy coding!