# Dokumentasi Tech Stack SeliPOS (Voltassium TA-POS)

**Disusun Oleh:** Senior Developer  
**Status:** Dokumen Referensi Teknis  

Dokumen ini merinci tumpukan teknologi (*tech stack*) yang digunakan pada proyek SeliPOS. Arsitektur sistem ini dibagi menjadi dua bagian utama: **Backend** (API Services) dan **Frontend** (PWA Web Client). Teknologi yang dipilih difokuskan pada skalabilitas, kemudahan pemeliharaan, serta performa aplikasi (*offline-first*).

---

## 1. Backend Stack (Go API Server)

Backend sistem ini dibangun dengan arsitektur berlapis (layered architecture) yang rapi, memastikan pemisahan antara router, controller, service, dan repository.

**Bahasa Pemrograman:**  
- **Go (Golang)** versi 1.24.2. Bahasa ini dipilih karena tingkat performanya yang tinggi dan dukungannya terhadap sistem *concurrent* (*concurrency*).

**Library & Framework Utama:**
- **Web Framework:** [Gin](https://github.com/gin-gonic/gin) (`v1.11.0`) — Digunakan untuk *routing* HTTP yang sangat cepat dan penanganan *middleware*.
- **ORM (Object-Relational Mapping):** [Bun](https://github.com/uptrace/bun) (`v1.2.15`) — Digunakan sebagai pembangun *query* SQL (*SQL query builder*) yang aman dan efisien untuk berinteraksi dengan database.
- **Database Driver:** PostgreSQL via `pgdialect` dan `github.com/lib/pq` (`v1.10.9`).
- **Penyimpanan Objek (Object Storage):** [MinIO SDK](https://github.com/minio/minio-go/v7) (`v7.0.95`) — SDK yang kompatibel dengan Amazon S3 untuk menangani penyimpanan *file* dan gambar.

**Keamanan & Utilitas:**
- **Autentikasi:** [Golang JWT](https://github.com/golang-jwt/jwt/v5) (`v5.3.0`) — Mengimplementasikan *JSON Web Tokens* untuk proses otorisasi.
- **Enkripsi:** `golang.org/x/crypto` (`v0.43.0`) — Digunakan untuk *hashing password* (Bcrypt) dan enkripsi kunci data.
- **Manajemen Konfigurasi:** [Viper](https://github.com/spf13/viper) (`v1.21.0`) — Menangani *parsing file* `.yaml` dan variabel *environment* (ENV).
- **Validasi Data:** [Validator](https://github.com/go-playground/validator/v10) (`v10.28.0`) — Menjamin integritas data dari *input user* di *level* DTO.
- **Logging:** [Zap](https://go.uber.org/zap) (`v1.27.0`) — *Logger* terstruktur dan berkinerja sangat tinggi dari Uber.
- **Pembuatan ID Unik:** [KSUID](https://github.com/segmentio/ksuid) (`v1.0.4`) — Untuk menghasilkan *Identifier* yang *sortable* secara acak (K-Sortable Unique ID).

---

## 2. Frontend Stack (Vue PWA Client)

Frontend dirancang sebagai *Progressive Web App* (PWA) agar bisa digunakan di mesin kasir (POS) tanpa harus selalu bergantung pada koneksi internet.

**Bahasa Pemrograman & Build Tool:**  
- **TypeScript** (`v6.0.3`) — Menyediakan *type safety* pada saat penulisan kode JavaScript.
- **Vite** (`v7.1.12`) — *Build tool* generasi terbaru yang menawarkan *hot module replacement* (HMR) sangat cepat.

**Framework Inti:**
- **Vue.js** (`v3.4.34`) — *Framework* antarmuka pengguna berbasis komponen (*Composition API*).
- **State Management:** [Pinia](https://pinia.vuejs.org/) (`v3.0.4`) — Digunakan untuk mengatur keadaan (*state*) global di aplikasi.
- **Routing:** [Vue Router](https://router.vuejs.org/) (`v4.4.0`) — Modul perpindahan halaman atau navigasi (*SPA routing*).

**UI & Styling:**
- **Komponen UI:** [PrimeVue](https://primevue.org/) (`v4.5.4`) beserta `primeicons` (`v7.0.0`) dan `@primeuix/themes` (`v2.0.0`). Koleksi UI komponen tingkat produksi (*enterprise-ready*).
- **Styling Utility:** [Tailwind CSS](https://tailwindcss.com/) (`v4.1.17`) — *Framework CSS utility-first* untuk mempercepat pengembangan tata letak (layout), diintegrasikan dengan modul `tailwindcss-primeui` (`v0.6.0`).
- **Preprocessor:** [Sass](https://sass-lang.com/) (`v1.55.0`).

**Kemampuan Spesifik (PWA, HTTP, Offline Data):**
- **Offline Storage:** [IDB](https://github.com/jakearchibald/idb) (`v8.0.3`) — Digunakan untuk manajemen *IndexedDB* (menyimpan data transaksi/produk saat internet terputus).
- **Progressive Web App:** `vite-plugin-pwa` (`v1.3.0`) — Melakukan *generate* Service Worker dan manifest PWA (berkat konfigurasi `workbox` spesifik untuk menyangga API dan *fonts*).
- **HTTP Client:** [Axios](https://axios-http.com/) (`v1.15.2`) — Komunikasi permintaan HTTP *fetch* standar untuk terhubung ke Backend Go.

**Lain-lain:**
- **Pembuatan Grafik:** [Chart.js](https://www.chartjs.org/) (`v3.3.2`) — Digunakan pada halaman *Dashboard/Statistics* untuk merender visualisasi data penjualan.
- **Linter & Formatter:** ESLint (`v8.57.0`) dan Prettier (`v3.2.5`) untuk menjaga standardisasi kualitas baris kode.

---

> [!NOTE]
> **Kesimpulan Arsitektural:** 
> Stack teknologi ini adalah paduan arsitektur modern yang berfokus pada kecepatan pengiriman respons (*Go & Gin*) serta fleksibilitas antarmuka untuk pengalaman aplikasi menyerupai aplikasi *native* pada layar sentuh POS/kasir (*Vue 3 & Vite PWA*).
