# Laporan Hasil Pengujian Sistem SeliPOS

Dokumen ini berisi hasil pengujian fungsional sistem SeliPOS menggunakan metode *Blackbox Testing*. Pengujian dilakukan untuk memverifikasi fungsionalitas inti sistem baik dari sisi backend (Go) maupun frontend (Vue 3 PWA).

---

### T-01: Autentikasi Pengguna (Validasi Hak Akses Masuk)

| Komponen Pengujian | Detail Informasi |
| :--- | :--- |
| **ID Butir Uji** | T-01 |
| **Nama Butir Uji** | Pengujian Autentikasi Pengguna dengan JWT |
| **Deskripsi** | Memverifikasi proses masuk pengguna (Login) dan penyimpanan token JWT secara aman di Local Storage, serta validasi hak akses untuk halaman terproteksi. |
| **Kondisi Awal** | Pengguna belum masuk ke sistem, peramban menampilkan halaman `/auth/login`, dan token JWT (`access_token`) belum tersimpan di penyimpanan lokal peramban. |
| **Tanggal Pengujian** | 18 Juni 2026 |
| **Penguji** | Dimas Premono Soko Andayani |
| **Skenario Pengujian** | 1. Buka aplikasi SeliPOS pada peramban web Google Chrome.<br>2. Masukkan alamat email valid (`owner@pos.com`) dan kata sandi (`password123`) pada form login.<br>3. Klik tombol "Masuk".<br>4. Buka Developer Tools Chrome (F12) -> Application -> Local Storage untuk memeriksa keberadaan token JWT.<br>5. Buka tab baru dan akses langsung rute terproteksi `/` (Dashboard) untuk memvalidasi status autentikasi. |
| **Hasil yang Diharapkan** | Aplikasi memproses kredensial, menyimpan `access_token` dan `refresh_token` di Local Storage peramban, serta mengarahkan pengguna ke halaman Dashboard utama. Akses langsung ke halaman terproteksi diizinkan tanpa terlempar kembali ke halaman login. |
| **Hasil Pengamatan** | Pengguna berhasil dialihkan ke dashboard utama setelah tombol masuk ditekan. Token JWT berupa `access_token` dan `refresh_token` berhasil tersimpan di Local Storage. Navigasi langsung ke rute terproteksi berjalan lancar tanpa meminta login kembali. |
| **Kesimpulan** | **BERHASIL / LOLOS UJI** |

---

### T-02: Manajemen Produk (Penambahan & Pemesanan Produk Baru)

| Komponen Pengujian | Detail Informasi |
| :--- | :--- |
| **ID Butir Uji** | T-02 |
| **Nama Butir Uji** | Pengujian Manajemen Produk (Tambah & Pesan) |
| **Deskripsi** | Memeriksa kelayakan penambahan produk baru ke dalam sistem dan kemampuan produk tersebut untuk langsung muncul dan dipesan di halaman transaksi kasir. |
| **Kondisi Awal** | Pengguna masuk sebagai peran Owner/Admin, berada pada halaman manajemen produk, dan produk uji ("Es Jeruk Manis") belum terdaftar dalam sistem. |
| **Tanggal Pengujian** | 18 Juni 2026 |
| **Penguji** | Dimas Premono Soko Andayani |
| **Skenario Pengujian** | 1. Navigasi ke menu "Manajemen Produk".<br>2. Klik tombol "New" untuk membuka formulir pembuatan produk.<br>3. Isi data produk baru: Nama "Es Jeruk Manis", tipe "Kulakan", harga beli Rp 3.000, harga jual Rp 5.000, stok awal 50 unit, lalu simpan.<br>4. Navigasi ke menu "Kasir / Transaksi".<br>5. Cari produk "Es Jeruk Manis" di grid kasir, pilih produk tersebut, masukkan ke keranjang belanja, dan lakukan pemesanan. |
| **Hasil yang Diharapkan** | Produk baru sukses tersimpan ke database backend, langsung muncul di halaman transaksi kasir dengan informasi harga dan stok yang sinkron, serta berhasil diproses ke keranjang belanja tanpa terjadi kesalahan sistem. |
| **Hasil Pengamatan** | Produk "Es Jeruk Manis" berhasil ditambahkan dan langsung tampil di halaman Kasir. Kuantitas stok awal terdeteksi sebanyak 50 unit. Pemesanan produk tersebut dapat dilakukan hingga masuk ke keranjang belanja kasir dengan harga jual yang tepat (Rp 5.000). |
| **Kesimpulan** | **BERHASIL / LOLOS UJI** |

---

### T-03: Manajemen Pesanan (Pembuatan Nota Transaksi Baru & Kalkulasi Online)

