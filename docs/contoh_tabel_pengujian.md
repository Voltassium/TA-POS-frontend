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