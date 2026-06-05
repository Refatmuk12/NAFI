# System Architecture — NaFi

Dokumen ini menjelaskan arsitektur sistem global dan aliran data dari platform NaFi (Navigator Financial).

## 1. Arsitektur Komponen Tinggi (High-Level Component Architecture)
Platform NaFi dibangun menggunakan pola arsitektur decoupled yang memisahkan klien front-end (web dan mobile) dengan back-end serverless yang didukung oleh Supabase.

```
+-------------------------------------------------------+
|                    CLIENT LAYER                       |
|   +--------------------------+    +---------------+   |
|   |  Next.js 14 Web (Vercel) |    | Mobile (Expo) |   |
|   +--------------------------+    +---------------+   |
+---------------------------┬────────────────-----------+
                            │
                            │ HTTPS / JWT
                            ▼
+-------------------------------------------------------+
|                    GATEWAY & API                      |
|            +------------------------------+           |
|            |    Next.js API Routes /      |           |
|            |    Supabase Edge Functions   |           |
|            +--------------┬---------------+           |
+---------------------------┼────────────────-----------+
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
+--------------------------+  +-------------------------+
|      DATABASE LAYER      |  |    INTELLIGENCE LAYER   |
|  +--------------------+  |  |  +--------------------+ |
|  |Supabase PostgreSQL |  |  |  | Multi-Agent AI API | |
|  |  - Row Level Sec   |  |  |  | (Gemini/Claude/GPT)| |
|  |  - Numeric Type    |  |  |  +--------------------+ |
|  +--------------------+  |  +-------------------------+
+--------------------------+
```

## 2. Aliran Data Pemindaian Struk (Receipt Processing Data Flow)
1. **Input:** Pengguna mengambil foto struk melalui Mobile App / Web Interface.
2. **Upload:** Gambar dikirimkan secara aman melalui HTTPS menuju API Endpoint.
3. **Orkestrasi AI:** API meneruskan gambar ke *Intelligence Layer* secara sekuensial (Gemini -> Claude -> GPT).
4. **Persistensi:** Data transaksi yang telah bersih dan dikategorikan disimpan ke Supabase PostgreSQL.
5. **Sinkronisasi:** Hasil disimpan dan langsung merefleksikan perubahan pada visualisasi dasbor klien secara real-time.

## 3. Komponen Infrastruktur
* **Vercel:** Menangani hosting aplikasi web Next.js 14 dengan optimasi caching di lapisan edge.
* **Supabase PostgreSQL:** Menyediakan engine basis data relasional dengan dukungan Row Level Security (RLS) bawaan untuk mencegah kebocoran data antar-pengguna.
* **Expo Application Service (EAS):** Digunakan untuk mengelola build, bundling, dan distribusi aplikasi mobile lintas platform Android & iOS.
