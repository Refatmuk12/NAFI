import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NaFi 🧭 Smart Personal Financial Management Platform",
  description: "NaFi adalah platform manajemen keuangan pribadi pintar berbasis Multi-Agent AI (Gemini OCR, Claude Rules, GPT-4o Advisory) untuk pencatatan otomatis struk belanja fisik, alokasi anggaran 60-20-20, dan pembuatan e-statement perbankan.",
  keywords: ["financial management", "personal finance", "AI OCR receipt scanner", "60-20-20 budget", "sharia compliance", "e-statement creator"],
  authors: [{ name: "NaFi Dev Team" }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
