# Security & Data Protection Policy — NaFi

Keamanan informasi finansial merupakan prioritas tertinggi pada platform NaFi. Dokumen ini menguraikan lapisan perlindungan keamanan yang diterapkan mulai dari level jaringan, otentikasi, hingga enkripsi data di dalam database.

## 1. Otentikasi dan Otorisasi Akses
* **Supabase Auth & JWT:** Proses pendaftaran dan masuk pengguna dikelola secara terpusat oleh layanan Supabase Auth menggunakan token aman **JSON Web Token (JWT)**. Token ini dikirimkan pada setiap header permintaan API klien untuk memvalidasi identitas pengguna secara asinkron.
* **Proteksi Tambahan Biometrik:** Pada platform aplikasi mobile (Android/iOS), pengguna disediakan opsi untuk mengaktifkan kunci keamanan lokal berupa pemindaian Sidik Jari (*Fingerprint*) atau pengenalan wajah (*Face ID*) melalui modul native perangkat sebelum diizinkan membuka data sensitif aplikasi.

## 2. Keamanan Tingkat Baris Basis Data (Row Level Security - RLS)
To mencegah kebocoran data antar-pengguna (*Cross-Tenant Data Leakage*), database PostgreSQL pada Supabase menerapkan **Row Level Security (RLS)** secara ketat pada tabel-tabel utama seperti `transactions`, `budgets`, dan `receipts`.

```sql
-- Contoh implementasi kebijakan RLS pada tabel transaksi
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna hanya dapat mengakses data miliknya sendiri"
ON transactions
FOR ALL
USING (auth.uid() = user_id);
```
*Dengan kebijakan ini, query apa pun dari sisi klien secara otomatis difilter di level database untuk hanya mengembalikan data yang memiliki kecocokan `user_id` dengan UUID dari token JWT pengguna.*

## 3. Integritas Data Keuangan (*Currency Accuracy & Timestamps*)
* **Fixed-Point Numeric Type:** Seluruh kolom yang menyimpan nilai nominal uang wajib didefinisikan menggunakan tipe data **`numeric`** khusus pada PostgreSQL, bukan tipe data *floating-point* (`float`/`double`). Hal ini mutlak diterapkan untuk menghindari kesalahan pembulatan desimal biner yang dapat menyebabkan selisih perhitungan keuangan pada akumulasi jangka panjang.
* **Server-Generated Timestamps:** Nilai kolom `created_at` dan `updated_at` di-generate secara otomatis oleh peladen database menggunakan fungsi internal server, mencegah manipulasi catatan waktu masa lalu oleh manipulasi jam dari perangkat lokal klien.

## 4. Keamanan Enkripsi Jaringan
* Seluruh transmisi data di atas jaringan wajib menggunakan enkripsi **HTTPS** dengan protokol minimal **TLS 1.3** guna menangkal serangan *Man-in-the-Middle (MitM)*.
