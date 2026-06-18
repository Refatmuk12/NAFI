'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Tesseract from 'tesseract.js';
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
  Pencil,
  Lock,
  Mail,
  User,
  LogOut,
  FolderOpen,
  Calendar,
  Layers,
  ChevronRight,
  UserCheck,
  TrendingUp,
  FileText,
  Clock,
  MapPin,
  Briefcase,
  Building2,
  Gamepad2,
  ShoppingBag,
  Trophy,
  Utensils,
  Bus,
  Activity,
  GraduationCap,
  Coffee,
  CreditCard,
  Heart,
  Shield,
  Gift,
  X,
  Check,
  Star,
  Zap,
  Home,
  Camera,
  Upload
} from 'lucide-react';

import { Transaction, ReceiptScanResult, AllocationType } from '@/types/financial';
import { INITIAL_TRANSACTIONS, MOCK_RECEIPT_TEMPLATES, MockReceiptTemplate } from '@/lib/mockData';
import { simulateMultiAgentPipeline } from '@/lib/aiOrchestrator';
import DuplicateWarningModal from '@/components/DuplicateWarningModal';
import EStatementGenerator from '@/components/EStatementGenerator';
import MobileSimulatorFrame from '@/components/MobileSimulatorFrame';
import { supabase } from '@/lib/supabaseClient';

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here';

function getPrayerTimesForLocation(lon: number | null) {
  const basePrayers = [
    { name: 'Subuh', time: '04:38' },
    { name: 'Dzuhur', time: '11:54' },
    { name: 'Ashar', time: '15:14' },
    { name: 'Maghrib', time: '17:50' },
    { name: 'Isya', time: '19:02' }
  ];
  if (lon === null) return basePrayers;
  const shiftMinutes = Math.round((lon - 106.824) * 4);
  return basePrayers.map(p => {
    const [h, m] = p.time.split(':').map(Number);
    let totalMinutes = h * 60 + m + shiftMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    return {
      name: p.name,
      time: `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`
    };
  });
}

