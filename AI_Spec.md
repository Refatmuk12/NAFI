# AI Engine Specification — NaFi

NaFi mengadopsi pendekatan **Multi-Agent AI Orchestration** untuk menjamin akurasi ekstraksi data finansial dan penentuan kategori anggaran yang presisi. Pendekatan ini memisahkan tugas pengenalan gambar, pembersihan logika finansial, dan pemrosesan wawasan konsultatif.

## 1. Spesifikasi Agen & Alur Kerja

```
[Foto Struk] ──> (Gemini 2.5 Flash) ──> [JSON Mentah]
                                              │
                                              ▼
[Database]  ──> (Claude 3.5 Sonnet) ──> [Data Tervalidasi + Kategori]
                                              │
                                              ▼
[Insights]  <── (ChatGPT / GPT-4o)  <── [Kalkulasi Saldo Berjalan]
```

### 1.1 Agent 1: Google Gemini 2.5 Flash API (OCR & Vision Master)
* **Peran:** Bertanggung jawab penuh terhadap pemrosesan berkas gambar (*computer vision*) and pengenalan karakter (*Optical Character Recognition*).
* **Tugas:**
  * Membaca teks mentah pada gambar struk fisik dengan berbagai variasi pencahayaan dan distorsi bentuk.
  * Mengekstrak parameter kunci: Nama Merchant, Daftar Item Barang, Harga Satuan, Kuantitas, Nilai Pajak (PPN), Potongan Harga, Tanggal Transaksi, dan Nominal Total Akhir.
* **Format Output:** JSON Terstruktur mentah.

### 1.2 Agent 2: Claude 3.5 Sonnet (Financial Logic & Classification Rule Enforcer)
* **Peran:** Bertindak sebagai mesin penegak aturan akuntansi (*accounting engine*) dan pembersih data (*data refiner*).
* **Tugas:**
  * Menerima payload JSON mentah dari Gemini.
  * Melakukan pengecekan duplikasi (*cross-check anti-duplication*) dengan membandingkan riwayat transaksi pada database (mencocokkan tanggal, total nilai, dan nama merchant).
  * Melakukan pemetaan item pengeluaran ke dalam sub-kategori penganggaran 60-20-20 berdasarkan konteks transaksi lokal Indonesia (misalnya, mengenali bahwa transaksi di "ALGO MIDI" atau "WARTEG KHARISMA BAHARI" termasuk ke dalam Pos Primer: Makanan).
* **Format Output:** Transaksi tervalidasi yang siap disimpan ke database.

### 1.3 Agent 3: ChatGPT / GPT-4o (Personal Financial Advisory Core)
* **Peran:** Asisten konsultasi finansial interaktif pengguna.
* **Tugas:**
  * Membaca agregasi mingguan/bulanan dari saldo berjalan (*running balance*) dan akumulasi pos anggaran.
  * Menghasilkan teks rekomendasi yang natural, peringatan cerdas apabila pengeluaran sekunder/gaya hidup mendekati batas alokasi 20%, serta memberikan saran taktis alokasi aset investasi.

## 2. Penanganan Kegagalan API (Fallback Mechanism)
* Jika API Gemini gagal merespons dalam <3 detik, sistem akan melempar kode error ke sisi klien untuk menawarkan opsi input manual cepat tanpa memblokir alur kerja pengguna.
* Jika Claude gagal menentukan kategori secara spesifik, item akan otomatis dikelompokkan ke dalam kategori default `Uncategorized (Review Required)` untuk kemudian dikonfirmasi manual oleh pengguna di antarmuka pasca-pemindaian.
