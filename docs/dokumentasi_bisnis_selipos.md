# Dokumentasi Proses Bisnis SeliPOS (Voltassium TA-POS)

**Disusun Oleh:** Senior Developer  
**Status:** Dokumen Hidup (Living Document)  

Dokumen ini memberikan ikhtisar komprehensif mengenai logika bisnis, struktur entitas, dan alur operasional utama dari sistem SeliPOS. Bahasa yang digunakan disesuaikan agar mudah dipahami oleh pemangku kepentingan teknis maupun non-teknis.

---

## 1. Gambaran Umum (Executive Summary)

**SeliPOS** adalah sistem *Point of Sale* (POS) modern berbasis web yang dirancang untuk memastikan kelancaran operasional bisnis F&B (Food and Beverage) atau ritel. Nilai jual utama sistem ini adalah:
- **Tahan Banting terhadap Koneksi:** Dapat beroperasi secara *offline* ketika internet terputus (menggunakan teknologi PWA).
- **Operasional Dapur Terintegrasi:** Memiliki tampilan khusus untuk dapur yang melacak persiapan pesanan per item secara *real-time*.
- **Transparansi Stok & Riwayat:** Pencatatan setiap pergerakan barang dan riwayat transaksi yang tidak dapat dimanipulasi secara sepihak.

## 2. Hierarki Entitas Bisnis Utama

Berikut adalah entitas utama yang membangun struktur data aplikasi ini:

### A. Toko / Cabang (Store)
- Entitas tertinggi dalam sistem.
- Setiap Toko memiliki detail dasar (Nama, Alamat).
- Semua transaksi, produk, dan karyawan (staff) diikat pada entitas Toko ini. Sistem mendukung multi-cabang (multi-tenant) di tingkat database.

### B. Manajemen Katalog (Kategori & Produk)
- **Kategori (Category):** Pengelompokan logis dari produk (Misal: "Makanan Utama", "Minuman Dingin", "Dessert").
- **Produk (Product):** Barang yang dijual. Menyimpan informasi seperti Harga, Deskripsi, Ketersediaan (*IsAvailable*), dan jumlah Stok saat ini. Produk selalu terikat pada satu Kategori dan satu Toko.

### C. Manajemen Inventaris (Stock History)
- Sistem tidak hanya mengubah angka stok di Produk, tetapi mencatat setiap kejadian dalam **Riwayat Stok (Stock History)**.
- Setiap kali ada barang masuk (restock), terjual, atau rusak/terbuang, sistem mencatat perubahan jumlah (positif/negatif) beserta **Alasan (Reason)**. Hal ini sangat krusial untuk audit stok harian.

## 3. Alur Operasional (Workflow)

### A. Alur Pemesanan Kasir (Order Flow)
1. **Pembuatan Pesanan (Order):** Kasir membuat pesanan yang dicatat dengan referensi ke Toko, Kasir (Staff), dan Nomor Meja (jika *dine-in*).
2. **Pencatatan Item (Order Item):** Masing-masing produk yang dipesan dicatat secara detail.
3. **Diskon:** Sistem mendukung pemberian diskon baik berupa persentase maupun nominal tunai (Discount Type & Value).
4. **Pembayaran (Payment):** Mencatat metode dan nominal pembayaran untuk menyelesaikan tagihan.

### B. Alur Dapur (Kitchen Workflow)
Sistem memiliki modul khusus untuk pekerja dapur:
1. Pesanan yang masuk otomatis tampil di layar Dapur (*Kitchen View*).
2. **Pelacakan Per-Item:** Dapur tidak hanya menandai seluruh pesanan "Selesai", tetapi melacak "jumlah yang sudah disajikan" untuk masing-masing item.
3. **Penyelesaian Otomatis:** Ketika semua item dalam satu pesanan telah sepenuhnya disajikan, status Pesanan (*Order Status*) secara otomatis berpindah dari "Pending" menjadi "Ready" (Siap Disajikan). Hal ini meminimalisir kesalahan operasional (human error).

## 4. Fitur Spesial: PWA & Offline Support

Karena koneksi internet di gerai seringkali tidak stabil, sistem ini memiliki lapisan perlindungan *Offline*:
- **Aplikasi Web Progresif (PWA):** Dapat diinstal di tablet/mesin POS seperti aplikasi native, dan berjalan tanpa internet.
- **Penyimpanan Lokal (IndexedDB):** Jika internet mati, pesanan baru akan disimpan di dalam browser (lokal) perangkat kasir.
- **Sinkronisasi Latar Belakang (Background Sync):** Begitu koneksi internet kembali pulih, sistem secara otomatis akan melakukan *upload* antrean pesanan tersebut ke *server* (Backend).
- Sistem didukung dengan validasi *idempotency* untuk mencegah transaksi masuk ganda (duplikat) jika sinkronisasi terjadi beberapa kali.

## 5. Pelaporan & Keamanan (Dashboard & Security)

- **Riwayat Transaksi (Order History):** Mencatat log dari pesanan masa lalu untuk verifikasi dan pembukuan.
- **Statistik (Statistics):** Memberikan tampilan analisis omzet, produk terlaris, dan performa harian kepada pemilik toko.
- **Autentikasi:** Sistem login diamankan dengan token JWT (JSON Web Token), membedakan wewenang antara Kasir, Dapur, dan Manajer (Pemilik).

---

> [!TIP]
> **Rekomendasi Developer:**
> Dokumentasi ini mencerminkan fondasi arsitektur saat ini (berdasarkan *backend* Go dan *frontend* Vue/Vite). Seiring dengan bertambahnya fitur, pastikan dokumen ini selalu direvisi setiap kali ada penambahan model *database* atau alur kerja (*workflow*) baru.