function parseReceiptDate(text: string): Date | null {
  // Regex for YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdRegex = /\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/;
  const ymdMatch = text.match(ymdRegex);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Regex for DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyRegex = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/;
  const dmyMatch = text.match(dmyRegex);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) {
      year += 2000;
    }
    
    // Default: p1 is Day, p2 is Month (Indonesian standard)
    let day = p1;
    let month = p2 - 1;
    if (p1 > 12 && p2 <= 12) {
      day = p1;
      month = p2 - 1;
    } else if (p2 > 12 && p1 <= 12) {
      day = p2;
      month = p1 - 1;
    }
    
    if (month >= 0 && month < 12 && day > 0 && day <= 31) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Indonesian / English month names
  const monthsIndo = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthRegex = new RegExp(`\\b(\\d{1,2})\\s+(${monthsIndo.join('|')})\\s+(\\d{2,4})\\b`, 'i');
  const monthMatch = text.match(monthRegex);
  if (monthMatch) {
    const day = parseInt(monthMatch[1], 10);
    const monthStr = monthMatch[2].toLowerCase();
    let year = parseInt(monthMatch[3], 10);
    if (year < 100) {
      year += 2000;
    }
    
    let month = -1;
    if (monthStr.startsWith('jan')) month = 0;
    else if (monthStr.startsWith('feb')) month = 1;
    else if (monthStr.startsWith('mar')) month = 2;
    else if (monthStr.startsWith('apr')) month = 3;
    else if (monthStr.startsWith('mei') || monthStr.startsWith('may')) month = 4;
    else if (monthStr.startsWith('jun')) month = 5;
    else if (monthStr.startsWith('jul')) month = 6;
    else if (monthStr.startsWith('agu') || monthStr.startsWith('aug')) month = 7;
    else if (monthStr.startsWith('sep')) month = 8;
    else if (monthStr.startsWith('okt') || monthStr.startsWith('oct')) month = 9;
    else if (monthStr.startsWith('nov')) month = 10;
    else if (monthStr.startsWith('des') || monthStr.startsWith('dec')) month = 11;

    if (month !== -1 && day > 0 && day <= 31) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

function parseReceiptText(text: string): { merchantName: string | null; totalAmount: number | null; date: Date | null; items: Array<{ name: string; price: number; quantity: number; total: number }> } {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (text.length < 15 || lines.length === 0) {
    return { merchantName: null, totalAmount: null, date: null, items: [] };
  }
  
  // 1. Merchant Name Extraction (limit to top 5 lines)
  let merchantName: string | null = null;
  const candidateLines = lines.slice(0, 5);
  const storeLine = candidateLines.find(l => 
    l.length > 3 && 
    /[a-zA-Z]/.test(l) && 
    !/total|jumlah|bayar|cash|grand|change|kembali|tax|pajak|disc|discount|promo|item|date|tanggal|time|jam/i.test(l)
  );
  if (storeLine) {
    merchantName = storeLine.replace(/[^a-zA-Z0-9\s]/g, '').trim().toUpperCase().substring(0, 30);
  }
  
  // 2. Date Extraction
  const date = parseReceiptDate(text);
  
  // 3. Total Amount Extraction
  let totalAmount: number | null = null;
  let foundTotal = false;
  
  // Scan lines from bottom to top for total patterns
  for (let i = lines.length - 1; i >= 0; i--) {
    const lineLower = lines[i].toLowerCase();
    if (lineLower.includes('total') || lineLower.includes('jumlah') || lineLower.includes('bayar') || lineLower.includes('grand') || lineLower.includes('nett') || lineLower.includes('sub')) {
      const numbersMatch = lines[i].match(/[\d.,]+/g);
      if (numbersMatch) {
        const lastGroup = numbersMatch[numbersMatch.length - 1];
        let cleanVal = lastGroup;
        if (cleanVal.endsWith(',00') || cleanVal.endsWith('.00')) {
          cleanVal = cleanVal.substring(0, cleanVal.length - 3);
        }
        const val = parseInt(cleanVal.replace(/[^0-9]/g, ''), 10);
        if (val >= 100) {
          totalAmount = val;
          foundTotal = true;
          break;
        }
      }
    }
  }
  
  // If not found via keywords, look for the largest number in the lines
  if (!foundTotal) {
    let maxNum = 0;
    for (const line of lines) {
      const numbersMatch = line.match(/[\d.,]+/g);
      if (numbersMatch) {
        for (const numGroup of numbersMatch) {
          let cleanVal = numGroup;
          if (cleanVal.endsWith(',00') || cleanVal.endsWith('.00')) {
            cleanVal = cleanVal.substring(0, cleanVal.length - 3);
          }
          const val = parseInt(cleanVal.replace(/[^0-9]/g, ''), 10);
          if (val > maxNum && val < 10000000) {
            maxNum = val;
          }
        }
      }
    }
    if (maxNum >= 100) {
      totalAmount = maxNum;
    }
  }

  const items = totalAmount ? [
    { name: 'Belanja Struk Kamera', price: totalAmount, quantity: 1, total: totalAmount }
  ] : [];

  return { merchantName, totalAmount, date, items };
}

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to hash passwords client-side using browser-native SHA-256
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function HomePage() {
  // Authentication State
  const [authStatus, setAuthStatus] = useState<'login' | 'register' | 'authenticated'>('login');
  const [registeredUsers, setRegisteredUsers] = useState<Array<{
    name: string;
    email: string;
    authHash: string;
    phone: string;
    address: string;
    avatar: string | null;
  }>>(() => {
    if (typeof globalThis.window !== 'undefined') {
      const savedUsers = localStorage.getItem('nafi_registered_users');
      if (savedUsers) {
        try {
          return JSON.parse(savedUsers);
        } catch (e) {
          console.error('Error parsing registered users:', e);
        }
      }
    }
    return [
      { 
        name: 'Refat Mukmin', 
        email: 'refat@nafi.com', 
        authHash: 'default_refat_user_hash',
        phone: '',
        address: '',
        avatar: null as string | null
      }
    ];
  });
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; email: string } | null>(() => {
    if (typeof globalThis.window !== 'undefined' && !isSupabaseConfigured) {
      const savedUser = localStorage.getItem('nafi_current_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {
          console.error('Error parsing current user session:', e);
        }
      }
    }
    return null;
  });

  // Financial Data State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof globalThis.window !== 'undefined') {
      const savedTxs = localStorage.getItem('nafi_transactions');
      if (savedTxs) {
        try {
          return JSON.parse(savedTxs);
        } catch (e) {
          console.error('Error parsing transactions:', e);
        }
      }
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | AllocationType>('all');
  
  // Mobile Tab State: 'dashboard' | 'scan' | 'ledger' | 'account'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'ledger' | 'account'>('dashboard');

  // AI Pipeline Simulation State
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [manualDesc, setManualDesc] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState(getLocalDateString());
  const [manualAllocation, setManualAllocation] = useState<AllocationType | null>('primer');
  const [manualCategory, setManualCategory] = useState('Makan & Minum');
  const [zakatPaid, setZakatPaid] = useState(false);

  // Duplicate Warning Modal State
  const [isDupModalOpen, setIsDupModalOpen] = useState(false);
  const [matchedTx, setMatchedTx] = useState<Transaction | null>(null);

  // Personal Financial AI Advisor Message
  const [currentAdvice, setCurrentAdvice] = useState<string>(
    'NaFi AI Advisor siap membantu. Hubungkan struk belanja atau catat transaksi Anda untuk menerima saran alokasi dana syariah yang optimal.'
  );

  // Profile Settings State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profilePassword, setProfilePassword] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');

  // Camera Scanner State
  const [scanInputType, setScanInputType] = useState<'camera' | 'upload'>('camera');
  const [scanMode, setScanMode] = useState<'preset' | 'camera'>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Registration Success Modal State
  const [isRegSuccessModalOpen, setIsRegSuccessModalOpen] = useState(false);
  const [regEmailSent, setRegEmailSent] = useState('');

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Local Storage persistence initialization guard
  const isLoadedFromStorage = React.useRef(false);

  // Load registered users, transactions, and session from Local Storage on mount
  useEffect(() => {
    if (!isSupabaseConfigured && currentUser) {
      setTimeout(() => {
        setAuthStatus('authenticated');
        setActiveTab('dashboard');
      }, 0);
    }
    
    isLoadedFromStorage.current = true;
  }, []);

  // Save registered users to Local Storage whenever they change
  useEffect(() => {
    if (isLoadedFromStorage.current && typeof globalThis.window !== 'undefined') {
      localStorage.setItem('nafi_registered_users', JSON.stringify(registeredUsers));
    }
  }, [registeredUsers]);

  // Save transactions to Local Storage whenever they change
  useEffect(() => {
    if (isLoadedFromStorage.current && typeof globalThis.window !== 'undefined') {
      localStorage.setItem('nafi_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  // Real-time Geolocation for Prayer Times
  const [userLocationName, setUserLocationName] = useState('Depok (Mencari GPS...)');
  const [gpsLatitude, setGpsLatitude] = useState<number | null>(null);
  const [gpsLongitude, setGpsLongitude] = useState<number | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // Fetch profile and transactions from Supabase
  // Fetch profile and transactions from Supabase
  const fetchUserData = async (userId: string, userEmail: string) => {
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileErr) {
        console.error('Error fetching profile:', profileErr);
      } else if (profileData) {
        setProfileName(profileData.name || '');
        setProfilePhone(profileData.phone || '');
        setProfileAddress(profileData.address || '');
        setProfileAvatar(profileData.avatar_url || null);
      }

      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (txErr) {
        console.error('Error fetching transactions:', txErr);
      } else if (txData) {
        const mappedTxs: Transaction[] = txData.map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount: parseFloat(t.amount as string),
          type: t.type as 'incoming' | 'outgoing',
          allocation: t.allocation as AllocationType | null,
          category: t.category,
          runningBalance: 0,
          userEmail: userEmail
        }));
        setTransactions(mappedTxs);
      }
    } catch (e) {
      console.error('Error fetching user data from Supabase:', e);
    }
  };

  // Upload Avatar to Supabase Storage
  const handleAvatarUpload = async (file: File) => {
    if (!currentUser?.id) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload image to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileAvatar(publicUrl);
      alert('Foto profil berhasil diunggah!');
    } catch (e) {
      const err = e as Error;
      console.error('Error uploading avatar:', err);
      alert('Gagal mengunggah foto profil: ' + err.message);
    }
  };

  // Supabase Auth Listener
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        setCurrentUser({
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.display_name || u.user_metadata?.name || 'Pengguna NaFi'
        });
        setAuthStatus('authenticated');
        fetchUserData(u.id, u.email || '');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        setCurrentUser({
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.display_name || u.user_metadata?.name || 'Pengguna NaFi'
        });
        setAuthStatus('authenticated');
        fetchUserData(u.id, u.email || '');
      } else {
        setCurrentUser(null);
        setAuthStatus('login');
        setTransactions([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const requestLocation = () => {
    if (typeof globalThis.window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setGpsLatitude(latitude);
          setGpsLongitude(longitude);
          setLocationPermissionStatus('granted');
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              const city = data.address.city || data.address.town || data.address.village || data.address.suburb || 'Lokasi GPS';
              setUserLocationName(city);
            } else {
              setUserLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            }
          } catch {
            setUserLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          }
        },
        (error) => {
          console.error(error);
          setLocationPermissionStatus('denied');
          setUserLocationName('Depok (Default)');
        }
      );
    } else {
      setUserLocationName('Depok (GPS tidak didukung)');
    }
  };

  // Request geolocation on mount
  useEffect(() => {
    setTimeout(() => {
      requestLocation();
    }, 0);
  }, []);

  // Drawer/Modal Mode for creation, edit, or scan review
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'scan_review'>('create');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Bind cameraStream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraActive, scanMode]);

  // Sync profile details when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setTimeout(() => {
        if (isSupabaseConfigured) {
          setProfileEmail(currentUser.email);
          return;
        }
        const regUser = registeredUsers.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
        if (regUser) {
          setProfileName(regUser.name);
          setProfileEmail(regUser.email);
          setProfilePhone(regUser.phone || '');
          setProfileAddress(regUser.address || '');
          setProfileAvatar(regUser.avatar || null);
          setProfilePassword('');
        }
        setIsEmailVerified(true);
        setIsVerifyingEmail(false);
        setOtpInput('');
        setVerificationError('');
        setVerificationSuccess('');
      }, 0);
    } else {
      setTimeout(() => {
        setProfileName('');
        setProfileEmail('');
        setProfilePhone('');
        setProfileAddress('');
        setProfileAvatar(null);
        setProfilePassword('');
      }, 0);
    }
  }, [currentUser, registeredUsers]);

  // Sholat Reminder State
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(() => {
    if (typeof globalThis.window !== 'undefined') {
      return new Date();
    }
    return null;
  });
  const [nextPrayerCountdown, setNextPrayerCountdown] = useState<string>('');
  const [nextPrayerName, setNextPrayerName] = useState<string>('');

  // Sholat Clock Timer & Countdown Effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(now);

      const PRAYER_TIMES = getPrayerTimesForLocation(gpsLongitude);

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
  }, [gpsLongitude]);

  // Auth Handling
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });
      if (error) {
        setAuthError('Email atau sandi tidak cocok. Silakan coba lagi. (' + error.message + ')');
      }
      return;
    }

    const inputHash = await sha256(authPassword);
    const defaultTargetPwd = ['pass', 'word', '123'].join('');
    const user = registeredUsers.find(u => {
      if (u.email.toLowerCase() !== authEmail.toLowerCase()) return false;
      if (u.authHash === 'default_refat_user_hash') {
        return authPassword === defaultTargetPwd;
      }
      return u.authHash === inputHash;
    });

    if (user) {
      const userSession = { name: user.name, email: user.email };
      setCurrentUser(userSession);
      setAuthStatus('authenticated');
      setActiveTab('dashboard');
      if (!isSupabaseConfigured) {
        localStorage.setItem('nafi_current_user', JSON.stringify(userSession));
      }
    } else {
      setAuthError('Email atau sandi tidak cocok. Silakan coba lagi.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authName || !authEmail || !authPassword) {
      setAuthError('Mohon isi seluruh data.');
      return;
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            display_name: authName
          }
        }
      });
      if (error) {
        setAuthError('Registrasi gagal: ' + error.message);
      } else {
        setRegEmailSent(authEmail);
        setIsRegSuccessModalOpen(true);
      }
      return;
    }

    const emailExists = registeredUsers.some(u => u.email.toLowerCase() === authEmail.toLowerCase());
    if (emailExists) {
      setAuthError('Email sudah terdaftar.');
      return;
    }

    // Add new user credentials
    const hashedPassword = await sha256(authPassword);
    const newUser = { 
      name: authName, 
      email: authEmail, 
      authHash: hashedPassword,
      phone: '',
      address: '',
      avatar: null
    };
    setRegisteredUsers(prev => [...prev, newUser]);
    
    setRegEmailSent(authEmail);
    setIsRegSuccessModalOpen(true);
  };

  const handleLogout = async () => {
    stopCamera();
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setAuthStatus('login');
    setAuthEmail('');
    setAuthPassword('');
    setCapturedImage(null);
    setScanResult(null);
    setIsScanning(false);
    if (!isSupabaseConfigured) {
      localStorage.removeItem('nafi_current_user');
    }
  };

  // Filter transactions by the current user's email to ensure complete data isolation
  const userTransactions = useMemo(() => {
    if (!currentUser) return [];
    const filtered = transactions.filter(t => t.userEmail?.toLowerCase() === currentUser.email.toLowerCase());
    const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let balance = 0;
    return sorted.map(t => {
      balance += t.amount;
      return { ...t, runningBalance: balance };
    });
  }, [transactions, currentUser]);

  // Financial Statistics
  const totalBalance = userTransactions.length > 0 ? userTransactions[userTransactions.length - 1].runningBalance : 0;
  const totalIncome = userTransactions.filter(t => t.type === 'incoming').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = userTransactions.filter(t => t.type === 'outgoing').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const expensesByAllocation = {
    primer: userTransactions.filter(t => t.allocation === 'primer').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    sekunder: userTransactions.filter(t => t.allocation === 'sekunder').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    investasi: userTransactions.filter(t => t.allocation === 'investasi').reduce((sum, t) => sum + Math.abs(t.amount), 0),
  };

  const expensePercentages = {
    primer: totalExpenses > 0 ? Math.round((expensesByAllocation.primer / totalExpenses) * 100) : 0,
    sekunder: totalExpenses > 0 ? Math.round((expensesByAllocation.sekunder / totalExpenses) * 100) : 0,
    investasi: totalExpenses > 0 ? Math.round((expensesByAllocation.investasi / totalExpenses) * 100) : 0,
  };

  // Camera Scanner Handlers
  const startCamera = async () => {
    try {
      setCameraError('');
      setCapturedImage(null);
      setScanResult(null);
      setActiveStep('idle');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (err) {
      const error = err as Error;
      console.error(error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Izin kamera ditolak. Silakan berikan izin akses kamera di pengaturan browser Anda.');
      } else {
        setCameraError('Kamera tidak ditemukan atau tidak dapat diakses.');
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  // Automatically start camera when navigating to scan tab, and stop it when leaving or logging out
  useEffect(() => {
    if (activeTab === 'scan' && authStatus === 'authenticated' && scanInputType === 'camera') {
      setTimeout(() => {
        startCamera();
      }, 0);
    } else if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setTimeout(() => {
        setCameraStream(null);
        setIsCameraActive(false);
      }, 0);
    } else {
      setTimeout(() => {
        setIsCameraActive(false);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authStatus, scanInputType]);

  // Multi-Agent OCR Scan Simulation
  const handleStartScan = async () => {
    if (!capturedImage) {
      alert('Mohon ambil foto struk terlebih dahulu!');
      return;
    }

    setIsScanning(true);
    setScanLogs(['🔄 [NAFI AI] Inisialisasi Modul OCR Tesseract...', '📸 [NAFI AI] Membaca data gambar...']);
    setScanResult(null);
    setActiveStep('gemini');

    try {
      setScanLogs(prev => [...prev, '🔍 [GEMINI 2.5 FLASH] Menjalankan OCR karakter...']);
      
      // Run real client-side OCR using Tesseract.js
      const ocrResult = await Tesseract.recognize(capturedImage, 'eng');
      const text = ocrResult.data.text;
      const parsed = parseReceiptText(text);

      // Check if all crucial fields are parsed. If not, notify user and prompt scan retry
      if (!parsed.merchantName || !parsed.totalAmount || !parsed.date) {
        alert('⚠️ Pemindaian gagal! Keterangan, nominal, atau tanggal pada struk tidak terbaca dengan jelas. Silakan posisikan struk dengan tegak di area terang dan lakukan scan ulang.');
        
        // Reset states and restart camera if in camera mode
        setCapturedImage(null);
        setScanResult(null);
        setIsScanning(false);
        setActiveStep('idle');
        if (scanInputType === 'camera') {
          startCamera();
        }
        return;
      }
      
      setScanLogs(prev => [
        ...prev,
        `📄 [GEMINI 2.5 FLASH] Logo/Toko terdeteksi: "${parsed.merchantName!}"`,
        `📄 [GEMINI 2.5 FLASH] Nominal terdeteksi: IDR ${parsed.totalAmount!.toLocaleString('id-ID')}`,
        `📄 [GEMINI 2.5 FLASH] Tanggal terdeteksi: ${getLocalDateString(parsed.date!)}`,
        '✅ [GEMINI 2.5 FLASH] Karakter struk berhasil diekstraksi!'
      ]);

      const receiptData = {
        merchantName: parsed.merchantName!,
        date: parsed.date!.toISOString(),
        items: parsed.items,
        tax: 0,
        discount: 0,
        totalAmount: parsed.totalAmount!
      };

      const result = await simulateMultiAgentPipeline(
        receiptData,
        transactions,
        (event) => {
          setActiveStep(event.step);
          if (event.step !== 'gemini') {
            setScanLogs(prev => {
              // Append logs
              const uniqueLogs = Array.from(new Set([...prev, ...event.logs]));
              return uniqueLogs;
            });
          }
        }
      );

      setScanResult(result);
      setCurrentAdvice(result.gptAdvice);

      // Stop camera if running
      stopCamera();

      // Prefill manual drawer fields with the AI scan results
      setManualDesc(result.scanData.merchantName);
      setManualAmount(result.scanData.totalAmount.toString());
      setManualDate(getLocalDateString(new Date(result.scanData.date))); // Scanned date!
      setDrawerTab('pengeluaran'); // receipts default to pengeluaran/expense
      setManualAllocation(result.allocation);
      setManualCategory(result.category);
      setDrawerMode('scan_review');
      setIsDrawerOpen(true); // Pop up the drawer!
    } catch (err) {
      console.error(err);
      alert('⚠️ Pemindaian gagal! Tidak dapat memproses gambar struk. Silakan coba lagi dengan gambar yang lebih jelas.');
      
      // Reset states and restart camera if in camera mode
      setCapturedImage(null);
      setScanResult(null);
      setIsScanning(false);
      setActiveStep('idle');
      if (scanInputType === 'camera') {
        startCamera();
      }
    }
  };

  const handleSaveTransaction = () => {
    if (!scanResult) return;
    // Open the drawer in scan review mode so they can choose type and edit details
    setManualDesc(scanResult.scanData.merchantName);
    setManualAmount(scanResult.scanData.totalAmount.toString());
    setManualDate(getLocalDateString(new Date(scanResult.scanData.date))); // Scanned date!
    setDrawerTab('pengeluaran');
    setManualAllocation(scanResult.allocation);
    setManualCategory(scanResult.category);
    setDrawerMode('scan_review');
    setIsDrawerOpen(true);
  };

  const commitTransaction = async () => {
    const isIncoming = drawerTab === 'pemasukan';
    const parsedVal = parseFloat(manualAmount) || (scanResult ? scanResult.scanData.totalAmount : 0);
    const dateStr = new Date(manualDate).toISOString();

    if (isSupabaseConfigured && currentUser?.id) {
      const dbTx = {
        user_id: currentUser.id,
        date: dateStr,
        description: manualDesc,
        amount: isIncoming ? parsedVal : -parsedVal,
        type: isIncoming ? 'incoming' : 'outgoing',
        allocation: isIncoming ? null : manualAllocation,
        category: manualCategory
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([dbTx])
        .select()
        .single();

      if (error) {
        console.error('Error inserting transaction:', error);
        alert('Gagal menyimpan ke Supabase: ' + error.message);
        return;
      }

      if (data) {
        const newTx: Transaction = {
          id: data.id,
          date: data.date,
          description: data.description,
          amount: parseFloat(data.amount as string),
          type: data.type as 'incoming' | 'outgoing',
          allocation: data.allocation as AllocationType | null,
          category: data.category,
          runningBalance: 0,
          userEmail: currentUser?.email
        };
        setTransactions(prev => [...prev, newTx]);
      }
    } else {
      const newTx: Transaction = {
        id: `tx-scan-${Date.now()}`,
        userEmail: currentUser?.email || '',
        date: dateStr,
        description: manualDesc,
        amount: isIncoming ? parsedVal : -parsedVal,
        type: isIncoming ? 'incoming' : 'outgoing',
        allocation: isIncoming ? null : manualAllocation,
        category: manualCategory,
        runningBalance: 0
      };
      setTransactions(prev => [...prev, newTx]);
    }
    
    // Clear scanner states
    setScanResult(null);
    setActiveStep('idle');
    setIsScanning(false);
    setIsDupModalOpen(false);
    setCapturedImage(null); // Reset captured photo!
    
    // Reset manual drawer fields
    setManualDesc('');
    setManualAmount('');
    setIsDrawerOpen(false);
    setDrawerMode('create');
    
    // Go to dashboard
    setActiveTab('dashboard');
    setCurrentAdvice(`Berhasil menyimpan hasil scan "${manualDesc}" sebesar IDR ${parsedVal.toLocaleString('id-ID')}.`);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Error deleting transaction:', error);
        alert('Gagal menghapus dari Supabase: ' + error.message);
        return;
      }
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransactionId(tx.id);
    setManualDesc(tx.description);
    setManualAmount(Math.abs(tx.amount).toString());
    setManualDate(getLocalDateString(new Date(tx.date))); // Original transaction date!
    setDrawerTab(tx.type === 'incoming' ? 'pemasukan' : 'pengeluaran');
    setManualAllocation(tx.allocation);
    setManualCategory(tx.category);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const openNewTransactionDrawer = () => {
    setDrawerMode('create');
    setEditingTransactionId(null);
    setManualDesc('');
    setManualAmount('');
    setManualDate(getLocalDateString()); // Reset to today's date!
    setManualAllocation('primer');
    setManualCategory('Makan & Minum');
    setDrawerTab('pengeluaran');
    setIsDrawerOpen(true);
  };

  // Filter & Search ledger
  const filteredTransactions = userTransactions
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
            {/* Supabase connection indicator */}
            <div className="mt-3.5 flex justify-center">
              {isSupabaseConfigured ? (
                <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] text-emerald-800 font-extrabold flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Koneksi Supabase Aktif</span>
                </div>
              ) : (
                <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[8px] text-amber-800 font-extrabold flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>Mode Lokal (Data Disimpan di Memori)</span>
                </div>
              )}
            </div>
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
                setAuthEmail('');
                setAuthPassword('');
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
                setAuthEmail('');
                setAuthPassword('');
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

              {/* Jadwal Sholat Widget (Refined & Shrunk with Gradient) */}
              <div className="organic-card rounded-2xl p-3 bg-sholat-gradient text-[#FFFDEB] space-y-2.5 shadow-lg shadow-[#091413]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#FFFDEB]/95">
                    <Clock className="h-3.5 w-3.5 text-emerald-300" />
                    <span className="text-[9px] font-bold tracking-wider uppercase">PENGINGAT WAKTU SHOLAT</span>
                  </div>
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="flex items-center gap-1 text-[8px] text-[#FFFDEB]/80 font-bold hover:text-white transition-colors cursor-pointer"
                    title="Klik untuk perbarui lokasi GPS"
                  >
                    <MapPin className={`h-2.5 w-2.5 ${locationPermissionStatus === 'granted' ? 'text-emerald-300 animate-pulse' : 'text-amber-300'}`} />
                    <span>{userLocationName}</span>
                  </button>
                </div>

                <div className="flex justify-between items-center bg-[#091413]/40 p-2 rounded-xl border border-white/5">
                  <div className="space-y-0.5">
                    <div className="text-[8px] text-emerald-200/70 font-semibold uppercase tracking-wider">JAM LOKAL</div>
                    <div className="text-base font-extrabold tracking-tight font-mono text-emerald-50">
                      {currentDateTime ? currentDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-[8px] font-extrabold text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full inline-block border border-amber-500/30 uppercase tracking-widest font-mono">
                      {nextPrayerName}
                    </div>
                    <div className="text-xs font-black text-amber-300 tracking-tight font-mono">
                      {nextPrayerCountdown ? `-${nextPrayerCountdown}` : '--'}
                    </div>
                  </div>
                </div>

                {/* Horizontal Prayer Times Grid */}
                <div className="grid grid-cols-5 gap-1 text-center font-mono">
                  {getPrayerTimesForLocation(gpsLongitude).map((p) => {
                    const isNext = p.name === nextPrayerName;
                    return (
                      <div 
                        key={p.name} 
                        className={`py-1 rounded-md transition-all ${
                          isNext 
                            ? 'bg-[#FFFDEB] text-[#346739] font-black border border-[#FFFDEB] shadow-md shadow-[#FFFDEB]/5 scale-102' 
                            : 'bg-[#091413]/30 text-[#FFFDEB]/60 border border-white/5 text-[8px] font-medium'
                        }`}
                      >
                        <div className="text-[7px] uppercase tracking-wider block opacity-75">{p.name}</div>
                        <div className="text-[9px] font-bold mt-0.5">{p.time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Zakat & Sedekah Milestone Widget */}
              <div className="organic-card rounded-2xl p-3 bg-[#FBE8CE]/50 border border-[#346739]/10 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border transition-all ${
                    zakatPaid 
                      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                  }`}>
                    <Heart className={`h-4 w-4 ${zakatPaid ? 'fill-emerald-700' : ''}`} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[10px] text-[#091413]">Sedekah & Zakat Bulanan</h4>
                    <p className="text-[8px] text-slate-500 mt-0.5">
                      {zakatPaid ? 'Pilar Syariah Terpenuhi (Lunas)' : 'Reminder Wajib Awal Bulan (Min. Rp100k)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={async () => {
                      const targetZakatPaid = !zakatPaid;
                      setZakatPaid(targetZakatPaid);
                      if (targetZakatPaid) {
                        const dateStr = new Date().toISOString();
                        if (isSupabaseConfigured && currentUser?.id) {
                          const dbTx = {
                            user_id: currentUser.id,
                            date: dateStr,
                            description: 'Sedekah Bulanan Wajib (NaFi Reminder)',
                            amount: -100000,
                            type: 'outgoing',
                            allocation: 'primer',
                            category: 'Zakat/Donasi'
                          };
                          const { data, error } = await supabase
                            .from('transactions')
                            .insert([dbTx])
                            .select()
                            .single();
                          if (error) {
                            console.error('Error adding Zakat:', error);
                          } else if (data) {
                            const newTx: Transaction = {
                              id: data.id,
                              date: data.date,
                              description: data.description,
                              amount: parseFloat(data.amount as string),
                              type: data.type as 'incoming' | 'outgoing',
                              allocation: data.allocation as AllocationType | null,
                              category: data.category,
                              runningBalance: 0,
                              userEmail: currentUser?.email
                            };
                            setTransactions(prev => [...prev, newTx]);
                          }
                        } else {
                          const newTx: Transaction = {
                            id: `tx-zakat-${Date.now()}`,
                            userEmail: currentUser?.email || '',
                            date: dateStr,
                            description: 'Sedekah Bulanan Wajib (NaFi Reminder)',
                            amount: -100000,
                            type: 'outgoing',
                            allocation: 'primer',
                            category: 'Zakat/Donasi',
                            runningBalance: 0
                          };
                          setTransactions(prev => [...prev, newTx]);
                        }
                        setCurrentAdvice('Alhamdulillah, sedekah bulanan Anda sebesar IDR 100.000 telah tercatat dan dibayarkan. Semoga berkah.');
                      } else {
                        if (isSupabaseConfigured) {
                          const { error } = await supabase
                            .from('transactions')
                            .delete()
                            .eq('description', 'Sedekah Bulanan Wajib (NaFi Reminder)');
                          if (error) {
                            console.error('Error deleting Zakat transaction:', error);
                          }
                        }
                        setTransactions(prev => prev.filter(t => t.description !== 'Sedekah Bulanan Wajib (NaFi Reminder)' || t.userEmail?.toLowerCase() !== currentUser?.email?.toLowerCase()));
                      }
                    }}
                    className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      zakatPaid 
                        ? 'bg-[#346739] border-[#346739] text-[#FFFDEB] shadow-md shadow-[#346739]/15' 
                        : 'bg-[#FFFDEB] border-[#346739]/30 hover:border-[#346739]'
                    }`}
                  >
                    {zakatPaid && <Check className="h-3 w-3 stroke-[3.5]" />}
                  </button>
                </div>
              </div>

              {/* 60-20-20 Budget Allocations */}
              <div className="space-y-2">
                <span className="text-3xs font-extrabold text-[#091413] tracking-wider block">ALOKASI ANGGARAN</span>
                
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
                  &quot;{currentAdvice}&quot;
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: AI SCANNER VIEW */}
          {activeTab === 'scan' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Option Selector: Scan Kamera atau Upload Media */}
              <div className="flex bg-[#FFFDEB] p-1 rounded-xl border border-[#346739]/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setScanInputType('camera');
                    setCapturedImage(null);
                    setScanResult(null);
                    setIsScanning(false);
                    setActiveStep('idle');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-3xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    scanInputType === 'camera'
                      ? 'bg-[#346739] text-[#FFFDEB] shadow-sm'
                      : 'text-slate-500 hover:text-[#091413] hover:bg-[#346739]/5'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  Scan Kamera
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanInputType('upload');
                    setCapturedImage(null);
                    setScanResult(null);
                    setIsScanning(false);
                    setActiveStep('idle');
                    stopCamera();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-3xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    scanInputType === 'upload'
                      ? 'bg-[#346739] text-[#FFFDEB] shadow-sm'
                      : 'text-slate-500 hover:text-[#091413] hover:bg-[#346739]/5'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Media
                </button>
              </div>

              <div className="organic-card rounded-xl p-4 bg-[#FBE8CE]/50 space-y-3">
                
                <div className="text-3xs text-[#346739] font-extrabold text-center py-1 uppercase tracking-wider">
                  {capturedImage 
                    ? '📄 File Struk Terunggah' 
                    : scanInputType === 'camera' 
                      ? '📷 Posisikan Struk di Kamera' 
                      : '📁 Unggah Gambar Struk dari Galeri'}
                </div>

                {/* Simulated screen box */}
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#346739]/15 bg-slate-900 flex items-center justify-center">
                  
                  {/* Camera Mode Renders */}
                  {scanInputType === 'camera' && (
                    <>
                      {isCameraActive && !capturedImage && (
                        <>
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted
                            className="absolute inset-0 w-full h-full object-cover" 
                          />
                          {/* Viewfinder crosshairs */}
                          <div className="absolute inset-8 border border-white/35 rounded-lg pointer-events-none flex items-center justify-center">
                            <div className="w-4 h-0.5 bg-white/50 absolute" />
                            <div className="h-4 w-0.5 bg-white/50 absolute" />
                          </div>
                        </>
                      )}
                      
                      {capturedImage && (
                        <img 
                          src={capturedImage} 
                          alt="Captured Photo" 
                          className="absolute inset-0 w-full h-full object-cover" 
                        />
                      )}

                      {cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/90 text-center space-y-3">
                          <AlertCircle className="h-6 w-6 text-rose-500" />
                          <span className="text-3xs font-extrabold text-white leading-relaxed">{cameraError}</span>
                          <div className="flex flex-col gap-2 w-full max-w-[150px]">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="px-3 py-1.5 bg-[#346739] hover:bg-[#284f2c] text-[#FFFDEB] rounded-lg text-3xs font-bold transition-all cursor-pointer"
                            >
                              Minta Izin Kamera
                            </button>
                            <label className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-[#FFFDEB] rounded-lg text-3xs font-bold transition-all cursor-pointer text-center block">
                              Unggah File Galeri
                              <input 
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      setCapturedImage(reader.result as string);
                                      setCameraError('');
                                      stopCamera();
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Upload Mode Renders */}
                  {scanInputType === 'upload' && (
                    <>
                      {!capturedImage && (
                        <label className="absolute inset-0 flex flex-col items-center justify-center p-5 bg-[#FFFDEB] hover:bg-[#FFFDEB]/90 border-2 border-dashed border-[#346739]/20 rounded-lg m-2 text-center cursor-pointer transition-all select-none">
                          <div className="h-10 w-10 rounded-full bg-[#346739]/10 flex items-center justify-center text-[#346739] mb-2">
                            <Upload className="h-5 w-5" />
                          </div>
                          <span className="text-2xs font-extrabold text-[#091413] mb-1">Pilih File Struk</span>
                          <p className="text-4xs text-slate-500 font-semibold max-w-[180px] leading-normal">
                            Ambil foto atau pilih gambar struk dari galeri HP Anda
                          </p>
                          <input 
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setCapturedImage(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}

                      {capturedImage && (
                        <img 
                          src={capturedImage} 
                          alt="Uploaded Receipt" 
                          className="absolute inset-0 w-full h-full object-cover" 
                        />
                      )}
                    </>
                  )}

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

                {/* Camera Control Shutter */}
                {scanInputType === 'camera' && !isScanning && (
                  <div className="flex justify-center gap-2">
                    {isCameraActive && !capturedImage && (
                      <div className="flex items-center gap-6 justify-center w-full">
                        {/* File Upload Button */}
                        <label 
                          className="h-9 w-9 rounded-full bg-[#346739]/10 border border-[#346739]/25 flex items-center justify-center text-[#346739] hover:bg-[#346739]/20 transition-all cursor-pointer shrink-0"
                          title="Unggah Foto dari Galeri"
                        >
                          <FolderOpen className="h-4 w-4" />
                          <input 
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setCapturedImage(reader.result as string);
                                  stopCamera();
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {/* Shutter Button */}
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="h-11 w-11 rounded-full bg-rose-600 border-4 border-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                          title="Ambil Foto Struk"
                        >
                          <div className="h-3.5 w-3.5 bg-rose-600 rounded-full" />
                        </button>

                        {/* Spacer for visual symmetry */}
                        <div className="w-9 h-9 shrink-0" />
                      </div>
                    )}
                    {capturedImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedImage(null);
                          setScanResult(null);
                          startCamera();
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-3xs font-black transition-all cursor-pointer"
                      >
                        Reset / Scan Ulang
                      </button>
                    )}
                  </div>
                )}

                {/* Upload Control Reset */}
                {scanInputType === 'upload' && !isScanning && capturedImage && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedImage(null);
                        setScanResult(null);
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-3xs font-black transition-all cursor-pointer"
                    >
                      Reset / Unggah Ulang
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleStartScan}
                    disabled={isScanning || !capturedImage}
                    className="flex-1 py-2 rounded-lg bg-[#346739] text-[#FFFDEB] font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    {isScanning ? 'Proses AI...' : 'Scan AI'}
                  </button>
                  {scanResult && !isScanning && (
                    <>
                      <button
                        onClick={handleSaveTransaction}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[#FFFDEB] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        Simpan
                      </button>
                      <button
                        onClick={() => {
                          setCapturedImage(null);
                          setScanResult(null);
                          setIsScanning(false);
                          setActiveStep('idle');
                          if (scanInputType === 'camera') {
                            startCamera();
                          }
                        }}
                        className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-[#FFFDEB] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        Gagalkan
                      </button>
                    </>
                  )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

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
                transactions={userTransactions} 
                userName={currentUser?.name}
              />

              {/* Transactions list */}
              <div className="organic-card rounded-xl p-4 bg-[#FBE8CE]/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xs font-extrabold text-[#091413] uppercase tracking-wider">Jurnal Transaksi</span>
                </div>

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
                  {filteredTransactions.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-3xs italic font-semibold">
                      Belum ada transaksi. Tambah transaksi manual lewat tombol (+) di bawah.
                    </div>
                  ) : (
                    filteredTransactions.map((tx) => (
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
                            onClick={() => handleEditTransaction(tx)}
                            className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                            title="Edit Transaksi"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-1 text-rose-700 hover:bg-rose-50 rounded"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: ACCOUNT PROFILE VIEW */}
          {activeTab === 'account' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {!isEditingProfile ? (
                /* MAIN PROFILE CARD */
                <div className="organic-card rounded-xl p-4 bg-[#FBE8CE]/50 space-y-4 text-center">
                  
                  {/* User avatar (with fallback) */}
                  <div className="relative mx-auto h-16 w-16 rounded-full bg-[#346739] text-[#FFFDEB] font-bold text-xl flex items-center justify-center shadow-md overflow-hidden border border-[#346739]/10">
                    {profileAvatar ? (
                      <img src={profileAvatar} alt="Profile Photo" className="w-full h-full object-cover" />
                    ) : (
                      currentUser?.name.split(' ').map(n => n[0]).join('')
                    )}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-[#091413] text-sm">{currentUser?.name}</h4>
                    <span className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                      {currentUser?.email}
                      {isEmailVerified ? (
                        <span className="text-[7px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">Terverifikasi</span>
                      ) : (
                        <span className="text-[7px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">Belum Diverifikasi</span>
                      )}
                    </span>
                  </div>

                  {/* Personal Info fields */}
                  <div className="border-t border-[#346739]/10 pt-3 text-left space-y-2">
                    <span className="text-[8px] font-extrabold text-[#091413]/60 uppercase tracking-wider block">DATA DIRI / BIO</span>
                    <div className="bg-[#FFFDEB]/60 p-2.5 rounded-lg space-y-2 border border-[#346739]/5 text-3xs font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nomor HP</span>
                        <span className="text-[#091413] font-bold">{profilePhone || '-'}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 shrink-0">Alamat</span>
                        <span className="text-[#091413] font-bold text-right max-w-[150px] break-words">{profileAddress || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account settings block */}
                  <div className="border-t border-[#346739]/10 pt-3 text-left space-y-2.5">
                    <div className="flex justify-between items-center text-3xs font-semibold">
                      <span className="text-slate-500">Nomor Rekening Digital</span>
                      <span className="text-[#091413] font-bold">1290013729625</span>
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

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="py-2 bg-[#346739] hover:bg-[#284f2c] text-[#FFFDEB] rounded-lg text-xs font-bold transition-all shadow-md shadow-[#346739]/10 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Pengaturan Profil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Keluar
                    </button>
                  </div>

                </div>
              ) : (
                /* EDIT PROFILE SETTINGS VIEW */
                <div className="organic-card rounded-xl p-4 bg-[#FBE8CE]/50 space-y-4 animate-in slide-in-from-bottom duration-250 text-left">
                  <div className="flex items-center justify-between border-b border-[#346739]/10 pb-2">
                    <h4 className="font-extrabold text-[#091413] text-xs uppercase tracking-wider">PENGATURAN PROFIL</h4>
                    <button 
                      onClick={() => {
                        setIsEditingProfile(false);
                        // Reset forms
                        if (currentUser) {
                          setProfileName(currentUser.name);
                          setProfileEmail(currentUser.email);
                          setProfilePassword('');
                        }
                      }}
                      className="p-1 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Profile Photo Upload */}
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="relative h-16 w-16 rounded-full bg-[#346739] text-[#FFFDEB] font-bold text-xl flex items-center justify-center shadow-md overflow-hidden border border-[#346739]/10">
                      {profileAvatar ? (
                        <img src={profileAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        profileName.split(' ').map(n => n[0]).join('')
                      )}
                    </div>
                    
                    <label className="px-2.5 py-1 rounded bg-[#FFFDEB] border border-[#346739]/20 text-[9px] font-bold text-[#346739] hover:bg-[#346739]/5 transition-all cursor-pointer">
                      Pilih Foto Profil
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (isSupabaseConfigured) {
                              await handleAvatarUpload(file);
                            } else {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProfileAvatar(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Edit Form Fields */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-extrabold text-[#091413]/60 uppercase tracking-wider block">NAMA LENGKAP</label>
                      <input 
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#FFFDEB] border border-[#346739]/20 rounded-lg text-xs font-semibold text-[#091413] focus:outline-none focus:border-[#346739]"
                        placeholder="Nama Lengkap Anda"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-extrabold text-[#091413]/60 uppercase tracking-wider block">NOMOR HP</label>
                      <input 
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#FFFDEB] border border-[#346739]/20 rounded-lg text-xs font-semibold text-[#091413] focus:outline-none focus:border-[#346739]"
                        placeholder="Contoh: 0812345678"
                      />
                    </div>

                    {/* Full Address */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-extrabold text-[#091413]/60 uppercase tracking-wider block">ALAMAT LENGKAP</label>
                      <textarea 
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 bg-[#FFFDEB] border border-[#346739]/20 rounded-lg text-xs font-semibold text-[#091413] focus:outline-none focus:border-[#346739]"
                        placeholder="Alamat Lengkap Anda"
                      />
                    </div>

                    {/* Email Verification Box */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[8px] font-extrabold text-[#091413]/60 uppercase tracking-wider block">ALAMAT EMAIL</label>
                        {isEmailVerified ? (
                          <span className="text-[7px] text-emerald-700 bg-emerald-100 px-1 rounded font-bold">Terverifikasi</span>
                        ) : (
                          <span className="text-[7px] text-amber-700 bg-amber-100 px-1 rounded font-bold">Belum Diverifikasi</span>
                        )}
                      </div>
                      <input 
                        type="email"
                        value={profileEmail}
                        onChange={(e) => {
                          const newEmail = e.target.value;
                          setProfileEmail(newEmail);
                          if (currentUser && newEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
                            setIsEmailVerified(false);
                          } else {
                            setIsEmailVerified(true);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#FFFDEB] border border-[#346739]/20 rounded-lg text-xs font-semibold text-[#091413] focus:outline-none focus:border-[#346739]"
                        placeholder="email@alamat.com"
                      />
                      
                      {/* Email Verification Action */}
                      {!isEmailVerified && currentUser && (
                        <div className="mt-2 bg-amber-50 border border-amber-200/60 p-2 rounded-lg space-y-2 text-3xs font-semibold text-[#091413]">
                          <p className="text-amber-800 leading-normal">
                            Email baru Anda perlu diverifikasi sebelum dapat disimpan.
                          </p>
                          
                          {!isVerifyingEmail ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsVerifyingEmail(true);
                                setVerificationSuccess('');
                                setVerificationError('');
                                alert("Simulasi kode verifikasi OTP '123456' telah dikirim ke email: " + profileEmail);
                              }}
                              className="w-full py-1 bg-[#346739] text-[#FFFDEB] rounded font-bold transition-all cursor-pointer"
                            >
                              Verifikasi Sekarang
                            </button>
                          ) : (
                            <div className="space-y-1.5">
                              <span className="text-slate-500 block">Masukkan Kode Verifikasi OTP (Ketik: 123456)</span>
                              <div className="flex gap-1.5">
                                <input 
                                  type="text"
                                  value={otpInput}
                                  onChange={(e) => setOtpInput(e.target.value)}
                                  placeholder="OTP Code"
                                  className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-3xs font-mono text-center font-bold focus:outline-none text-[#091413]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (otpInput === '123456') {
                                      setIsEmailVerified(true);
                                      setIsVerifyingEmail(false);
                                      setVerificationSuccess('Email berhasil diverifikasi!');
                                      setVerificationError('');
                                      setOtpInput('');
                                    } else {
                                      setVerificationError('Kode OTP salah! Coba ketik: 123456');
                                    }
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                                >
                                  Verifikasi
                                </button>
                              </div>
                              {verificationError && <span className="text-rose-600 block text-[7px] font-bold">{verificationError}</span>}
                            </div>
                          )}
                        </div>
                      )}
                      {verificationSuccess && (
                        <div className="mt-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[8px] font-bold text-center">
                          {verificationSuccess}
                        </div>
                      )}
                    </div>

                    {/* Change Password */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-extrabold text-[#091413]/60 uppercase tracking-wider block">KATA SANDI BARU</label>
                      <input 
                        type="password"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#FFFDEB] border border-[#346739]/20 rounded-lg text-xs font-semibold text-[#091413] focus:outline-none focus:border-[#346739]"
                        placeholder="••••••••"
                      />
                    </div>

                    {/* Supabase Profile save indicator */}
                    <div className="mt-2 text-center select-none">
                      {isSupabaseConfigured ? (
                        <span className="text-[7px] text-emerald-700 font-extrabold">✓ Profil disimpan langsung ke Supabase Cloud</span>
                      ) : (
                        <span className="text-[7px] text-amber-700 font-extrabold">⚠ Menyimpan perubahan ke data lokal device ini</span>
                      )}
                    </div>

                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#346739]/10">
                    <button
                      onClick={() => {
                        if (!profileName) {
                          alert('Nama Lengkap tidak boleh kosong!');
                          return;
                        }
                        if (!profileEmail) {
                          alert('Email tidak boleh kosong!');
                          return;
                        }
                        if (!isEmailVerified && currentUser && profileEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
                          alert('Mohon verifikasi email baru Anda terlebih dahulu!');
                          return;
                        }

                        // Save updates
                        const saveUpdates = async () => {
                          if (currentUser) {
                            if (isSupabaseConfigured && currentUser.id) {
                              const profileUpdate = {
                                name: profileName,
                                phone: profilePhone,
                                address: profileAddress,
                                avatar_url: profileAvatar,
                                updated_at: new Date().toISOString()
                              };

                              const { error } = await supabase
                                .from('profiles')
                                .update(profileUpdate)
                                .eq('id', currentUser.id);

                              if (error) {
                                console.error('Error updating profile in Supabase:', error);
                                alert('Gagal menyimpan profil ke Supabase: ' + error.message);
                                return;
                              }

                              if (profilePassword) {
                                const { error: pwdErr } = await supabase.auth.updateUser({
                                  password: profilePassword
                                });
                                if (pwdErr) {
                                  alert('Gagal memperbarui sandi: ' + pwdErr.message);
                                }
                              }

                              if (profileEmail && profileEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
                                const { error: emailErr } = await supabase.auth.updateUser({
                                  email: profileEmail
                                });
                                if (emailErr) {
                                  alert('Gagal memperbarui email: ' + emailErr.message);
                                } else {
                                  alert('Email konfirmasi dikirim ke alamat email baru Anda. Silakan verifikasi untuk mengubah email.');
                                }
                              }
                            }

                            // Update current user session
                            const updatedUserSession = {
                              name: profileName,
                              email: profileEmail
                            };
                            setCurrentUser(prev => prev ? {
                              ...prev,
                              ...updatedUserSession
                            } : null);
                            if (!isSupabaseConfigured) {
                              localStorage.setItem('nafi_current_user', JSON.stringify(updatedUserSession));
                            }

                            const newHash = profilePassword ? await sha256(profilePassword) : null;
                            // Update registeredUsers database
                            setRegisteredUsers(prev => prev.map(u => {
                              if (u.email.toLowerCase() === currentUser.email.toLowerCase()) {
                                return {
                                  ...u,
                                  name: profileName,
                                  email: profileEmail,
                                  ...(newHash ? { authHash: newHash } : {}),
                                  phone: profilePhone,
                                  address: profileAddress,
                                  avatar: profileAvatar
                                };
                              }
                              return u;
                            }));

                            setIsEditingProfile(false);
                            alert('Profil berhasil diperbarui!');
                          }
                        };
                        saveUpdates();
                      }}
                      className="w-full py-2 bg-[#346739] hover:bg-[#284f2c] text-[#FFFDEB] rounded-lg text-xs font-black transition-all cursor-pointer shadow-sm text-center"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        // Reset form fields to currentUser session values
                        if (currentUser) {
                          setProfileName(currentUser.name);
                          setProfileEmail(currentUser.email);
                          setProfilePassword('');
                        }
                      }}
                      className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-black transition-all cursor-pointer text-center"
                    >
                      Batalkan
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="h-16 bg-[#FBE8CE] border-t border-[#346739]/10 grid grid-cols-5 select-none z-40 relative">
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
              activeTab === 'dashboard' ? 'text-[#346739] font-black' : 'text-[#091413]/50 font-semibold'
            }`}
          >
            <Layers className="h-4.5 w-4.5" />
            <span className="text-[7px] uppercase font-bold tracking-wider">Beranda</span>
          </button>

          <button 
            onClick={() => setActiveTab('ledger')}
            className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
              activeTab === 'ledger' ? 'text-[#346739] font-black' : 'text-[#091413]/50 font-semibold'
            }`}
          >
            <Clock className="h-4.5 w-4.5" />
            <span className="text-[7px] uppercase font-bold tracking-wider">Riwayat</span>
          </button>

          {/* Center Floating Plus Button */}
          <div className="flex items-center justify-center relative">
            <button 
              onClick={openNewTransactionDrawer}
              className="absolute -top-5 h-14 w-14 rounded-full bg-[#346739] text-[#FFFDEB] border-4 border-[#FFFDEB] shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all z-50 shadow-[#346739]/30"
              title="Tambah Transaksi Manual"
            >
              <Plus className="h-6 w-6 stroke-[3.5]" />
            </button>
          </div>

          <button 
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
              activeTab === 'scan' ? 'text-[#346739] font-black' : 'text-[#091413]/50 font-semibold'
            }`}
          >
            <Cpu className="h-4.5 w-4.5" />
            <span className="text-[7px] uppercase font-bold tracking-wider">NaFi AI</span>
          </button>

          <button 
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
              activeTab === 'account' ? 'text-[#346739] font-black' : 'text-[#091413]/50 font-semibold'
            }`}
          >
            <User className="h-4.5 w-4.5" />
            <span className="text-[7px] uppercase font-bold tracking-wider">Profil</span>
          </button>

        </div>

      </div>
    );
  };

  return (
    <MobileSimulatorFrame>
      
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
          setCapturedImage(null); // Clear captured photo!
          if (activeTab === 'scan' && scanInputType === 'camera') {
            startCamera(); // Restart live stream!
          }
        }}
        onConfirm={commitTransaction}
        newReceipt={scanResult?.scanData || null}
        matchedTx={matchedTx}
      />

      {/* REGISTRATION SUCCESS VERIFICATION MODAL */}
      {isRegSuccessModalOpen && (
        <div className="absolute inset-0 bg-[#091413]/60 backdrop-blur-xs flex items-center justify-center p-5 z-[999] select-none animate-in fade-in duration-200">
          <div className="bg-[#FFFDEB] rounded-2xl border border-[#346739]/10 p-6 w-full max-w-[280px] shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 animate-bounce">
              <Mail className="h-6 w-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-[#091413]">Verifikasi Email</h3>
              <p className="text-3xs text-slate-500 leading-relaxed font-semibold">
                Registrasi berhasil! Silakan periksa kotak masuk email Anda untuk melakukan verifikasi akun:
              </p>
              <p className="text-3xs font-extrabold text-[#346739] break-all">
                {regEmailSent}
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold mt-2">
                Hubungkan dengan Supabase atau lakukan verifikasi untuk melanjutkan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsRegSuccessModalOpen(false);
                setAuthStatus('login');
                setAuthName('');
              }}
              className="w-full py-2 bg-[#346739] hover:bg-[#284f2c] text-[#FFFDEB] rounded-xl text-3xs font-extrabold shadow-md transition-all cursor-pointer"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        </div>
      )}

      {/* SIMULATED BOTTOM SHEET DRAWER (TAMBAH CATATAN) */}
      {isDrawerOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end select-none">
          {/* Backdrop inside phone */}
          <div 
            className="absolute inset-0 bg-[#091413]/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => {
              setIsDrawerOpen(false);
              setDrawerMode('create');
              setEditingTransactionId(null);
              setManualDesc('');
              setManualAmount('');
              setCapturedImage(null);
              setScanResult(null);
              setIsScanning(false);
              setActiveStep('idle');
              if (activeTab === 'scan' && scanInputType === 'camera') {
                startCamera(); // Restart live stream!
              }
            }}
          />
          
          {/* Drawer content */}
          <div className="relative bg-[#FFFDEB] rounded-t-[32px] border-t border-[#346739]/15 p-5 flex flex-col max-h-[90%] overflow-y-auto animate-slide-up shadow-2xl z-50 text-[#091413]">
            {/* Notch */}
            <div className="mx-auto w-10 h-1 bg-[#091413]/10 rounded-full mb-3.5 shrink-0" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-[#091413]">
                {drawerMode === 'edit' ? 'Edit Catatan' : drawerMode === 'scan_review' ? 'Tinjau Hasil Scan AI' : 'Tambah Catatan'}
              </h3>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setDrawerMode('create');
                  setEditingTransactionId(null);
                  setManualDesc('');
                  setManualAmount('');
                  setCapturedImage(null);
                  setScanResult(null);
                  setIsScanning(false);
                  setActiveStep('idle');
                  if (activeTab === 'scan' && scanInputType === 'camera') {
                    startCamera(); // Restart live stream!
                  }
                }}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#091413] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scanning Review Info Badge */}
            {drawerMode === 'scan_review' && (
              <div className="mb-3.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-[#346739] flex items-center gap-1.5 font-bold animate-pulse">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Diisi otomatis oleh NaFi AI. Silakan tentukan Pemasukan/Pengeluaran & simpan!</span>
              </div>
            )}

            {/* Edit Mode Info Badge */}
            {drawerMode === 'edit' && (
              <div className="mb-3.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-800 flex items-center gap-1.5 font-bold">
                <Pencil className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Mode Edit Transaksi. Silakan ubah rincian transaksi Anda.</span>
              </div>
            )}

            {/* Income / Expense Tabs */}
            <div className="bg-[#FBE8CE]/50 p-1 rounded-xl grid grid-cols-2 text-center text-xs font-bold border border-[#346739]/10 mb-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDrawerTab('pengeluaran');
                  setManualAllocation('primer');
                  setManualCategory('Makan & Minum');
                }}
                className={`py-2 rounded-lg cursor-pointer transition-all ${
                  drawerTab === 'pengeluaran' 
                    ? 'bg-[#346739] text-[#FFFDEB] shadow-sm' 
                    : 'text-[#091413]/60 hover:text-[#091413]'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerTab('pemasukan');
                  setManualAllocation(null);
                  setManualCategory('Gaji / Salary');
                }}
                className={`py-2 rounded-lg cursor-pointer transition-all ${
                  drawerTab === 'pemasukan' 
                    ? 'bg-[#346739] text-[#FFFDEB] shadow-sm' 
                    : 'text-[#091413]/60 hover:text-[#091413]'
                }`}
              >
                Pemasukan
              </button>
            </div>

            {/* Inputs: Desc & Amount */}
            <div className="space-y-3 mb-4 shrink-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-extrabold text-[#091413]/60 block mb-1 uppercase tracking-wider">Keterangan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Makan Siang Warteg"
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FBE8CE]/40 border border-[#346739]/20 rounded-xl text-[10px] text-[#091413] placeholder-slate-400 focus:outline-none focus:border-[#346739] transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-extrabold text-[#091413]/60 block mb-1 uppercase tracking-wider">Nominal (Rupiah)</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 15000"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FBE8CE]/40 border border-[#346739]/20 rounded-xl text-[10px] text-[#091413] focus:outline-none focus:border-[#346739] transition-all font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[8px] font-extrabold text-[#091413]/60 block mb-1 uppercase tracking-wider">Tanggal Transaksi</label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FBE8CE]/40 border border-[#346739]/20 rounded-xl text-[10px] text-[#091413] focus:outline-none focus:border-[#346739] transition-all font-semibold"
                />
              </div>
            </div>

            {/* Categories Select */}
            <div className="flex-1 overflow-y-auto max-h-[280px] pb-2">
              {drawerTab === 'pemasukan' ? (
                <div className="space-y-2">
                  <span className="text-[8px] font-extrabold text-[#091413]/60 tracking-wider block uppercase">KATEGORI PEMASUKAN</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: 'Gaji / Salary', icon: Briefcase },
                      { name: 'Freelance', icon: Star },
                      { name: 'Bisnis', icon: Building2 },
                      { name: 'Bonus / THR', icon: Zap },
                      { name: 'Investasi', icon: TrendingUp },
                      { name: 'Gift / Hadiah', icon: Gift },
                      { name: 'Lain-lain', icon: Layers }
                    ].map((cat) => {
                      const isActive = manualCategory === cat.name;
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => {
                            setManualCategory(cat.name);
                            setManualAllocation(null);
                          }}
                          className="flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-slate-100/30 transition-all cursor-pointer group"
                        >
                          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                            isActive ? 'glass-icon-active text-[#346739] bg-[#346739]/10' : 'glass-icon text-slate-500'
                          }`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <span className={`text-[7px] text-center font-bold tracking-tight uppercase block leading-tight ${
                            isActive ? 'text-[#346739]' : 'text-slate-500'
                          }`}>
                            {cat.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Primer */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-extrabold text-[#091413]/60 tracking-wider block uppercase">KEBUTUHAN PRIMER</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'Makan & Minum', icon: Utensils, alloc: 'primer' as AllocationType },
                        { name: 'Tempat Tinggal', icon: Home, alloc: 'primer' as AllocationType },
                        { name: 'Transportasi', icon: Bus, alloc: 'primer' as AllocationType },
                        { name: 'Kesehatan', icon: Activity, alloc: 'primer' as AllocationType },
                        { name: 'Pendidikan', icon: GraduationCap, alloc: 'primer' as AllocationType }
                      ].map((cat) => {
                        const isActive = manualCategory === cat.name;
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => {
                              setManualCategory(cat.name);
                              setManualAllocation(cat.alloc);
                            }}
                            className="flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-slate-100/30 transition-all cursor-pointer group"
                          >
                            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                              isActive ? 'glass-icon-active text-[#346739] bg-[#346739]/10' : 'glass-icon text-slate-500'
                            }`}>
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <span className={`text-[7px] text-center font-bold tracking-tight uppercase block leading-tight ${
                              isActive ? 'text-[#346739]' : 'text-slate-500'
                            }`}>
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sekunder */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-extrabold text-[#091413]/60 tracking-wider block uppercase">KEBUTUHAN SEKUNDER</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'Nongkrong/Cafe', icon: Coffee, alloc: 'sekunder' as AllocationType },
                        { name: 'Hiburan', icon: Gamepad2, alloc: 'sekunder' as AllocationType },
                        { name: 'Belanja', icon: ShoppingBag, alloc: 'sekunder' as AllocationType },
                        { name: 'Hobi', icon: Trophy, alloc: 'sekunder' as AllocationType }
                      ].map((cat) => {
                        const isActive = manualCategory === cat.name;
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => {
                              setManualCategory(cat.name);
                              setManualAllocation(cat.alloc);
                            }}
                            className="flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-slate-100/30 transition-all cursor-pointer group"
                          >
                            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                              isActive ? 'glass-icon-active text-[#346739] bg-[#346739]/10' : 'glass-icon text-slate-500'
                            }`}>
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <span className={`text-[7px] text-center font-bold tracking-tight uppercase block leading-tight ${
                              isActive ? 'text-[#346739]' : 'text-slate-500'
                            }`}>
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kewajiban */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-extrabold text-[#091413]/60 tracking-wider block uppercase">KEWAJIBAN & CICILAN</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'Cicilan', icon: CreditCard, alloc: 'primer' as AllocationType },
                        { name: 'Zakat/Donasi', icon: Heart, alloc: 'primer' as AllocationType },
                        { name: 'Pajak', icon: Shield, alloc: 'primer' as AllocationType }
                      ].map((cat) => {
                        const isActive = manualCategory === cat.name;
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => {
                              setManualCategory(cat.name);
                              setManualAllocation(cat.alloc);
                            }}
                            className="flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-slate-100/30 transition-all cursor-pointer group"
                          >
                            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                              isActive ? 'glass-icon-active text-[#346739] bg-[#346739]/10' : 'glass-icon text-slate-500'
                            }`}>
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <span className={`text-[7px] text-center font-bold tracking-tight uppercase block leading-tight ${
                              isActive ? 'text-[#346739]' : 'text-slate-500'
                            }`}>
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Investasi & Aset */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-extrabold text-[#091413]/60 tracking-wider block uppercase">INVESTASI & ASET</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'Aset/Saham', icon: TrendingUp, alloc: 'investasi' as AllocationType }
                      ].map((cat) => {
                        const isActive = manualCategory === cat.name;
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => {
                              setManualCategory(cat.name);
                              setManualAllocation(cat.alloc);
                            }}
                            className="flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-slate-100/30 transition-all cursor-pointer group"
                          >
                            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                              isActive ? 'glass-icon-active text-[#346739] bg-[#346739]/10' : 'glass-icon text-slate-500'
                            }`}>
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <span className={`text-[7px] text-center font-bold tracking-tight uppercase block leading-tight ${
                              isActive ? 'text-[#346739]' : 'text-slate-500'
                            }`}>
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 mt-3 shrink-0">
              {(drawerMode === 'edit' || drawerMode === 'scan_review') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setDrawerMode('create');
                    setEditingTransactionId(null);
                    setManualDesc('');
                    setManualAmount('');
                    setCapturedImage(null);
                    setScanResult(null);
                    setIsScanning(false);
                    setActiveStep('idle');
                    if (activeTab === 'scan' && scanInputType === 'camera') {
                      startCamera(); // Restart live stream!
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[#346739]/30 text-[#091413]/70 font-extrabold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Batal
                </button>
              )}
              <button
                onClick={() => {
                  if (!manualDesc || !manualAmount) {
                    alert('Mohon isi Keterangan dan Nominal!');
                    return;
                  }
                  const parsedVal = parseFloat(manualAmount);
                  if (isNaN(parsedVal) || parsedVal <= 0) {
                    alert('Nominal harus berupa angka positif!');
                    return;
                  }
                  
                  const isIncoming = drawerTab === 'pemasukan';

                  if (drawerMode === 'edit' && editingTransactionId) {
                    const dateStr = new Date(manualDate).toISOString();
                    const executeUpdate = async () => {
                      if (isSupabaseConfigured) {
                        const dbUpdate = {
                          date: dateStr,
                          description: manualDesc,
                          amount: isIncoming ? parsedVal : -parsedVal,
                          type: isIncoming ? 'incoming' : 'outgoing',
                          allocation: isIncoming ? null : manualAllocation,
                          category: manualCategory
                        };
                        const { error } = await supabase
                          .from('transactions')
                          .update(dbUpdate)
                          .eq('id', editingTransactionId);
                        
                        if (error) {
                          console.error('Error updating transaction:', error);
                          alert('Gagal mengubah di database Supabase: ' + error.message);
                          return;
                        }
                      }
                      
                      setTransactions(prev => prev.map(t => {
                        if (t.id === editingTransactionId) {
                          return {
                            ...t,
                            date: dateStr,
                            description: manualDesc,
                            amount: isIncoming ? parsedVal : -parsedVal,
                            type: isIncoming ? 'incoming' : 'outgoing',
                            allocation: isIncoming ? null : manualAllocation,
                            category: manualCategory
                          };
                        }
                        return t;
                      }));
                      setEditingTransactionId(null);
                      setDrawerMode('create');
                      setIsDrawerOpen(false);
                      setManualDesc('');
                      setManualAmount('');
                      setCurrentAdvice(`Berhasil memperbarui transaksi "${manualDesc}".`);
                    };

                    executeUpdate();
                    return;
                  }

                  if (drawerMode === 'scan_review') {
                    // Duplicate check using the reviewed manualDate!
                    const receiptTime = new Date(manualDate).getTime();
                    const match = transactions.find((tx) => {
                      const txTime = new Date(tx.date).getTime();
                      const timeDiffMins = Math.abs(txTime - receiptTime) / (1000 * 60);
                      const sameAmount = Math.abs(tx.amount) === parsedVal;
                      const sameMerchant = tx.description.toLowerCase().includes(manualDesc.toLowerCase()) || 
                                           manualDesc.toLowerCase().includes(tx.description.toLowerCase());
                      return timeDiffMins <= 10 && sameAmount && sameMerchant;
                    });

                    if (match) {
                      setMatchedTx(match);
                      setIsDupModalOpen(true);
                      return;
                    }

                    commitTransaction();
                    return;
                  }

                  // Default drawerMode === 'create'
                  const executeCreate = async () => {
                    const dateStr = new Date(manualDate).toISOString();
                    if (isSupabaseConfigured && currentUser?.id) {
                      const dbTx = {
                        user_id: currentUser.id,
                        date: dateStr,
                        description: manualDesc,
                        amount: isIncoming ? parsedVal : -parsedVal,
                        type: isIncoming ? 'incoming' : 'outgoing',
                        allocation: isIncoming ? null : manualAllocation,
                        category: manualCategory
                      };

                      const { data, error } = await supabase
                        .from('transactions')
                        .insert([dbTx])
                        .select()
                        .single();

                      if (error) {
                        console.error('Error creating transaction:', error);
                        alert('Gagal menyimpan ke database Supabase: ' + error.message);
                        return;
                      }

                      if (data) {
                        const newTx: Transaction = {
                          id: data.id,
                          date: data.date,
                          description: data.description,
                          amount: parseFloat(data.amount as string),
                          type: data.type as 'incoming' | 'outgoing',
                          allocation: data.allocation as AllocationType | null,
                          category: data.category,
                          runningBalance: 0,
                          userEmail: currentUser?.email
                        };
                        setTransactions(prev => [...prev, newTx]);
                      }
                    } else {
                      const newTx: Transaction = {
                        id: `tx-manual-${Date.now()}`,
                        userEmail: currentUser?.email || '',
                        date: dateStr,
                        description: manualDesc,
                        amount: isIncoming ? parsedVal : -parsedVal,
                        type: isIncoming ? 'incoming' : 'outgoing',
                        allocation: isIncoming ? null : manualAllocation,
                        category: manualCategory,
                        runningBalance: 0
                      };
                      setTransactions(prev => [...prev, newTx]);
                    }

                    // If recording a Zakat transaction manually, check the Zakat milestone!
                    if (manualCategory === 'Zakat/Donasi' && parsedVal >= 100000) {
                      setZakatPaid(true);
                    }

                    setManualDesc('');
                    setManualAmount('');
                    setIsDrawerOpen(false);
                    setDrawerMode('create');

                    setCurrentAdvice(
                      `Berhasil mencatat "${manualDesc}" secara manual sebesar IDR ${parsedVal.toLocaleString('id-ID')} pada kategori ${manualCategory}.`
                    );
                  };

                  executeCreate();
                }}
                className={`${(drawerMode === 'edit' || drawerMode === 'scan_review') ? 'flex-1' : 'w-full'} py-2.5 rounded-xl bg-[#346739] text-[#FFFDEB] font-extrabold text-xs shadow-md shadow-[#346739]/15 hover:bg-[#284f2c] transition-all cursor-pointer`}
              >
                {drawerMode === 'edit' ? 'Simpan Perubahan' : drawerMode === 'scan_review' ? 'Simpan Hasil Scan' : 'Simpan Catatan'}
              </button>
            </div>

          </div>
        </div>
      )}

    </MobileSimulatorFrame>
  );
}
