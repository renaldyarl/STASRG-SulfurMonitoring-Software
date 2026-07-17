# Update: Diagnostic Simulator & Real-time Map Wind Flow

Dokumen ini berisi rangkuman fitur baru yang ditambahkan pada pembaruan (update) sistem monitoring sulfur STASRG.

---

## 🌟 1. Fitur Baru: Diagnostic Simulator
Fitur *Diagnostic Simulator* ditambahkan ke bagian antarmuka (frontend) untuk memudahkan pengujian dan simulasi data tanpa harus menghubungkan *hardware* sensor fisik secara langsung. Fitur ini sangat berguna untuk keperluan pengembangan (development) dan presentasi.

Simulator ini terbagi menjadi dua panel utama:

### A. Manual Payload Ingestion
Panel ini memungkinkan pengguna untuk mengirimkan satu data (*single data point*) secara manual ke server backend (FastAPI).
*   **Fungsi:** Berguna untuk menguji bagaimana sistem merespon nilai-nilai sensor tertentu yang ekstrem atau spesifik.
*   **Input Data:** 
    *   Sensor Gas: Konsentrasi SO₂ (µg/m³) & H₂S (µg/m³)
    *   Cuaca: Suhu (°C), Kelembapan (%), & Kecepatan Angin (m/s)
    *   Daya Listrik: Tegangan (V) & Arus (mA)
*   **Feedback:** Dilengkapi dengan notifikasi (alert) jika data berhasil terkirim (*success*) atau gagal (*error*).

### B. Auto Stream Simulator (Background Simulation)
Panel ini menyediakan simulasi aliran data secara terus-menerus dan otomatis, menggunakan algoritma *randomized walk* agar data terlihat dinamik (naik-turun secara alami).
*   **Fungsi:** Menghasilkan data untuk grafik (charts) secara live dan memperbarui status/titik lokasi di peta (Leaflet map).
*   **Target Node (Station):** Pengguna dapat memilih untuk mensimulasikan semua node secara bergantian (Node 1 hingga R) atau fokus membanjiri data hanya pada satu spesifik node.
*   **Simulation Speed:** Terdapat *slider* pengatur kecepatan (frekuensi) pengiriman data mulai dari 0.5 Hz (lambat) hingga 5.0 Hz (cepat).
*   **Status Dashboard:** Menampilkan indikator visual (animasi *pulse*) yang menunjukkan apakah simulator sedang berjalan, beserta penghitung *Packets Streamed* (jumlah paket data yang telah dikirim).

---

## 🧭 2. Fitur Baru: Visualisasi Awan Angin Dinamis & Peta Offline (BMKG Style)
Fitur peta satelit offline (`GpsDashboard.jsx`) diperbarui secara signifikan untuk memberikan visualisasi penyebaran arah angin secara *real-time*.

### A. Lapisan Awan Angin Bergerak (Wind Flow Overlay)
*   Menambahkan komponen `WindFlowOverlay` di atas peta Leaflet yang membaca rata-rata kecepatan angin (`wind_speed`) dan arah angin (`wind_dir`) dari semua titik sensor yang aktif.
*   Merender partikel awan transparan (efek kabut) dan garis embusan angin secara dinamis menggunakan animasi *CSS Transform* (`translateX`).
*   **Kecepatan Gerakan:** Kecepatan awan terbang disesuaikan secara dinamis berdasarkan nilai `wind_speed`.
*   **Arah Gerakan:** Arah awan mengalir memutar otomatis (`rotate`) menyesuaikan dengan sudut derajat `wind_dir`.

### B. Pengembalian Pin GPS Standar
*   Untuk menghindari kebingungan pengguna, ikon penanda GPS dikembalikan menggunakan gambar **pin biru standar** (sebagai penanda koordinat statis).
*   Node yang tidak aktif tetap ditandai dengan pin berwarna abu-abu.
*   Awan-awan bergerak akan terus terbang melintasi pin-pin GPS ini.

### C. Perbaikan Bug Peta Terpotong (Black Screen)
*   Memperbaiki bug internal Leaflet di mana Leaflet melakukan zoom-out otomatis ke Zoom 17 akibat ketidaksesuaian aspek rasio kontainer. Zoom level 17 memicu permintaan ubin (*tiles*) di luar area kawah yang tidak diunduh secara offline, sehingga menampilkan kotak hitam besar di bagian bawah peta.
*   **Solusi:** Mengunci rentang pembesaran peta secara ketat di Zoom 18 (`minZoom={18}`, `maxZoom={18}`) untuk detail satelit maksimal, dan mengintegrasikan `map.invalidateSize()` di dalam komponen `MapResizer` untuk memaksa pembaruan ukuran wadah (*container*) secara instan.
