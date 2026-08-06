# Panduan CI/CD & Deployment

Dokumen ini menjelaskan alur kerja (workflow) Continuous Integration (CI) dan Continuous Deployment (CD) untuk proyek **STASRG Sulfur Monitoring**.

## 1. Continuous Integration (CI)
File Konfigurasi: `.github/workflows/ci.yml`

Setiap kali ada kode yang di-`push` ke repositori, GitHub Actions akan menjalankan CI secara otomatis. Proses ini akan:
- Menguji **Frontend** dengan menjalankan pengecekan Linter (ESLint) dan Build (Vite).
- Menguji **Backend** dengan menginstall dependensi Python dan menjalankan Linter (Ruff) untuk mendeteksi error pada penulisan kode.

CI berfungsi memastikan kode Anda selalu bebas dari error dan siap untuk tahap Deployment.

## 2. Continuous Deployment (CD)
File Konfigurasi: `.github/workflows/cd.yml`

CD berfungsi untuk mengirim (deploy) kode Anda secara otomatis ke server atau platform hosting (seperti Vercel, VPS, atau AWS). 
Saat ini, file `cd.yml` sudah disiapkan namun **semua kodenya sedang di-nonaktifkan (di-comment dengan tanda `#`)**.

### Cara Mengaktifkan CD:
1. Buka file `.github/workflows/cd.yml`.
2. Hapus tanda `#` (uncomment) pada baris kode (baik bagian *frontend-deploy* maupun *backend-deploy*) sesuai dengan platform tujuan Anda.
3. Simpan dan commit perubahan tersebut ke GitHub.

> **PENTING:** Agar skrip CD berfungsi tanpa masalah otorisasi, Anda WAJIB mengatur data rahasia (Secrets) pada pengaturan repositori GitHub.

### Cara Menambahkan Secrets di GitHub:
1. Buka repositori Anda di web **GitHub.com**.
2. Klik tab **Settings** (Pengaturan).
3. Di panel sebelah kiri, cari menu **Secrets and variables** lalu pilih **Actions**.
4. Klik tombol hijau **New repository secret**.
5. Tambahkan rahasia berikut sesuai dengan konfigurasi deployment Anda:

#### Jika Deploy Frontend (Contoh: Vercel)
Masukkan nama *secret* berikut beserta nilai token/ID yang Anda dapatkan dari dashboard Vercel:
- **Name:** `VERCEL_TOKEN` 
  **Value:** (Token akun Vercel Anda)
- **Name:** `VERCEL_ORG_ID` 
  **Value:** (ID Organisasi Vercel Anda)
- **Name:** `VERCEL_PROJECT_ID` 
  **Value:** (ID Proyek aplikasi di Vercel)

#### Jika Deploy Backend (Contoh: VPS/Server Pribadi via SSH)
Masukkan nama *secret* berikut beserta detail akses ke server Anda:
- **Name:** `SERVER_HOST` 
  **Value:** (Alamat IP Server Anda, misal: `192.168.1.100`)
- **Name:** `SERVER_USERNAME` 
  **Value:** (Username login SSH, misal: `root` atau `ubuntu`)
- **Name:** `SERVER_SSH_KEY` 
  **Value:** (Private Key SSH server Anda / file `.pem` atau `.id_rsa`)

Setelah rahasia ini disimpan dan kode `cd.yml` diaktifkan, setiap `push` yang lolos CI (sukses dites) akan secara otomatis diperbarui di server aktif Anda!
