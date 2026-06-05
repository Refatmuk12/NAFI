import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import { ReceiptScanResult, Transaction } from '@/types/financial';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newReceipt: ReceiptScanResult | null;
  matchedTx: Transaction | null;
}

export default function DuplicateWarningModal({
  isOpen,
  onClose,
  onConfirm,
  newReceipt,
  matchedTx
}: DuplicateWarningModalProps) {
  if (!isOpen || !newReceipt || !matchedTx) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#091413]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-xs sm:max-w-sm overflow-hidden rounded-2xl bg-[#FFFDEB] border border-amber-600/40 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[#091413]">
        {/* Glowing warning line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        
        <div className="flex items-start gap-3 mt-1">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-800">
              Peringatan Duplikasi
            </h3>
            <p className="text-3xs text-slate-600 mt-0.5 leading-relaxed">
              Claude 3.5 Sonnet mendeteksi pencatatan dengan nilai dan merchant yang sama dalam rentang ±10 menit.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-[#091413] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Comparison Block */}
        <div className="mt-4 space-y-2 bg-[#FBE8CE]/60 p-3 rounded-xl border border-[#346739]/10">
          <div className="grid grid-cols-2 gap-3 text-3xs">
            {/* Existing */}
            <div className="border-r border-[#346739]/10 pr-2">
              <span className="font-extrabold text-[#346739]/80 block mb-0.5 uppercase tracking-wider">DATABASE</span>
              <div className="font-bold text-[#091413] truncate">{matchedTx.description}</div>
              <div className="text-slate-500 mt-0.5 font-mono">
                {new Date(matchedTx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-amber-800 font-extrabold mt-1 font-mono">
                IDR {Math.abs(matchedTx.amount).toLocaleString('id-ID')}
              </div>
            </div>

            {/* New */}
            <div className="pl-2">
              <span className="font-extrabold text-[#346739]/80 block mb-0.5 uppercase tracking-wider">STRUK BARU</span>
              <div className="font-bold text-[#091413] truncate">{newReceipt.merchantName}</div>
              <div className="text-slate-500 mt-0.5 font-mono">
                {new Date(newReceipt.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-amber-800 font-extrabold mt-1 font-mono">
                IDR {newReceipt.totalAmount.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          
          <div className="text-3xs text-amber-700 bg-amber-500/5 p-1 rounded border border-amber-500/10 text-center font-bold">
            Selisih waktu: {Math.round(Math.abs(new Date(matchedTx.date).getTime() - new Date(newReceipt.date).getTime()) / (1000 * 60))} menit
          </div>
        </div>

        {/* Warning Policy Alert */}
        <div className="mt-3.5 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20 text-3xs text-red-700 leading-normal font-medium">
          <strong>Regulasi Syariah NaFi:</strong> Kepatuhan sistem melarang pencatatan ganda untuk menjaga kejujuran saldo berjalan dan ketertelusuran laporan audit.
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-3xs transition-all border border-slate-300"
          >
            Batalkan
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-[#346739] hover:bg-[#284f2c] text-[#FFFDEB] font-bold text-3xs transition-all flex items-center justify-center gap-1 shadow-md shadow-[#346739]/10"
          >
            <Check className="h-3 w-3 stroke-[3]" />
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
