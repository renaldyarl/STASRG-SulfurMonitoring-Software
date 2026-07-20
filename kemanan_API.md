# Update Keamanan Backend API (API Key)

Dokumen ini berisi catatan mengenai pembaruan keamanan yang diterapkan pada backend STASRG Sulfur Monitoring.

## 🔒 Masalah Keamanan Sebelumnya
Sebelum pembaruan ini, seluruh jalur (endpoint) di backend terbuka bebas untuk publik. Hal ini memungkinkan siapa saja (tanpa izin) untuk mengirimkan data palsu menggunakan form *Diagnostic Simulator* atau melalui akses langsung ke API `/ingest`.
Jika data palsu yang ekstrem disuntikkan (misal SO₂: 9999), hal itu akan memicu *false alarm* (kepanikan palsu) di web publik dan mengotori database riwayat udara.

## 🛡️ Solusi yang Diterapkan
Telah ditambahkan sistem pengamanan berbasis **API Key Header** menggunakan fitur `Depends` dan `Security` bawaan dari FastAPI.

### 1. Backend (`app/api.py`)
- Endpoint khusus untuk **menulis data** (POST `/ingest`) sekarang dikunci dan mewajibkan adanya *header* `X-API-Key`.
- Endpoint publik untuk **membaca data** (seperti GET `/readings` atau `/ws/sensors`) tetap dibiarkan bebas, sehingga pengunjung web umum tetap bisa melihat data udara tanpa hambatan.
- Jika ada oknum luar yang mencoba mengirim data ke `/ingest` tanpa melampirkan kunci yang sah, server akan otomatis memblokir dan merespons dengan **403 Forbidden** (`Not authenticated`).

### 2. Frontend Simulator
- Komponen web yang memiliki fungsi simulator (`SimulatorContext.jsx` dan `SettingsPage.jsx`) telah diperbarui.
- Saat Anda menekan tombol "Start Simulator" atau "Kirim Manual", web akan otomatis menyisipkan kode rahasia (`stasrg-admin-123`) di latar belakang agar data Anda diterima oleh server.

## 🚀 Catatan untuk Tahap Produksi (Deployment)
Saat ini, kunci API ditulis langsung ke dalam kode (`stasrg-admin-123`) untuk kemudahan pengujian.
Saat web ini di-*online*-kan ke server (VPS/Cloud), sangat disarankan untuk:
1. Memasukkan kunci asli yang rumit ke dalam file variabel lingkungan (`.env`).
2. Backend akan memanggilnya menggunakan `os.getenv("API_KEY")`.
3. Frontend akan memanggilnya menggunakan `process.env.VITE_API_KEY` (jika menggunakan Vite).