| Komponen Pengujian | Detail Informasi |
| :--- | :--- |
| **ID Butir Uji** | T-03 |
| **Nama Butir Uji** | Pengujian Pembuatan Nota Transaksi dan Kalkulasi Kasir |
| **Deskripsi** | Memastikan kalkulator transaksi pada mesin kasir menghitung subtotal belanja, total nominal pembayaran, uang kembalian, dan memicu pencetakan nota/struk secara online. |
| **Kondisi Awal** | Pengguna masuk sebagai peran Staff/Kasir, berada di halaman kasir (`/pages/Order.vue`), dan aplikasi terhubung dengan internet secara penuh. |
| **Tanggal Pengujian** | 18 Juni 2026 |
| **Penguji** | Dimas Premono Soko Andayani |
| **Skenario Pengujian** | 1. Tambahkan 2 unit "Nasi Goreng" (@ Rp 20.000) dan 1 unit "Es Jeruk Manis" (@ Rp 5.000) ke dalam keranjang transaksi.<br>2. Perhatikan nilai Subtotal yang dihitung di layar kasir.<br>3. Isi nominal uang bayar yang diterima dari pelanggan sebesar Rp 50.000.<br>4. Periksa kalkulasi otomatis nilai Uang Kembalian di layar.<br>5. Klik tombol "Selesaikan Pembayaran" dan amati respon cetak struk nota belanja. |
| **Hasil yang Diharapkan** | Subtotal terhitung Rp 45.000 secara otomatis, uang kembalian terhitung Rp 5.000, data transaksi tersimpan di database dengan status `Paid`, dan dialog pratinjau struk belanja kasir muncul seketika untuk dicetak. |
| **Hasil Pengamatan** | Kalkulator kasir menghitung subtotal transaksi sebesar Rp 45.000 dengan tepat. Uang kembalian yang muncul di layar bernilai Rp 5.000 sesaat setelah nominal uang bayar Rp 50.000 diinput. Ketika pembayaran diselesaikan, data transaksi tersimpan di backend, status pesanan menjadi `Paid`, dan dialog cetak struk kasir berhasil terpicu. |
| **Kesimpulan** | **BERHASIL / LOLOS UJI** |

---

### T-04 & T-05: PWA Offline Support & Sinkronisasi Otomatis

| Komponen Pengujian | Detail Informasi |
| :--- | :--- |
| **ID Butir Uji** | T-04 dan T-05 |
| **Nama Butir Uji** | Pengujian Transaksi Luring (Offline) dan Sinkronisasi Data Otomatis |
| **Deskripsi** | Memeriksa kemampuan aplikasi untuk tetap memproses pesanan saat internet terputus, mengamankan data ke IndexedDB, dan mengunggahnya secara otomatis saat terhubung kembali. |
| **Kondisi Awal** | Aplikasi SeliPOS telah terpasang pada peramban, pengguna (kasir) telah masuk ke sistem, dan koneksi internet pada perangkat dimatikan secara sengaja. |
| **Tanggal Pengujian** | 18 Juni 2026 |
| **Penguji** | Dimas Premono Soko Andayani |
| **Skenario Pengujian** | 1. Putuskan jaringan internet pada perangkat laptop pengujian.<br>2. Masuk ke halaman kasir, buat transaksi baru dengan memilih beberapa produk, masukkan nominal pembayaran, dan klik tombol "Selesaikan Pembayaran".<br>3. Buka menu Developer Tools pada Google Chrome untuk memeriksa tab Application Storage pada bagian IndexedDB.<br>4. Aktifkan kembali koneksi internet pada perangkat laptop.<br>5. Amati lalu lintas jaringan pada peramban serta periksa isi tabel orders pada basis data PostgreSQL server. |
| **Hasil yang Diharapkan** | Transaksi berhasil diselesaikan tanpa memunculkan pesan error, data tersimpan sementara di IndexedDB, dan saat internet menyala, data otomatis dikirim ke server tanpa duplikasi data. |
| **Hasil Pengamatan** | Aplikasi tetap berjalan responsif saat internet mati, notifikasi lokal muncul mengonfirmasi transaksi aman. Data terbukti terekam pada IndexedDB. Ketika internet kembali terhubung, Service Worker memicu Background Sync untuk mengirimkan payload transaksi ke backend Go, dan data langsung terekam pada database PostgreSQL secara utuh. |
| **Kesimpulan** | **BERHASIL / LOLOS UJI** |

---

### T-06: Kitchen Display System (Pembaruan Status Pesanan Granular)

