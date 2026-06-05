import React from 'react';
import { FileText, Printer, User, CreditCard, Download } from 'lucide-react';
import { Transaction } from '@/types/financial';

interface EStatementGeneratorProps {
  transactions: Transaction[];
  onDownload: () => void;
}

export default function EStatementGenerator({ transactions, onDownload }: EStatementGeneratorProps) {
  // Compute statement values
  const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const initialBalance = sortedTx.length > 0 ? sortedTx[0].runningBalance - (sortedTx[0].amount > 0 ? sortedTx[0].amount : 0) : 0;
  const totalIncoming = transactions.filter(t => t.type === 'incoming').reduce((sum, t) => sum + t.amount, 0);
  const totalOutgoing = transactions.filter(t => t.type === 'outgoing').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const closingBalance = sortedTx.length > 0 ? sortedTx[sortedTx.length - 1].runningBalance : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    // Generate CSV data matching Indonesian accounting format (comma separator)
    const headers = ['Tanggal', 'Keterangan', 'Alokasi', 'Kategori', 'Debit (Masuk)', 'Kredit (Keluar)', 'Saldo Berjalan'];
    const rows = sortedTx.map(tx => [
      new Date(tx.date).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      tx.description,
      tx.allocation || '-',
      tx.category,
      tx.type === 'incoming' ? tx.amount : 0,
      tx.type === 'outgoing' ? Math.abs(tx.amount) : 0,
      tx.runningBalance
    ]);
    
    // Create BOM for Excel UTF-8 support
    const csvContent = "\uFEFF" + [
      headers.join(','), 
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Mutasi_NaFi_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="organic-card rounded-xl p-4 bg-[#FBE8CE]/40 border border-[#346739]/15 flex flex-col h-full text-[#091413]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#346739]/10 text-[#346739] border border-[#346739]/20">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-[#091413]">Unduh Mutasi Rekening</h3>
            <p className="text-[9px] text-slate-500">Laporan formal terverifikasi RLS</p>
          </div>
        </div>
        
        {/* Export Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#346739]/10 hover:bg-[#346739]/20 text-[#346739] border border-[#346739]/15 text-[9px] font-bold transition-all cursor-pointer"
            title="Download CSV / Excel"
          >
            <Download className="h-2.5 w-2.5" />
            Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#346739] hover:bg-[#284f2c] text-[#FFFDEB] text-[9px] font-bold transition-all shadow-md shadow-[#346739]/10 cursor-pointer"
            title="Print PDF"
          >
            <Printer className="h-2.5 w-2.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Statement Preview Container */}
      <div className="flex-1 bg-[#FFFDEB] rounded-lg p-3 border border-[#346739]/15 overflow-y-auto max-h-[200px] text-[10px] font-mono text-[#091413] print:bg-white print:text-black">
        {/* Bank Header Logo */}
        <div className="flex justify-between items-start border-b border-[#346739]/20 pb-3 mb-3 print:border-slate-800">
          <div>
            <h4 className="text-xs font-black text-[#346739] tracking-wider flex items-center gap-1.5">
              🧭 NaFi
            </h4>
            <span className="text-[8px] text-slate-500 block mt-0.5">NAVIGATOR FINANCIAL SERVICES</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-[#091413] block">MUTASI REKENING</span>
            <span className="text-[8px] text-slate-500">Periode: Juni 2026</span>
          </div>
        </div>

        {/* Account Details Info */}
        <div className="grid grid-cols-2 gap-2 mb-3 bg-[#FBE8CE]/50 p-2 rounded border border-[#346739]/10 print:bg-slate-100 print:text-slate-900 print:border-slate-300">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-slate-500 text-[8px]">
              <User className="h-2.5 w-2.5" />
              <span>Pemilik Akun:</span>
            </div>
            <div className="font-bold text-[#091413] uppercase">REFAT MUKMIN</div>
            <div className="flex items-center gap-1 text-slate-500 text-[8px] mt-1.5">
              <CreditCard className="h-2.5 w-2.5" />
              <span>Nomor Akun:</span>
            </div>
            <div className="font-bold text-[#091413] font-mono">NF-9087-1123-22</div>
          </div>
          <div className="space-y-0.5 text-right">
            <div className="text-slate-500 text-[8px]">Valuta Rekening:</div>
            <div className="font-bold text-[#091413]">Rupiah (IDR)</div>
            <div className="text-slate-500 text-[8px] mt-1.5">Tanggal Cetak:</div>
            <div className="font-bold text-[#091413]">
              {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Rekapitulasi Saldo */}
        <div className="mb-3 border border-[#346739]/15 rounded overflow-hidden print:border-slate-800">
          <div className="bg-[#346739] px-2 py-1 font-bold text-[#FFFDEB] text-[8px] tracking-wider">
            REKAPITULASI SALDO REKENING
          </div>
          <div className="grid grid-cols-4 divide-x divide-[#346739]/15 text-center text-[9px]">
            <div className="p-1">
              <span className="text-[8px] text-slate-500 block">AWAL</span>
              <span className="font-bold text-[#091413] mt-0.5 block">
                {initialBalance.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-1">
              <span className="text-[8px] text-emerald-800 block">MASUK</span>
              <span className="font-bold text-emerald-700 mt-0.5 block">
                {totalIncoming.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-1">
              <span className="text-[8px] text-rose-800 block">KELUAR</span>
              <span className="font-bold text-rose-700 mt-0.5 block">
                {totalOutgoing.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-1">
              <span className="text-[8px] text-[#346739] block">AKHIR</span>
              <span className="font-bold text-[#346739] mt-0.5 block">
                {closingBalance.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Detail Lines */}
        <div className="border border-[#346739]/15 rounded overflow-hidden print:border-slate-800">
          <table className="w-full text-left border-collapse text-[8px]">
            <thead>
              <tr className="bg-[#FBE8CE]/50 border-b border-[#346739]/15 text-slate-600 print:bg-slate-200 print:text-black">
                <th className="p-1.5">TANGGAL</th>
                <th className="p-1.5">KETERANGAN</th>
                <th className="p-1.5 text-right">MUTASI D/K</th>
                <th className="p-1.5 text-right">SALDO AKHIR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#346739]/10">
              {sortedTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-100">
                  <td className="p-1.5 whitespace-nowrap text-slate-500">
                    {new Date(tx.date).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-1.5 max-w-[100px] truncate">{tx.description}</td>
                  <td className={`p-1.5 text-right font-bold ${tx.type === 'incoming' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {tx.type === 'incoming' ? '+' : '-'} {Math.abs(tx.amount).toLocaleString('id-ID')}
                  </td>
                  <td className="p-1.5 text-right font-bold text-[#346739]">
                    {tx.runningBalance.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-2.5 p-2 bg-[#346739]/5 rounded border border-[#346739]/10 text-[9px] text-[#346739] leading-relaxed text-center font-semibold">
        🔒 Laporan mutasi tervalidasi menggunakan Row Level Security (RLS) PostgreSQL.
      </div>
    </div>
  );
}
