# NaFi (Navigator Financial) 🧭

NaFi adalah platform manajemen keuangan pribadi pintar (*smart personal financial management platform*) yang dirancang untuk mentransformasi cara individu mengelola dana harian. Dengan mengintegrasikan teknologi Kecerdasan Buatan (AI Vision & OCR) secara berlapis (*Multi-Agent*), NaFi mengotomatisasi pencatatan dari struk belanja fisik, menerapkan aturan anggaran terstruktur, serta menghasilkan laporan mutasi formal berstandar perbankan nasional.

## 🚀 Fitur Utama
* **AI Scanner (OCR via Gemini Vision):** Ekstraksi otomatis data dari foto struk belanja fisik kurang dari 3 detik.
* **Kategorisasi Cerdas Multi-level:** Pemetaan otomatis pos pengeluaran berdasarkan kaidah anggaran **60-20-20**.
* **E-Statement Profesional:** Pembuatan dokumen mutasi formal dalam bentuk PDF/Excel lengkap dengan kalkulasi *running balance* kronologis.
* **Arsitektur Database Syariah & RLS:** Keamanan tingkat tinggi menggunakan Supabase Auth, JWT, dan Row Level Security (RLS) di tingkat tabel PostgreSQL.

## 🛠️ Tech Stack
* **Frontend:** Next.js 14 (App Router) & React
* **Styling:** Tailwind CSS & Shadcn.UI
* **Backend:** Next.js API Routes & Supabase Edge Functions
* **Database:** Supabase PostgreSQL
* **Intelligence:** Google Gemini 2.5 Flash, Claude 3.5 Sonnet, & GPT-4o
* **Deployment:** Vercel & EAS (Expo Application Service)

## 📦 Struktur Berkas Dokumentasi
* `README.md` - Panduan umum dan gambaran besar aplikasi.
* `Architecture.md` - Detail arsitektur sistem dan visualisasi aliran data.
* `AI_Spec.md` - Spesifikasi teknis integrasi Multi-Agent AI (Gemini, Claude, GPT).
* `Business_Rules.md` - Aturan tata kelola alokasi dana, kategori, dan logika finansial.
* `Compliance.md` - Kepatuhan terhadap standar akuntansi, regulasi nasional, dan prinsip keterbukaan.
* `Security.md` - Kebijakan enkripsi, otentikasi, dan Row Level Security (RLS).
* `Dev_Guide.md` - Panduan instalasi lokal, standarisasi kode, dan alur kontribusi.