| Komponen Pengujian | Detail Informasi |
| :--- | :--- |
| **ID Butir Uji** | T-06 |
| **Nama Butir Uji** | Pengujian Kitchen Display System (KDS) Secara Granular |
| **Deskripsi** | Memverifikasi pembaruan status pengerjaan makanan dan minuman di bagian dapur secara bertahap (per unit kuantitas) oleh koki, dan penyelesaian status pesanan otomatis setelah semua item siap disajikan. |
| **Kondisi Awal** | Pengguna masuk sebagai peran Chef/Koki, berada di halaman dapur (`/pages/Kitchen.vue`), terdapat setidaknya satu pesanan baru berstatus `Paid` dengan detail item menu yang dipesan. |
| **Tanggal Pengujian** | 18 Juni 2026 |
| **Penguji** | Dimas Premono Soko Andayani |
| **Skenario Pengujian** | 1. Buka halaman "Dapur" pada peramban web.<br>2. Pilih kartu pesanan aktif (misalnya kode order `ORD-xxx` dengan detail 2 unit "Nasi Goreng").<br>3. Koki menyelesaikan porsi pertama Nasi Goreng, klik tombol "+" untuk menaikkan porsi yang disajikan (served_qty) menjadi `1/2`. Periksa progress bar.<br>4. Koki menyelesaikan porsi kedua, klik tombol "+" kembali untuk menaikkan porsi disajikan menjadi `2/2`. Periksa status pesanan pada layar dapur. |
| **Hasil yang Diharapkan** | Sistem memperbarui jumlah item disajikan secara granular (1/2 menjadi 2/2) dan progress bar bertambah secara proporsional. Ketika seluruh item pada pesanan selesai disajikan (100%), kartu pesanan otomatis hilang dari daftar dapur dan status pesanan di database berubah menjadi `Completed`. |
| **Hasil Pengamatan** | Tombol "+" menaikkan status sajian per item secara real-time. Progress bar terisi penuh saat porsi disajikan mencapai `2/2`. Kartu pesanan otomatis didelete dari antrean dapur setelah seluruh item rampung, diiringi pesan notifikasi sukses bahwa pesanan siap disajikan. Status order di database berhasil terupdate menjadi `Completed`. |
| **Kesimpulan** | **BERHASIL / LOLOS UJI** |

---

### T-07: Riwayat Pergerakan Stok (Pencatatan Log Mutasi Berbasis Event Sourcing)

| Komponen Pengujian | Detail Informasi |
| :--- | :--- |
| **ID Butir Uji** | T-07 |
| **Nama Butir Uji** | Pengujian Riwayat Pergerakan Stok Berbasis Event Sourcing |
| **Deskripsi** | Menguji pencatatan log transaksi mutasi inventaris barang secara otomatis di database setiap kali terjadi aktivitas produk baru, penyesuaian manual, pemesanan kasir, restock, maupun pembatalan pesanan. |
| **Kondisi Awal** | Pengguna masuk sebagai Owner, berada di halaman riwayat stok (`/pages/StockHistory.vue`), dan stok produk uji ("Es Jeruk Manis") dalam keadaan termonitor. |
| **Tanggal Pengujian** | 18 Juni 2026 |
| **Penguji** | Dimas Premono Soko Andayani |
| **Skenario Pengujian** | 1. Tambahkan produk baru "Es Jeruk Manis" dengan stok awal 50 unit.<br>2. Lakukan transaksi kasir untuk membeli 2 unit produk tersebut.<br>3. Batalkan transaksi tersebut di riwayat pemesanan.<br>4. Lakukan penyesuaian manual stok (misal: kurangi stok sebanyak 5 unit secara langsung).<br>5. Buka halaman "Riwayat Stok" dan periksa seluruh entri log mutasi stok yang tercatat di tabel. |
| **Hasil yang Diharapkan** | Sistem mencatat setiap peristiwa pergerakan stok sebagai entri riwayat mutasi yang bersifat *immutable* (tidak dapat diubah) dengan alasan yang tepat: `Stok Awal Produk Baru` (+50), `Order ORD-xxx Created` (-2), `Order ORD-xxx Cancelled` (+2), dan `Penyesuaian Stok (Manual)` (-5). |
| **Hasil Pengamatan** | Setiap tindakan mutasi terekam secara otomatis di database pada tabel `stock_histories`. Log mutasi memuat informasi yang akurat mengenai Stok Awal, Kuantitas Perubahan, Stok Akhir, dan Alasan Log secara konsisten. Log-log tersebut berhasil dimuat di halaman "Riwayat Stok" dalam bahasa Indonesia yang telah diterjemahkan. |
| **Kesimpulan** | **BERHASIL / LOLOS UJI** |
