# Developer & Technical Setup Guide — NaFi

Panduan ini ditujukan bagi tim pengembang untuk melakukan instalasi lingkungan pengembangan lokal, standarisasi penulisan kode, serta alur deployment aplikasi NaFi.

## 1. Persyaratan Sistem (Prerequisites)
* **Node.js:** Versi v18.x atau yang lebih baru (direkomendasikan v20.x LTS).
* **NPM / PNPM:** Package manager untuk instalasi dependensi.
* **Supabase CLI:** Untuk pengelolaan migrasi database lokal.

## 2. Langkah Instalasi Lokal (Local Installation Steps)
### 2.1 Kloning Repositori & Instalasi Dependensi
```bash
git clone https://github.com/username/nafi-platform.git
cd nafi-platform
npm install
```

### 2.2 Konfigurasi Environment Variables (`.env.local`)
Buat sebuah berkas berkode nama `.env.local` pada direktori akar proyek dan lengkapi variabel berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GEMINI_API_KEY=your-gemini-api-key
CLAUDE_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-api-key
```

### 2.3 Menjalankan Server Pengembangan lokal
```bash
# Untuk menjalankan mode web Next.js 14
npm run dev

# Untuk menjalankan mode aplikasi mobile via Expo
npm run android # atau npm run ios
```

## 3. Struktur Direktori Proyek
```
nafi-platform/
├── src/
│   ├── app/            # Next.js 14 App Router (Pages & API Routes)
│   ├── components/     # UI Components (Shadcn.UI, Lucide Icons)
│   ├── lib/            # Utility & Shared Services (Supabase Client, AI Orchestrator)
│   └── types/          # TypeScript Type Definitions
├── supabase/
│   ├── migrations/     # Database Migration Scripts (SQL)
│   └── config.toml     # Supabase Local Configuration
├── .env.local.example
└── README.md
```

## 4. Standar Pengodean & Alur Kontribusi
* **TypeScript Mandatory:** Seluruh kode baru wajib ditulis menggunakan TypeScript dengan pendefinisian tipe data yang eksplisit. Dilarang keras menggunakan tipe data `any`.
* **Linting & Formatting:** Jalankan perintah `npm run lint` sebelum melakukan *commit* kode untuk memastikan kepatuhan terhadap standarisasi format kode.
* **Alur Branching:** Setiap pengerjaan fitur baru wajib dibuat melalui percabangan khusus dengan format nama `feature/nama-fitur` sebelum diajukan ke branch utama via *Pull Request*.
