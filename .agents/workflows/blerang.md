---
description: Aturan dasar agar AI tidak berhalusinasi pada Backend dan Frontend
---

# Aturan dan Panduan Proyek STASRG Sulfur Monitoring

Dokumen ini berisi panduan agar AI tidak berhalusinasi dan tetap konsisten dengan struktur proyek yang sudah ada.

## 1. Dilarang Berhalusinasi (Grounded Generation)
- **Baca file sebelum mengubah:** Jangan pernah menebak isi file atau variabel. Selalu gunakan *tools* untuk membaca file (seperti `api.py` di backend atau komponen JSX di frontend) sebelum memberikan saran atau menulis kode.
- **Jangan mengarang Endpoint/API:** Struktur API dan *WebSocket* sudah ditetapkan (FastAPI). Jika diminta memperbaiki fungsi, pastikan merujuk pada struktur yang ada di `backend/app/api.py`.
- **Tidak boleh mengubah struktur ML sembarangan:** Pipeline *Machine Learning* menggunakan vektor input 11-elemen yang urutannya tetap. Jangan menebak-nebak *features* yang dimasukkan ke dalam model XGBoost.

## 2. Struktur Proyek
Proyek ini terbagi menjadi dua bagian utama:
- **Backend (Python/FastAPI):** Pastikan tidak mengasumsikan adanya *test suite* atau konfigurasi *linter* yang rumit, karena saat ini tidak ada. Database (PostgreSQL) bersifat opsional.
- **Frontend (React 19 + Vite 7):** Komponen ditulis menggunakan file `.jsx` biasa (bukan TypeScript). Jangan mengusulkan atau memaksa penggunaan `.tsx` kecuali diminta secara eksplisit. UI menggunakan **shadcn/ui** dan **Tailwind v4**.

## 3. Jangan Menjalankan Perintah Git
Sistem/AI **dilarang keras** melakukan aktivitas Git atau GitHub apa pun (seperti `git commit`, `git push`, dsb). Semua operasi *version control* harus dilakukan secara manual oleh *user*.

## 4. Referensi Dokumen Penting
Setiap kali diminta melakukan perubahan arsitektur atau jika ragu, AI harus membaca dokumen berikut terlebih dahulu:
- `CLAUDE.md` (Berisi panduan instruksi utama proyek).
- `backend/SYSTEM_DIAGRAM.md` (Diagram alur data dan arsitektur sistem).
- `backend/README.md` (Panduan backend).

## 5. Bahasa
- Gunakan **Bahasa Indonesia** ketika berkomunikasi dengan user.
- Gunakan bahasa yang rapi untuk komentar di dalam kode (bahasa Inggris atau Indonesia sesuai konteks file tersebut).
