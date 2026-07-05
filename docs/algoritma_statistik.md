# Algoritma Perhitungan Statistik Dashboard SeliPOS

Dokumen ini menjelaskan rancangan, formula matematis, alur data, dan query database yang digunakan untuk menghasilkan metrik statistik pada Dashboard SeliPOS. Informasi ini disusun secara terstruktur untuk mempermudah penulisan laporan Tugas Akhir (TA).

---

## 1. Definisi Metrik & Formulasi Matematis

Dashboard SeliPOS menyajikan 4 metrik utama dalam bentuk kartu informasi ringkasan (*summary cards*) dan grafik perkembangan (*trend chart*). Metrik tersebut dihitung berdasarkan formula berikut:

### A. Total Orders (Total Transaksi)
Jumlah seluruh transaksi penjualan yang telah diselesaikan pada rentang waktu terpilih ($t$).
$$TotalOrders = \sum (Orders_{Completed})$$

### B. Total Revenue (Total Pendapatan Kotor)
Akumulasi total nominal transaksi penjualan bersih setelah diskon yang telah selesai (*status = 'Completed'*).
$$TotalRevenue = \sum_{i=1}^{n} (OrderAmount_i)$$
*Di mana $n$ adalah jumlah transaksi penjualan dengan status `Completed` pada periode terpilih.*

### C. Total Expenses (Total Pengeluaran)
Gabungan dari Pengeluaran Operasional Toko (dari modul pengeluaran) dan Biaya Pokok Penjualan (COGS / *Cost of Goods Sold*) dari produk kulakan yang terjual.
$$TotalExpenses = OperationalExpenses + COGS_{Kulakan}$$
Di mana $COGS_{Kulakan}$ dihitung menggunakan rumus:
$$COGS_{Kulakan} = \sum_{j=1}^{m} (QtySold_j \times PurchasePrice_j)$$
*Di mana $m$ adalah jenis produk bertipe 'Kulakan' yang terjual dalam periode tersebut, $QtySold$ adalah kuantitas produk yang terjual, dan $PurchasePrice$ adalah harga beli produk.*

### D. Total Profit (Keuntungan Bersih)
Hasil bersih pendapatan setelah dikurangi total pengeluaran.
$$TotalProfit = TotalRevenue - TotalExpenses$$

---

## 2. Alur Algoritma (Flowchart)

Berikut adalah flowchart proses penarikan data dan kalkulasi statistik dashboard di backend SeliPOS:

```mermaid
graph TD
    A[Mulai: Request Dashboard Data] --> B[Ambil Parameter TimeRange <br> 'today', 'weekly', 'monthly', 'all']
    B --> C[Tentukan Rentang Tanggal: <br> startDate s.d. endDate]
    
    C --> D[Query 1: Ambil Total Orders & Revenue <br> dari tabel 'orders' status = Completed]
    C --> E[Query 2: Ambil Pengeluaran Operasional <br> dari tabel 'pengeluaran']
    C --> F[Query 3: Ambil COGS Kulakan <br> dari tabel 'order_items' & 'products']
    
    D & E & F --> G[Gabungkan & Akumulasikan <br> TotalExpenses = Pengeluaran + COGS]
    G --> H[Hitung Profit Bersih: <br> TotalProfit = TotalRevenue - TotalExpenses]
    
    H --> I[Petakan Data ke Grafik Harian/Bulanan <br> Map Date -> Revenue, Expenses, Profit]
    I --> J[Selesai: Return Dashboard Response]
```

---

## 3. Implementasi Query Database (PostgreSQL / Bun ORM)

### A. Query Total Revenue & Orders
Mengambil data langsung dari tabel `orders` dengan filter `store_id`, `status`, dan rentang waktu. Menggunakan `COALESCE` untuk menghindari nilai `NULL` jika tidak ada transaksi.

```sql
SELECT 
    COUNT(*) AS total_orders, 
    COALESCE(SUM(total_amount), 0) AS total_revenue 
FROM orders 
WHERE 
    status = 'Completed' 
    AND store_id = :store_id 
    AND created_at >= :start_date 
    AND created_at <= :end_date;
```

### B. Query Pengeluaran Operasional
Mengambil total pengeluaran operasional toko dari tabel `pengeluaran`.

```sql
SELECT 
    COALESCE(SUM(amount), 0) 
FROM pengeluaran 
WHERE 
    store_id = :store_id 
    AND tanggal >= :start_date 
    AND tanggal <= :end_date;
```

### C. Query COGS (Cost of Goods Sold) Produk Kulakan
Melakukan *join* antara tabel detail item pesanan (`order_items`), pesanan (`orders`), dan produk (`products`) untuk menghitung total biaya pembelian produk kulakan yang terjual.

```sql
SELECT 
    COALESCE(SUM(oi.quantity * p.harga_beli), 0) 
FROM order_items AS oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
WHERE 
    o.status = 'Completed' 
    AND o.store_id = :store_id 
    AND o.created_at >= :start_date 
    AND o.created_at <= :end_date
    AND p.product_type = 'Kulakan';
```

---

## 4. Keunggulan Desain Algoritma

1. **Akurasi Profitabilitas Tinggi**: Perhitungan profit tidak hanya membandingkan penjualan dengan pengeluaran operasional biasa, melainkan juga memperhitungkan modal pembelian awal barang (*Cost of Goods Sold* / COGS) khusus untuk produk tipe Kulakan secara otomatis.
2. **Keamanan Nilai Kosong (Null-Safety)**: Penggunaan fungsi database `COALESCE(..., 0)` menjamin aplikasi Go tidak mengalami gangguan *crash* (seperti *nil-pointer dereference*) saat melakukan *binding* data ketika database kosong atau tidak memiliki riwayat transaksi pada filter tanggal tertentu.
3. **Agregasi Grafik Dinamis**: Di tingkat *Service Layer*, data penjualan harian, pengeluaran harian, dan COGS harian digabungkan secara dinamis menggunakan struktur data *Map* berbasis tanggal (`dateStr`) sehingga visualisasi grafik keuangan dapat terpetakan secara presisi dan cepat tanpa *double looping*.
