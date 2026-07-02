# Update: Diagnostic Simulator & Real-time Sensor Ingestion

Dokumen ini berisi rangkuman fitur baru yang ditambahkan pada pembaruan (update) **"feat: improve real-time sensor ingestion and add diagnostic simulator"**.

## 🌟 Fitur Baru (Diagnostic Simulator)
Fitur *Diagnostic Simulator* ditambahkan ke bagian antarmuka (frontend) untuk memudahkan pengujian dan simulasi data tanpa harus menghubungkan *hardware* sensor fisik secara langsung. Fitur ini sangat berguna untuk keperluan pengembangan (development) dan presentasi.

Simulator ini terbagi menjadi dua panel utama:

### 1. Manual Payload Ingestion
Panel ini memungkinkan pengguna untuk mengirimkan satu data (*single data point*) secara manual ke server backend (FastAPI).
*   **Fungsi:** Berguna untuk menguji bagaimana sistem merespon nilai-nilai sensor tertentu yang ekstrem atau spesifik.
*   **Input Data:** 
    *   Sensor Gas: Konsentrasi SO₂ (µg/m³) & H₂S (µg/m³)
    *   Cuaca: Suhu (°C), Kelembapan (%), & Kecepatan Angin (m/s)
    *   Daya Listrik: Tegangan (V) & Arus (mA)
*   **Feedback:** Dilengkapi dengan notifikasi (alert) jika data berhasil terkirim (*success*) atau gagal (*error*).

### 2. Auto Stream Simulator (Background Simulation)
Panel ini menyediakan simulasi aliran data secara terus-menerus dan otomatis, menggunakan algoritma *randomized walk* agar data terlihat natural (naik-turun secara dinamis).
*   **Fungsi:** Menghasilkan data untuk grafik (charts) secara live dan memperbarui status/titik lokasi di peta (Leaflet map).
*   **Target Node (Station):** Pengguna dapat memilih untuk mensimulasikan semua node secara bergantian (Node 1 hingga R) atau fokus membanjiri data hanya pada satu spesifik node.
*   **Simulation Speed:** Terdapat *slider* pengatur kecepatan (frekuensi) pengiriman data mulai dari 0.5 Hz (lambat) hingga 5.0 Hz (cepat).
*   **Status Dashboard:** Menampilkan indikator visual (animasi *pulse*) yang menunjukkan apakah simulator sedang berjalan, beserta penghitung *Packets Streamed* (jumlah paket data yang telah dikirim).

## 🛠️ Cara Penggunaan
1. Pastikan server Backend (`main.py`) sudah berjalan.
2. Buka aplikasi Frontend di browser (biasanya via `npm run dev`).
3. Buka halaman **Diagnostic Simulator** dari menu navigasi.
4. Pastikan status koneksi "Backend Online".
5. Anda bisa langsung mencoba form manual atau menekan tombol **"Start Simulation Stream"** yang berwarna ungu.

---
*Dokumen ini dibuat otomatis berdasarkan riwayat commit terbaru pada branch `adisuryadi/diagnostic-simulator`.*

## ⚙️ Pembaruan pada Backend (FastAPI)
Selain penambahan fitur pada antarmuka (frontend), ada beberapa perbaikan krusial pada kode backend untuk memastikan stabilitas saat menerima data sensor:

### 1. Peningkatan Stabilitas Serial Monitor (Auto-Reconnect)
*   **Auto-Reconnect:** Menambahkan mekanisme *loop* dan *retry* (dengan interval 5 detik) sehingga backend tidak langsung *crash* atau mati total ketika koneksi serial dari *microcontroller* terputus, kabel tercabut, atau terjadi *error*.
*   **CPU Optimization:** Menambahkan jeda kecil (`time.sleep(0.1)`) pada proses pembacaan serial (serial worker) untuk mencegah tingginya penggunaan CPU (CPU Spike) saat tidak ada aliran data yang masuk.
*   **Error Handling:** Pembacaan data dari CSV (koma) sekarang lebih kebal terhadap data yang terkorupsi (malformed float conversion) dengan melewati (*skip*) baris data yang rusak dan mencatat log *error*-nya tanpa menghentikan sistem.
*   **Update Port Serial:** Mengubah default port serial ke `COM7` dan menambahkan catatan konfigurasi *port* untuk sistem operasi dan board lain (Linux: `/dev/ttyUSB0` untuk Heltec, `/dev/ttyACM0` atau `COM3` untuk ESP32C3).

### 2. Perbaikan pada WebSocket & Startup Aplikasi
*   **WebSocket Logging:** Menambahkan log pencatatan (*print*) yang lebih detail saat ada klien/frontend yang terhubung (koneksi sukses) atau terputus secara tiba-tiba, serta mekanisme pemutusan (disconnect) yang lebih bersih (graceful).
*   **Non-blocking Database Init:** Mengubah fungsi inisialisasi *database* saat server pertama kali menyala (startup) menjadi *background task* (`asyncio.create_task`) agar proses startup utama Uvicorn tidak terhambat/terblokir.
*   **Redirect ke Swagger UI:** Menambahkan rute utama `/` yang akan otomatis mengarahkan (*redirect*) pengguna ke halaman dokumentasi API (`/docs`), sehingga lebih mudah diakses.
