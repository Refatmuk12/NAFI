import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Printer, Download, Calendar } from 'lucide-react';
import { Transaction } from '@/types/financial';

interface EStatementGeneratorProps {
  transactions: Transaction[];
  userName?: string;
  onDownload?: () => void;
}

export default function EStatementGenerator({ transactions, userName = 'REFAT MUKMIN' }: EStatementGeneratorProps) {
  // 1. Sort all transactions chronologically (ascending)
  const sortedTx = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);

  // 2. Extract unique months for selection (e.g. "Juni 2026", "Mei 2026")
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    sortedTx.forEach(tx => {
      const d = new Date(tx.date);
      if (!isNaN(d.getTime())) {
        const monthKey = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
        months.add(monthKey);
      }
    });
    
    // Default to current month if no transactions are available
    if (months.size === 0) {
      months.add(new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }));
    }
    
    return Array.from(months);
  }, [sortedTx]);

  // 3. State for selected month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return availableMonths.length > 0 ? availableMonths[availableMonths.length - 1] : '';
  });

  // Auto-set the latest month as default
  useEffect(() => {
    if (availableMonths.length > 0) {
      setTimeout(() => {
        setSelectedMonth(prev => {
          if (!prev || !availableMonths.includes(prev)) {
            return availableMonths[availableMonths.length - 1];
          }
          return prev;
        });
      }, 0);
    }
  }, [availableMonths]);

  // 4. Filter transactions for the selected month
  const filteredTx = useMemo(() => {
    if (!selectedMonth) return [];
    return sortedTx.filter(t => {
      const d = new Date(t.date);
      const mKey = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
      return mKey === selectedMonth;
    });
  }, [sortedTx, selectedMonth]);

  // 5. Calculate accounting balances for the selected month
  const initialBalance = useMemo(() => {
    if (filteredTx.length === 0) return 0;
    const firstTxOfSelectedMonth = filteredTx[0];
    const indexOfFirstTx = sortedTx.findIndex(t => t.id === firstTxOfSelectedMonth.id);
    
    if (indexOfFirstTx <= 0) {
      // First transaction of all time. Saldo awal is runningBalance - amount
      return firstTxOfSelectedMonth.runningBalance - firstTxOfSelectedMonth.amount;
    } else {
      // Saldo awal is the runningBalance of the previous transaction
      return sortedTx[indexOfFirstTx - 1].runningBalance;
    }
  }, [filteredTx, sortedTx]);

  const totalIncoming = useMemo(() => {
    return filteredTx.filter(t => t.type === 'incoming').reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTx]);

  const totalOutgoing = useMemo(() => {
    return filteredTx.filter(t => t.type === 'outgoing').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTx]);

  const closingBalance = useMemo(() => {
    if (filteredTx.length === 0) return initialBalance;
    return filteredTx[filteredTx.length - 1].runningBalance;
  }, [filteredTx, initialBalance]);

  // 6. Calculate dynamic period date range (e.g. 01 Jun 2026 - 30 Jun 2026)
  const periodText = useMemo(() => {
    if (filteredTx.length === 0) {
      return selectedMonth || 'N/A';
    }
    try {
      const sampleDate = new Date(filteredTx[0].date);
      const year = sampleDate.getFullYear();
      const month = sampleDate.getMonth(); // 0-indexed
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const formatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
      return `${firstDay.toLocaleDateString('id-ID', formatOptions)} - ${lastDay.toLocaleDateString('id-ID', formatOptions)}`;
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth, filteredTx]);

  // 7. Handlers for Exporting
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    // Structured Indonesian accounting CSV report
    const headers = ['NO', 'TANGGAL / DATE', 'KETERANGAN / REMARKS', 'DANA MASUK / INCOMING (IDR)', 'DANA KELUAR / OUTGOING (IDR)', 'SALDO / BALANCE (IDR)'];
    
    const summaryHeader = [
      ['LAPORAN MUTASI REKENING DIGITAL - NaFi'],
      ['Nama Pemilik / Name', userName],
      ['Nomor Rekening / Account', '1290013729625'],
      ['Periode Mutasi / Period', periodText],
      ['Tanggal Cetak / Printed On', new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })],
      [],
      ['REKAPITULASI MUTASI'],
      ['Saldo Awal / Initial Balance', initialBalance],
      ['Total Dana Masuk / Total Incoming', totalIncoming],
      ['Total Dana Keluar / Total Outgoing', totalOutgoing],
      ['Saldo Akhir / Closing Balance', closingBalance],
      [],
      headers
    ];

    const rows = filteredTx.map((tx, idx) => [
      idx + 1,
      new Date(tx.date).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      tx.description,
      tx.type === 'incoming' ? tx.amount : 0,
      tx.type === 'outgoing' ? Math.abs(tx.amount) : 0,
      tx.runningBalance
    ]);
    
    // Create BOM for UTF-8 Excel compatibility
    const csvContent = "\uFEFF" + [
      ...summaryHeader.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Mutasi_NaFi_${selectedMonth.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="organic-card rounded-xl p-4 bg-[#FBE8CE]/40 border border-[#346739]/15 flex flex-col h-full text-[#091413]">
      
      {/* Title block and buttons */}
      <div className="flex items-center justify-between mb-3.5 no-print">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#346739]/10 text-[#346739] border border-[#346739]/20">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-[#091413]">Mutasi Rekening</h3>
            <p className="text-[9px] text-slate-500">Laporan Keuangan RLS Terverifikasi</p>
          </div>
        </div>
        
        {/* Export Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[#346739]/10 hover:bg-[#346739]/20 text-[#346739] border border-[#346739]/15 text-[9px] font-extrabold transition-all cursor-pointer"
            title="Download Excel / CSV"
          >
            <Download className="h-2.5 w-2.5" />
            Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[#346739] hover:bg-[#284f2c] text-[#FFFDEB] text-[9px] font-extrabold transition-all shadow-md shadow-[#346739]/10 cursor-pointer"
            title="Cetak PDF Laporan"
          >
            <Printer className="h-2.5 w-2.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Monthly Selection Dropdown */}
      <div className="flex items-center gap-2 mb-3 bg-[#FFFDEB] px-2.5 py-1.5 rounded-lg border border-[#346739]/15 no-print">
        <Calendar className="h-3.5 w-3.5 text-[#346739]" />
        <span className="text-[9px] font-extrabold text-[#091413] tracking-wider uppercase">Pilih Periode Bulan:</span>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="flex-1 bg-transparent border-none text-[9px] font-extrabold text-[#346739] focus:outline-none cursor-pointer text-right"
        >
          {availableMonths.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* E-Statement Preview & Print Area */}
      <div 
        id="statement-print-area"
        className="flex-1 bg-white rounded-lg p-3.5 border border-slate-200 overflow-y-auto max-h-[260px] text-[8px] font-sans text-slate-800 shadow-inner"
      >
        {/* Green Bank Header Banner (Matches Theme) */}
        <div className="bg-[#346739] text-white p-3.5 flex justify-between items-center rounded-t-md mb-4 relative overflow-hidden">
          <div className="space-y-0.5 z-10">
            <h1 className="text-sm font-black italic tracking-wide text-white leading-none">E-STATEMENT</h1>
            <p className="text-[6px] font-bold tracking-widest text-[#FFFDEB]/80 uppercase leading-none">PLATFORM KEUANGAN CERDAS NAFI</p>
          </div>
          <div className="text-right space-y-0.5 z-10 max-w-[200px]">
            <h2 className="text-sm font-extrabold tracking-wider leading-none text-white">NAFI</h2>
            <p className="text-[5px] text-[#FFFDEB]/75 leading-tight font-medium font-sans">
              Menara NaFi 1 Jalan Jenderal Sudirman Kav. 54-55, Jakarta 12190, Indonesia
            </p>
          </div>
          {/* Subtle geometric overlay */}
          <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12 transform origin-top-right pointer-events-none" />
        </div>

        {/* Customer Details Block */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3 mb-4 text-slate-700">
          <table className="w-full text-left leading-relaxed">
            <tbody>
              <tr>
                <td className="font-extrabold text-[8px] py-0.5 w-[70px]">NAMA/NAME</td>
                <td className="py-0.5 w-[5px]">:</td>
                <td className="font-bold uppercase py-0.5 text-slate-900">{userName}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full text-left leading-relaxed">
            <tbody>
              <tr>
                <td className="font-extrabold text-[8px] py-0.5 w-[110px]">PERIODE/PERIOD</td>
                <td className="py-0.5 w-[5px]">:</td>
                <td className="font-bold py-0.5 text-slate-900">{periodText}</td>
              </tr>
              <tr>
                <td className="font-extrabold text-[8px] py-0.5">DICETAK PADA/ISSUED ON</td>
                <td className="py-0.5">:</td>
                <td className="font-bold py-0.5 text-slate-900">
                  {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Account Details & Recap */}
        <div className="grid grid-cols-2 gap-4 mb-4 items-start">
          {/* Left Column: Account Details */}
          <div>
            <h3 className="text-[10px] font-black text-[#346739] tracking-wide mb-1.5">TABUNGAN NOW IDR</h3>
            <table className="w-full text-left leading-relaxed text-slate-700">
              <tbody>
                <tr>
                  <td className="py-0.5 w-[85px] font-bold text-slate-500">Nomor Rekening</td>
                  <td className="py-0.5 w-[5px]">:</td>
                  <td className="py-0.5 font-bold text-slate-900 font-mono text-[9px]">1290013729625</td>
                </tr>
                <tr>
                  <td className="py-0.5 font-bold text-slate-500">Mata Uang</td>
                  <td className="py-0.5">:</td>
                  <td className="py-0.5 font-bold text-slate-900">IDR</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right Column: Dynamic Recap Box */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-normal text-slate-700">
            <table className="w-full text-[8px]">
              <tbody>
                <tr className="border-b border-slate-200/50">
                  <td className="py-1 font-bold text-slate-500">Saldo Awal / <span className="italic">Initial Balance</span></td>
                  <td className="py-1 text-right font-bold text-slate-950">
                    {initialBalance.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-b border-slate-200/50">
                  <td className="py-1 font-bold text-emerald-700">Dana Masuk / <span className="italic">Incoming</span></td>
                  <td className="py-1 text-right font-bold text-emerald-600">
                    {totalIncoming.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-b border-slate-200/50">
                  <td className="py-1 font-bold text-rose-700">Dana Keluar / <span className="italic">Outgoing</span></td>
                  <td className="py-1 text-right font-bold text-rose-600">
                    {totalOutgoing.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="text-slate-950 font-black text-[9px]">
                  <td className="py-1.5 font-black text-[#346739]">Saldo Akhir / <span className="italic">Closing Balance</span></td>
                  <td className="py-1.5 text-right text-[#346739]">
                    {closingBalance.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Chronological mutation ledger table */}
        <div className="border border-slate-200 rounded overflow-hidden">
          <table className="w-full text-left border-collapse text-[7px] leading-relaxed">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-1.5 w-6 text-center">NO</th>
                <th className="p-1.5 w-14">TANGGAL<br /><span className="text-[6px] italic font-normal text-slate-500">DATE</span></th>
                <th className="p-1.5">KETERANGAN<br /><span className="text-[6px] italic font-normal text-slate-500">REMARKS</span></th>
                <th className="p-1.5 text-right w-24">DANA MASUK (IDR)<br /><span className="text-[6px] italic font-normal text-slate-500">INCOMING TRANSACTIONS (IDR)</span></th>
                <th className="p-1.5 text-right w-24">DANA KELUAR (IDR)<br /><span className="text-[6px] italic font-normal text-slate-500">OUTGOING TRANSACTIONS (IDR)</span></th>
                <th className="p-1.5 text-right w-24">SALDO (IDR)<br /><span className="text-[6px] italic font-normal text-slate-500">BALANCE (IDR)</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400 font-sans italic">
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 text-slate-900">
                    <td className="p-1.5 text-center text-slate-400 font-sans">{idx + 1}</td>
                    <td className="p-1.5 whitespace-nowrap text-slate-600">
                      {new Date(tx.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </td>
                    <td className="p-1.5 font-sans break-words max-w-[120px] font-medium">{tx.description}</td>
                    <td className="p-1.5 text-right text-emerald-700 font-bold">
                      {tx.type === 'incoming' 
                        ? tx.amount.toLocaleString('id-ID', { minimumFractionDigits: 2 }) 
                        : '-'}
                    </td>
                    <td className="p-1.5 text-right text-rose-700 font-bold">
                      {tx.type === 'outgoing' 
                        ? Math.abs(tx.amount).toLocaleString('id-ID', { minimumFractionDigits: 2 }) 
                        : '-'}
                    </td>
                    <td className="p-1.5 text-right font-black text-slate-800">
                      {tx.runningBalance.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footnote stamp */}
        <div className="mt-4 pt-2 border-t border-slate-100 text-[6px] text-slate-400 text-center flex items-center justify-between font-sans">
          <span>🧭 Dokumen digital ini diterbitkan secara otomatis oleh sistem NaFi.</span>
          <span className="font-semibold text-slate-500 uppercase tracking-wide">STATUS: TERVERIFIKASI RLS (POSTGRESQL)</span>
        </div>

      </div>
      
      <div className="mt-2.5 p-2 bg-[#346739]/5 rounded border border-[#346739]/10 text-[9px] text-[#346739] leading-relaxed text-center font-bold no-print">
        🔒 Laporan mutasi tervalidasi menggunakan Row Level Security (RLS) PostgreSQL.
      </div>
    </div>
  );
}
