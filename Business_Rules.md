# Business Rules & Financial Logic — NaFi

Dokumen ini mendefinisikan aturan bisnis, logika pembagian anggaran, dan formula perhitungan keuangan yang diimplementasikan secara baku di dalam kode program platform NaFi.

## 1. Aturan Alokasi Anggaran Terstruktur (60-20-20 Framework)
Setiap pengeluaran yang dicatat oleh pengguna wajib dipetakan ke dalam salah satu dari tiga pilar alokasi utama berikut:

### 1.1 Pos Primer (Target Alokasi: 60%)
* **Deskripsi:** Segala bentuk pengeluaran pokok dan kebutuhan mendasar yang mutlak dipenuhi untuk kelangsungan hidup harian.
* **Cakupan Sub-Kategori:**
  * Bahan pangan, belanja grosir bulanan, makan harian (Warteg, dsb.).
  * Transportasi operasional, bahan bakar, tarif tol.
  * Tagihan utilitas wajib (Listrik, Air, Internet Rumah).
  * Cicilan tetap masa lalu (*Kewajiban*) yang tidak bisa dihindari.

### 1.2 Pos Sekunder (Target Alokasi: 20%)
* **Deskripsi:** Pengeluaran yang bersifat keinginan, hiburan, gaya hidup, atau non-pokok.
* **Cakupan Sub-Kategori:**
  * Hobi, mainan, keanggotaan konten kreasi/membership digital.
  * Makan mewah di kafe (*dine-out*), rekreasi, liburan.
  * Pakaian non-seragam, belanja barang konsumtif.

### 1.3 Pos Investasi & Aset (Target Alokasi: 20%)
* **Deskripsi:** Alokasi dana yang ditujukan untuk masa depan, pengamanan risiko, serta akumulasi kekayaan.
* **Cakupan Sub-Kategori:**
  * Pembelian Reksa Dana (misal: Reksa Dana Saham, Pasar Uang).
  * Tabungan berjangka, instrumen pasar modal.
  * Alokasi pengisian Dana Darurat (*Emergency Fund*).

## 2. Aturan Perhitungan Saldo Berjalan (Running Balance Rules)
Setiap baris transaksi baru secara kronologis mempengaruhi nilai saldo berjalan. Formula dasar perhitungan pada setiap baris data transaksi $t$ dinyatakan sebagai berikut:

$$Saldo\_Akhir_{t} = Saldo\_Akhir_{t-1} + Pendapatan_{t} - Pengeluaran_{t}$$

* **Keterangan:**
  * Pendapatan (*Incoming*): Nilai transaksi bernilai positif.
  * Pengeluaran (*Outgoing*): Nilai transaksi bernilai negatif.
  * Setiap modifikasi data masa lalu (jika diizinkan oleh sistem pengawas) wajib memicu perhitungan ulang (*re-calculating*) seluruh baris transaksi setelah linimasa tersebut secara berurutan.

## 3. Pencegahan Duplikasi Data Transaksi
Sistem penegak aturan (Claude Agent) harus memvalidasi draf pemindaian baru berdasarkan aturan ketat:
* Jika terdapat transaksi dalam rentang $\pm 10$ menit dari tanggal yang sama, dengan nilai nominal total yang identik, dan nama merchant yang sama, maka draf transaksi baru dinyatakan sebagai **Potensi Duplikat**.
* Sistem wajib menampilkan jendela peringatan (*Warning Modal*) kepada pengguna sebelum menyimpan data untuk mencegah pencatatan berganda.
