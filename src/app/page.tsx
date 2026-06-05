'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Database, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  Scan, 
  Sparkles, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  Cpu,
  FileCheck2,
  Trash2,
  Lock,
  Mail,
  User,
  LogOut,
  Calendar,
  Layers,
  ChevronRight,
  UserCheck,
  TrendingUp,
  FileText,
  Clock,
  MapPin
} from 'lucide-react';

import { Transaction, ReceiptScanResult, AllocationType } from '@/types/financial';
import { INITIAL_TRANSACTIONS, MOCK_RECEIPT_TEMPLATES, MockReceiptTemplate } from '@/lib/mockData';
import { simulateMultiAgentPipeline } from '@/lib/aiOrchestrator';
import DuplicateWarningModal from '@/components/DuplicateWarningModal';
import EStatementGenerator from '@/components/EStatementGenerator';
import MobileSimulatorFrame from '@/components/MobileSimulatorFrame';

export default function HomePage() {
  // Mobile Simulator mode
  const [isWideView, setIsWideView] = useState(false);

  // Authentication State
  const [authStatus, setAuthStatus] = useState<'login' | 'register' | 'authenticated'>('login');
  const [registeredUsers, setRegisteredUsers] = useState([
    { name: 'Refat Mukmin', email: 'refat@nafi.com', password: 'password123' }
  ]);
  const [authEmail, setAuthEmail] = useState('refat@nafi.com');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  // Financial Data State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | AllocationType>('all');
  
  // Mobile Tab State: 'dashboard' | 'scan' | 'ledger' | 'account'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'ledger' | 'account'>('dashboard');

  // AI Pipeline Simulation State
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>(MOCK_RECEIPT_TEMPLATES[0].id);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<'idle' | 'gemini' | 'claude' | 'gpt' | 'completed'>('idle');
  const [scanResult, setScanResult] = useState<{
    scanData: ReceiptScanResult;
    isDuplicate: boolean;
    allocation: AllocationType;
    category: string;
    gptAdvice: string;
  } | null>(null);

  // Manual Transaction Form State
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualDesc, setManualDesc] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualAllocation, setManualAllocation] = useState<AllocationType>('primer');
  const [manualCategory, setManualCategory] = useState('');

  // Duplicate Warning Modal State
  const [isDupModalOpen, setIsDupModalOpen] = useState(false);
  const [matchedTx, setMatchedTx] = useState<Transaction | null>(null);

  // Personal Financial AI Advisor Message
  const [currentAdvice, setCurrentAdvice] = useState<string>(
    'NaFi AI Advisor siap membantu. Hubungkan struk belanja atau catat transaksi Anda untuk menerima saran alokasi dana syariah yang optimal.'
  );

  // Sholat Reminder State
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [nextPrayerCountdown, setNextPrayerCountdown] = useState<string>('');
  const [nextPrayerName, setNextPrayerName] = useState<string>('');

  // Recalculate running balance and verify chronological audit trail
  useEffect(() => {
    let balance = 0;
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const updated = sorted.map(tx => {
      balance += tx.amount;
      return { ...tx, runningBalance: balance };
    });
    
    const hasChanged = JSON.stringify(updated) !== JSON.stringify(transactions);
    if (hasChanged) {
      setTransactions(updated);
    }
  }, [transactions]);

  // Sholat Clock Timer & Countdown Effect
  useEffect(() => {
    setCurrentDateTime(new Date());

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(now);

      const PRAYER_TIMES = [
        { name: 'Subuh', time: '04:38' },
        { name: 'Dzuhur', time: '11:54' },
        { name: 'Ashar', time: '15:14' },
        { name: 'Maghrib', time: '17:50' },
        { name: 'Isya', time: '19:02' }
      ];

      // Find next prayer
      let nextP: { name: string; time: string } | null = null;
      let nextPDate: Date | null = null;

      for (const p of PRAYER_TIMES) {
        const [h, m] = p.time.split(':').map(Number);
        const pDate = new Date(now);
        pDate.setHours(h, m, 0, 0);

        if (pDate > now) {
          nextP = p;
          nextPDate = pDate;
          break;
        }
      }

      // If no prayer is found today, next is Subuh tomorrow
      if (!nextP) {
        nextP = PRAYER_TIMES[0];
        const pDate = new Date(now);
        pDate.setDate(pDate.getDate() + 1);
        const [h, m] = nextP.time.split(':').map(Number);
        pDate.setHours(h, m, 0, 0);
        nextPDate = pDate;
      }

      if (nextP && nextPDate) {
        setNextPrayerName(nextP.name);

        const diffMs = nextPDate.getTime() - now.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

        const timeStr = `${diffHrs > 0 ? `${diffHrs}j ` : ''}${diffMins}m ${diffSecs}d`;
        setNextPrayerCountdown(timeStr);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auth Handling
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const user = registeredUsers.find(
      u => u.email.toLowerCase() === authEmail.toLowerCase() && u.password === authPassword
    );

    if (user) {
      setCurrentUser({ name: user.name, email: user.email });
      setAuthStatus('authenticated');
      setActiveTab('dashboard');
    } else {
      setAuthError('Email atau sandi tidak cocok. Silakan coba lagi.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authName || !authEmail || !authPassword) {
      setAuthError('Mohon isi seluruh data.');
      return;
    }

    const emailExists = registeredUsers.some(u => u.email.toLowerCase() === authEmail.toLowerCase());
    if (emailExists) {
      setAuthError('Email sudah terdaftar.');
      return;
    }

    // Add new user credentials
    const newUser = { name: authName, email: authEmail, password: authPassword };
    setRegisteredUsers(prev => [...prev, newUser]);
    
    // Auto-login or redirect
    setCurrentUser({ name: newUser.name, email: newUser.email });
    setAuthStatus('authenticated');
    setActiveTab('dashboard');
    
    // Clear registration fields
    setAuthName('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthStatus('login');
  };

  // Financial Statistics
  const totalBalance = transactions.length > 0 ? transactions[transactions.length - 1].runningBalance : 0;
  const totalIncome = transactions.filter(t => t.type === 'incoming').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'outgoing').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const expensesByAllocation = {
    primer: transactions.filter(t => t.allocation === 'primer').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    sekunder: transactions.filter(t => t.allocation === 'sekunder').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    investasi: transactions.filter(t => t.allocation === 'investasi').reduce((sum, t) => sum + Math.abs(t.amount), 0),
  };

  const expensePercentages = {
    primer: totalExpenses > 0 ? Math.round((expensesByAllocation.primer / totalExpenses) * 100) : 0,
    sekunder: totalExpenses > 0 ? Math.round((expensesByAllocation.sekunder / totalExpenses) * 100) : 0,
    investasi: totalExpenses > 0 ? Math.round((expensesByAllocation.investasi / totalExpenses) * 100) : 0,
  };

  const getSelectedReceipt = (): MockReceiptTemplate | undefined => {
    return MOCK_RECEIPT_TEMPLATES.find(r => r.id === selectedReceiptId);
  };

  // Multi-Agent OCR Scan Simulation
  const handleStartScan = async () => {
    const receipt = MOCK_RECEIPT_TEMPLATES.find(r => r.id === selectedReceiptId);
    if (!receipt) return;

    setIsScanning(true);
    setScanLogs([]);
    setScanResult(null);
    setActiveStep('idle');

    try {
      const result = await simulateMultiAgentPipeline(
        receipt.data,
        transactions,
        (event) => {
          setActiveStep(event.step);
          setScanLogs(event.logs);
        }
      );

      setScanResult(result);
      setCurrentAdvice(result.gptAdvice);
    } catch (err) {
      console.error(err);
      setActiveStep('idle');
      setIsScanning(false);
    }
  };

  const handleSaveTransaction = () => {
    if (!scanResult) return;

    if (scanResult.isDuplicate) {
      const receiptTime = new Date(scanResult.scanData.date).getTime();
      const match = transactions.find((tx) => {
        const txTime = new Date(tx.date).getTime();
        const timeDiffMins = Math.abs(txTime - receiptTime) / (1000 * 60);
        const sameAmount = Math.abs(tx.amount) === scanResult.scanData.totalAmount;
        const sameMerchant = tx.description.toLowerCase().includes(scanResult.scanData.merchantName.toLowerCase()) || 
                             scanResult.scanData.merchantName.toLowerCase().includes(tx.description.toLowerCase());
        return timeDiffMins <= 10 && sameAmount && sameMerchant;
      });

      if (match) {
        setMatchedTx(match);
        setIsDupModalOpen(true);
        return;
      }
    }

    commitTransaction();
  };

  const commitTransaction = () => {
    if (!scanResult) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: scanResult.scanData.date,
      description: scanResult.scanData.merchantName,
      amount: -scanResult.scanData.totalAmount,
      type: 'outgoing',
      allocation: scanResult.allocation,
      category: scanResult.category,
      runningBalance: 0
    };

    setTransactions(prev => [...prev, newTx]);
    setScanResult(null);
    setActiveStep('idle');
    setIsScanning(false);
    setIsDupModalOpen(false);
    setActiveTab('dashboard'); // Direct user back to dashboard to see results
  };

  const handleAddManualTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDesc || !manualAmount) return;

    const parsedAmount = parseFloat(manualAmount);
    if (isNaN(parsedAmount)) return;

    const isIncoming = parsedAmount > 0;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      description: manualDesc,
      amount: isIncoming ? parsedAmount : -Math.abs(parsedAmount),
      type: isIncoming ? 'incoming' : 'outgoing',
      allocation: isIncoming ? null : manualAllocation,
      category: manualCategory || (isIncoming ? 'Pendapatan' : 'Manual'),
      runningBalance: 0
    };

    setTransactions(prev => [...prev, newTx]);
    
    setManualDesc('');
    setManualAmount('');
    setManualCategory('');
    setShowAddManual(false);

    if (!isIncoming) {
      setCurrentAdvice(
        `Catatan manual "${manualDesc}" tersimpan. Alokasi diatur sebagai ${manualAllocation.toUpperCase()} sebesar IDR ${parsedAmount.toLocaleString('id-ID')}.`
      );
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Filter & Search ledger
  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || t.allocation === selectedFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Render the phone mockup child screens based on authStatus & activeTab
  const renderMobileContent = () => {
    
    // GUEST FLOW - LOGIN SCREEN
    if (authStatus === 'login') {
      return (
        <div className="flex-1 flex flex-col justify-center px-6 py-10 bg-[#FFFDEB] animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 rounded-xl bg-[#346739] flex items-center justify-center shadow-md">
              <Compass className="h-6 w-6 text-[#FFFDEB]" />
            </div>
            <h2 className="text-xl font-extrabold text-[#091413] mt-3">Masuk Ke NaFi</h2>
            <p className="text-3xs text-slate-500 tracking-wide mt-1">SMART PERSONAL FINANCIAL MANAGEMENT</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-3xs text-red-700 font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-3xs font-extrabold text-[#091413] uppercase tracking-wider">EMAIL PENGGUNA</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#091413]/40" />
                <input 
                  type="email" 
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#FBE8CE]/50 border border-[#346739]/20 rounded-xl text-xs text-[#091413] placeholder-slate-400 focus:outline-none focus:border-[#346739] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-3xs font-extrabold text-[#091413] uppercase tracking-wider">KATA SANDI</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#091413]/40" />
                <input 
                  type="password" 
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-[#FBE8CE]/50 border border-[#346739]/20 rounded-xl text-xs text-[#091413] focus:outline-none focus:border-[#346739] transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 rounded-xl bg-[#346739] text-[#FFFDEB] font-bold text-xs shadow-md shadow-[#346739]/20 hover:bg-[#284f2c] transition-colors cursor-pointer"
            >
              Masuk Akun
            </button>
          </form>

          <div className="mt-8 text-center text-3xs text-slate-500">
            Belum punya akun?{' '}
            <button 
              onClick={() => {
                setAuthStatus('register');
                setAuthError('');
              }}
              className="font-bold text-[#346739] hover:underline"
            >
              Daftar Sekarang
            </button>
          </div>
        </div>
      );
    }

    // GUEST FLOW - REGISTRATION SCREEN
    if (authStatus === 'register') {
      return (
        <div className="flex-1 flex flex-col justify-center px-6 py-10 bg-[#FFFDEB] animate-in fade-in duration-300">
          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-[#091413]">Daftar Akun Baru</h2>
            <p className="text-3xs text-slate-500 tracking-wide mt-1">Mulai kelola dana cerdas syariah</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-3.5">
            {authError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-3xs text-red-700 font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-3xs font-extrabold text-[#091413] uppercase tracking-wider">NAMA LENGKAP</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-[#091413]/40" />
                <input 
                  type="text" 
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  className="w-full pl-9 pr-3 py-2 bg-[#FBE8CE]/50 border border-[#346739]/20 rounded-xl text-xs text-[#091413] placeholder-slate-400 focus:outline-none focus:border-[#346739] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-3xs font-extrabold text-[#091413] uppercase tracking-wider">ALAMAT EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#091413]/40" />
                <input 
                  type="email" 
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#FBE8CE]/50 border border-[#346739]/20 rounded-xl text-xs text-[#091413] placeholder-slate-400 focus:outline-none focus:border-[#346739] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-3xs font-extrabold text-[#091413] uppercase tracking-wider">KATA SANDI BARU</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#091413]/40" />
                <input 
                  type="password" 
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Min. 6 Karakter"
                  className="w-full pl-9 pr-3 py-2 bg-[#FBE8CE]/50 border border-[#346739]/20 rounded-xl text-xs text-[#091413] focus:outline-none focus:border-[#346739] transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 rounded-xl bg-[#346739] text-[#FFFDEB] font-bold text-xs shadow-md shadow-[#346739]/20 hover:bg-[#284f2c] transition-colors cursor-pointer mt-2"
            >
              Registrasi Akun
            </button>
          </form>

          <div className="mt-6 text-center text-3xs text-slate-500">
            Sudah punya akun?{' '}
            <button 
              onClick={() => {
                setAuthStatus('login');
                setAuthError('');
              }}
              className="font-bold text-[#346739] hover:underline"
            >
              Masuk Disini
            </button>
          </div>
        </div>
      );
    }

    // AUTHENTICATED TABS SYSTEM
    return (
      <div className="flex-1 flex flex-col h-full bg-[#FFFDEB] text-[#091413]">
        
        {/* MOBILE APP BAR */}
        <div className="px-4 py-3 bg-[#FBE8CE] border-b border-[#346739]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4.5 w-4.5 text-[#346739] animate-spin-slow" />
            <span className="font-extrabold text-sm tracking-wide text-[#346739]">NaFi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-3xs font-bold text-[#346739]/80 bg-[#346739]/5 px-2 py-0.5 rounded border border-[#346739]/15">
              Secure RLS
            </span>
          </div>
        </div>

        {/* TAB CONTENTS CONTAINER */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Saldo Utama Card */}
              <div className="organic-card rounded-2xl p-4 relative overflow-hidden bg-gradient-to-br from-[#FBE8CE] to-[#FFFDEB] border border-[#346739]/20">
                <span className="text-3xs text-[#346739] font-bold block">SALDO BERJALAN</span>
                <h3 className="text-xl font-black mt-1 text-[#091413]">
                  IDR {totalBalance.toLocaleString('id-ID')}
                </h3>
                <div className="mt-3 flex items-center justify-between text-3xs border-t border-[#346739]/10 pt-2 text-[#091413]/70 font-semibold">
                  <span className="flex items-center gap-0.5 text-emerald-700">
                    <ArrowUpRight className="h-3 w-3" />
                    +{totalIncome.toLocaleString('id-ID')}
                  </span>
                  <span className="flex items-center gap-0.5 text-rose-700">
                    <ArrowDownLeft className="h-3 w-3" />
                    -{totalExpenses.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Jadwal Sholat Widget */}
              <div className="organic-card rounded-2xl p-4 bg-[#FBE8CE]/60 border border-[#346739]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#346739]">
                    <Clock className="h-4 w-4" />
                    <span className="text-3xs font-black uppercase tracking-wider">JADWAL SHOLAT & REMINDER</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-[#091413]/70 font-semibold">
                    <MapPin className="h-3 w-3 text-[#346739]" />
                    <span>Depok, Jabar</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-[#FFFDEB] p-3 rounded-xl border border-[#346739]/10">
                  <div className="space-y-0.5">
                    <div className="text-2xs font-bold text-slate-500">WAKTU SEKARANG</div>
                    <div className="text-xl font-extrabold text-[#091413] tracking-tight font-mono">
                      {currentDateTime ? currentDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-3xs font-extrabold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block border border-amber-500/20">
                      NEXT: {nextPrayerName}
                    </div>
                    <div className="text-xs font-black text-[#346739] tracking-tight font-mono">
                      {nextPrayerCountdown ? `-${nextPrayerCountdown}` : '--'}
                    </div>
                  </div>
                </div>

                {/* Horizontal Prayer Times Grid */}
                <div className="grid grid-cols-5 gap-1 text-center font-mono">
                  {[
                    { name: 'Subuh', time: '04:38' },
                    { name: 'Dzuhur', time: '11:54' },
                    { name: 'Ashar', time: '15:14' },
                    { name: 'Maghrib', time: '17:50' },
                    { name: 'Isya', time: '19:02' }
                  ].map((p) => {
                    const isNext = p.name === nextPrayerName;
                    return (
                      <div 
                        key={p.name} 
                        className={`p-1.5 rounded-lg border transition-all ${
                          isNext 
                            ? 'bg-[#346739] text-[#FFFDEB] border-[#346739] font-bold shadow-md shadow-[#346739]/10 scale-105' 
                            : 'bg-[#FFFDEB] text-[#091413]/60 border-[#346739]/10 text-3xs font-semibold'
                        }`}
                      >
                        <div className="text-[8px] uppercase tracking-wider block opacity-80">{p.name}</div>
                        <div className="text-[10px] font-bold mt-0.5">{p.time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 60-20-20 Budget Allocations */}
              <div className="space-y-2">
                <span className="text-3xs font-extrabold text-[#091413] tracking-wider block">ALOKASI ANGGARAN (60-20-25)</span>
                
                {/* Pos Primer */}
                <div className="organic-card rounded-xl p-3 bg-white/40 space-y-1">
                  <div className="flex justify-between text-3xs font-extrabold">
                    <span className="text-[#346739]">PRIMER (Wajib 60%)</span>
                    <span>{expensePercentages.primer}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${expensePercentages.primer > 60 ? 'bg-rose-500' : 'bg-[#346739]'}`}
                      style={{ width: `${Math.min(expensePercentages.primer, 100)}%` }}
                    />
                  </div>
                  <div className="text-3xs text-slate-500 font-semibold text-right">
                    IDR {expensesByAllocation.primer.toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Pos Sekunder */}
                <div className="organic-card rounded-xl p-3 bg-white/40 space-y-1">
                  <div className="flex justify-between text-3xs font-extrabold">
                    <span className="text-purple-800">SEKUNDER (Gaya Hidup 20%)</span>
                    <span>{expensePercentages.sekunder}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${expensePercentages.sekunder > 20 ? 'bg-rose-500' : 'bg-purple-700'}`}
                      style={{ width: `${Math.min(expensePercentages.sekunder, 100)}%` }}
                    />
                  </div>
                  <div className="text-3xs text-slate-500 font-semibold text-right">
                    IDR {expensesByAllocation.sekunder.toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Pos Investasi */}
                <div className="organic-card rounded-xl p-3 bg-white/40 space-y-1">
                  <div className="flex justify-between text-3xs font-extrabold">
                    <span className="text-emerald-800">INVESTASI & ASET (20%)</span>
                    <span>{expensePercentages.investasi}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.min(expensePercentages.investasi, 100)}%` }}
                    />
                  </div>
                  <div className="text-3xs text-slate-500 font-semibold text-right">
                    IDR {expensesByAllocation.investasi.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Advisory Board */}
              <div className="organic-card rounded-xl p-3.5 bg-gradient-to-tr from-[#FBE8CE]/80 to-[#FFFDEB] border border-[#346739]/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <Sparkles className="h-10 w-10 text-[#346739]" />
                </div>
                <div className="flex items-center gap-1.5 mb-1.5 text-[#346739]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-3xs font-black uppercase tracking-wider">GPT-4o Advice</span>
                </div>
                <p className="text-2xs text-[#091413] leading-relaxed font-semibold italic">
                  "{currentAdvice}"
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: AI SCANNER VIEW */}
          {activeTab === 'scan' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="organic-card rounded-xl p-4 bg-[#FBE8CE]/50 space-y-3">
                
                <div>
                  <label className="text-3xs font-extrabold text-[#091413] uppercase block mb-1">Draf Resi Belanja</label>
                  <select 
                    value={selectedReceiptId}
                    onChange={(e) => {
                      setSelectedReceiptId(e.target.value);
                      setScanResult(null);
                      setActiveStep('idle');
                    }}
                    disabled={isScanning}
                    className="w-full px-2 py-1.5 bg-[#FFFDEB] border border-[#346739]/20 rounded-lg text-xs font-semibold text-[#091413]"
                  >
                    {MOCK_RECEIPT_TEMPLATES.map((rc) => (
                      <option key={rc.id} value={rc.id}>{rc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Simulated screen box */}
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#346739]/15 bg-slate-900 flex items-center justify-center">
                  <img 
                    src={getSelectedReceipt()?.imageUrl} 
                    alt="Scan Receipt"
                    className="absolute inset-0 w-full h-full object-cover opacity-60" 
                  />

                  {/* Scanning Animation lines in Green theme */}
                  {isScanning && activeStep === 'gemini' && (
                    <>
                      <div className="absolute left-0 right-0 h-0.5 bg-[#346739] shadow-md shadow-[#346739]/50 animate-scan-line-organic z-10" />
                      <div className="absolute inset-0 bg-[#346739]/10 animate-text-scan-organic flex items-center justify-center">
                        <span className="text-4xs font-black text-[#FFFDEB] bg-[#091413]/90 px-2 py-0.5 rounded border border-[#346739]/30 uppercase tracking-widest">
                          OCR Scanning...
                        </span>
                      </div>
                    </>
                  )}
                  {isScanning && activeStep === 'claude' && (
                    <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                      <span className="text-4xs font-black text-amber-800 bg-[#FFFDEB]/90 px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-widest">
                        Auditing Rules...
                      </span>
                    </div>
                  )}
                  {isScanning && activeStep === 'gpt' && (
                    <div className="absolute inset-0 bg-[#346739]/5 flex items-center justify-center">
                      <span className="text-4xs font-black text-[#346739] bg-[#FFFDEB]/90 px-2 py-0.5 rounded border border-[#346739]/30 uppercase tracking-widest animate-pulse">
                        Advisor active...
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="flex-1 py-2 rounded-lg bg-[#346739] text-[#FFFDEB] font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    {isScanning ? 'Proses AI...' : 'Scan AI'}
                  </button>
                  {scanResult && !isScanning && (
                    <button
                      onClick={handleSaveTransaction}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[#FFFDEB] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                      Simpan
                    </button>
                  )}
                </div>

                {/* Scan results info inside mobile screen */}
                {scanResult && !isScanning && (
                  <div className="p-3 rounded-lg bg-[#FFFDEB] border border-[#346739]/10 space-y-2 animate-in fade-in duration-200">
                    <div className="flex justify-between border-b border-[#346739]/5 pb-1">
                      <span className="text-2xs font-extrabold text-[#091413]">{scanResult.scanData.merchantName}</span>
                      <span className="text-3xs font-extrabold text-[#346739]">{scanResult.category}</span>
                    </div>
                    <div className="space-y-1">
                      {scanResult.scanData.items.map((it, i) => (
                        <div key={i} className="flex justify-between text-3xs text-slate-600 font-semibold">
                          <span>{it.name} x{it.quantity}</span>
                          <span>IDR {it.total.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-2xs font-black text-[#091413] border-t border-[#346739]/5 pt-1.5 mt-1">
                        <span>TOTAL</span>
                        <span>IDR {scanResult.scanData.totalAmount.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 3: LEDGER & E-STATEMENT VIEW */}
          {activeTab === 'ledger' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* E-Statement Downloader widget */}
              <EStatementGenerator 
                transactions={transactions} 
                onDownload={() => alert('PDF statement template generated.')} 
              />

              {/* Transactions list */}
              <div className="organic-card rounded-xl p-4 bg-[#FBE8CE]/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xs font-extrabold text-[#091413] uppercase tracking-wider">Jurnal Transaksi</span>
                  
                  {/* Manual entry toggle */}
                  <button
                    onClick={() => setShowAddManual(!showAddManual)}
                    className="p-1 rounded bg-[#346739]/10 border border-[#346739]/20 text-[#346739] text-3xs font-bold"
                  >
                    {showAddManual ? 'Batal' : 'Manual'}
                  </button>
                </div>

                {/* Manual entry form */}
                {showAddManual && (
                  <form onSubmit={handleAddManualTransaction} className="p-3 bg-[#FFFDEB] rounded-lg border border-[#346739]/15 space-y-2 animate-in slide-in-from-top-2 duration-150">
                    <div className="text-3xs font-extrabold text-[#346739] border-b border-[#346739]/10 pb-0.5">CATATAN MANUAL</div>
                    <input 
                      type="text" 
                      required
                      placeholder="Nama Merchant / Gaji"
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      className="w-full px-2 py-1 bg-[#FFFDEB] border border-[#346739]/20 rounded text-3xs focus:outline-none focus:border-[#346739]"
                    />
                    <input 
                      type="number" 
                      required
                      placeholder="Nominal (Minus jika Keluar)"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="w-full px-2 py-1 bg-[#FFFDEB] border border-[#346739]/20 rounded text-3xs focus:outline-none focus:border-[#346739]"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={manualAllocation}
                        onChange={(e) => setManualAllocation(e.target.value as AllocationType)}
                        className="px-2 py-1 bg-[#FFFDEB] border border-[#346739]/20 rounded text-3xs focus:outline-none"
                      >
                        <option value="primer">Primer (60%)</option>
                        <option value="sekunder">Sekunder (20%)</option>
                        <option value="investasi">Investasi (20%)</option>
                      </select>
                      <button
                        type="submit"
                        className="py-1 bg-[#346739] text-[#FFFDEB] rounded text-3xs font-extrabold cursor-pointer"
                      >
                        Simpan
                      </button>
                    </div>
                  </form>
                )}

                {/* Filter and Search */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Cari deskripsi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 bg-[#FFFDEB] border border-[#346739]/10 rounded-lg text-3xs focus:outline-none focus:border-[#346739] text-[#091413]"
                    />
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {(['all', 'primer', 'sekunder', 'investasi'] as const).map((tp) => (
                      <button
                        key={tp}
                        onClick={() => setSelectedFilter(tp)}
                        className={`px-2 py-0.5 rounded text-3xs capitalize border ${
                          selectedFilter === tp 
                            ? 'bg-[#346739] text-[#FFFDEB] border-[#346739]' 
                            : 'bg-[#FFFDEB] text-slate-500 border-[#346739]/10'
                        }`}
                      >
                        {tp === 'all' ? 'Semua' : tp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrolling transaction stack */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredTransactions.map((tx) => (
                    <div 
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#FFFDEB] border border-[#346739]/5 font-mono text-3xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-[#091413] truncate max-w-[130px]">{tx.description}</div>
                        <div className="text-slate-400 text-3xs">
                          {new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                          {' • '}
                          <span className={`capitalize font-bold ${
                            tx.allocation === 'primer' ? 'text-sky-700' : tx.allocation === 'sekunder' ? 'text-purple-700' : 'text-emerald-700'
                          }`}>{tx.allocation || 'Pendapatan'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className={`font-black text-2xs ${
                            tx.type === 'incoming' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {tx.type === 'incoming' ? '+' : '-'} {Math.abs(tx.amount).toLocaleString('id-ID')}
                          </div>
                          <div className="text-3xs text-slate-400">
                            Bal: {tx.runningBalance.toLocaleString('id-ID')}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1 text-rose-700 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: ACCOUNT PROFILE VIEW */}
          {activeTab === 'account' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="organic-card rounded-xl p-4 bg-[#FBE8CE]/50 space-y-4 text-center">
                
                {/* User avatar */}
                <div className="mx-auto h-16 w-16 rounded-full bg-[#346739] text-[#FFFDEB] font-bold text-xl flex items-center justify-center shadow-md">
                  {currentUser?.name.split(' ').map(n => n[0]).join('')}
                </div>

                <div>
                  <h4 className="font-extrabold text-[#091413] text-sm">{currentUser?.name}</h4>
                  <span className="text-3xs text-slate-500 font-semibold">{currentUser?.email}</span>
                </div>

                <div className="border-t border-[#346739]/10 pt-3 text-left space-y-2.5">
                  <div className="flex justify-between items-center text-3xs font-semibold">
                    <span className="text-slate-500">Nomor Rekening Digital</span>
                    <span className="text-[#091413] font-bold">NF-9087-1123-22</span>
                  </div>
                  <div className="flex justify-between items-center text-3xs font-semibold">
                    <span className="text-slate-500">Tingkat Akun</span>
                    <span className="text-[#346739] font-bold">Premium Sharia</span>
                  </div>
                  <div className="flex justify-between items-center text-3xs font-semibold">
                    <span className="text-slate-500">Database RLS Policy</span>
                    <span className="text-emerald-700 font-bold">Aktif & Terenkripsi</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Keluar dari Akun
                </button>

              </div>

            </div>
          )}

        </div>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="h-16 bg-[#FBE8CE] border-t border-[#346739]/10 grid grid-cols-4 select-none z-40">
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#346739] font-black' : 'text-[#091413]/50 font-semibold'
            }`}
          >
            <Layers className="h-4.5 w-4.5" />
            <span className="text-4xs">Dasbor</span>
          </button>

          <button 
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'scan' ? 'text-[#346739] font-black' : 'text-[#091413]/50 font-semibold'
            }`}
          >
            <Scan className="h-4.5 w-4.5" />
            <span className="text-4xs">Pindai AI</span>
          </button>

          <button 
            onClick={() => setActiveTab('ledger')}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'ledger' ? 'text-[#346739] font-black' : 'text-[#091413]/50 font-semibold'
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            <span className="text-4xs">Mutasi</span>
          </button>

          <button 
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'account' ? 'text-[#346739] font-black' : 'text-[#091413]/50 font-semibold'
            }`}
          >
            <User className="h-4.5 w-4.5" />
            <span className="text-4xs">Akun</span>
          </button>

        </div>

      </div>
    );
  };

  return (
    <MobileSimulatorFrame isWideView={isWideView} setIsWideView={setIsWideView}>
      
      {/* Dynamic Screen Render */}
      {renderMobileContent()}

      {/* DRAFT DUPLICATE WARNING MODAL */}
      <DuplicateWarningModal 
        isOpen={isDupModalOpen}
        onClose={() => {
          setIsDupModalOpen(false);
          setIsScanning(false);
          setScanResult(null);
          setActiveStep('idle');
        }}
        onConfirm={commitTransaction}
        newReceipt={scanResult?.scanData || null}
        matchedTx={matchedTx}
      />

    </MobileSimulatorFrame>
  );
}
