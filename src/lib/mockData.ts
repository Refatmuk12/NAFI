import { Transaction, ReceiptScanResult } from '@/types/financial';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    date: '2026-06-01T09:00:00Z',
    description: 'Gaji Bulanan PT NaFi Indonesia',
    amount: 15000000,
    type: 'incoming',
    allocation: null,
    category: 'Pendapatan',
    runningBalance: 15000000
  },
  {
    id: 'tx-2',
    date: '2026-06-01T14:30:00Z',
    description: 'Transfer Masuk - Budi Santoso',
    amount: 1200000,
    type: 'incoming',
    allocation: null,
    category: 'Pendapatan',
    runningBalance: 16200000
  },
  {
    id: 'tx-3',
    date: '2026-06-02T10:15:00Z',
    description: 'Belanja Bulanan Superindo',
    amount: -750000,
    type: 'outgoing',
    allocation: 'primer',
    category: 'Belanja Grosir',
    runningBalance: 15450000
  },
  {
    id: 'tx-4',
    date: '2026-06-02T19:00:00Z',
    description: 'Pembelian Token Listrik PLN',
    amount: -250000,
    type: 'outgoing',
    allocation: 'primer',
    category: 'Tagihan Utilitas',
    runningBalance: 15200000
  },
  {
    id: 'tx-5',
    date: '2026-06-03T12:00:00Z',
    description: 'Makan Siang - Warteg Kharisma Bahari',
    amount: -350000,
    type: 'outgoing',
    allocation: 'primer',
    category: 'Makanan Harian',
    runningBalance: 14850000
  },
  {
    id: 'tx-6',
    date: '2026-06-03T15:30:00Z',
    description: 'Es Kopi Susu - Kopi Kenangan Mall',
    amount: -95000,
    type: 'outgoing',
    allocation: 'sekunder',
    category: 'Kopi & Dine-out',
    runningBalance: 14755000
  },
  {
    id: 'tx-7',
    date: '2026-06-04T08:00:00Z',
    description: 'Pembelian Reksa Dana Sucorinvest Syariah',
    amount: -1500000,
    type: 'outgoing',
    allocation: 'investasi',
    category: 'Reksa Dana',
    runningBalance: 13255000
  },
  {
    id: 'tx-8',
    date: '2026-06-04T10:00:00Z',
    description: 'Topup Gopay Driver - Transportasi Kerja',
    amount: -120000,
    type: 'outgoing',
    allocation: 'primer',
    category: 'Transportasi',
    runningBalance: 13135000
  },
  {
    id: 'tx-9',
    date: '2026-06-04T11:45:00Z',
    description: 'Langganan Netflix Premium',
    amount: -186000,
    type: 'outgoing',
    allocation: 'sekunder',
    category: 'Membership Digital',
    runningBalance: 12949000
  }
];

export interface MockReceiptTemplate {
  id: string;
  name: string;
  imageName: string;
  imageUrl: string;
  data: ReceiptScanResult;
}

export const MOCK_RECEIPT_TEMPLATES: MockReceiptTemplate[] = [
  {
    id: 'rc-1',
    name: 'Alfamidi Supermarket',
    imageName: 'struk_alfamidi.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    data: {
      merchantName: 'ALFAMIDI DEPOK 2',
      date: '2026-06-04T16:30:00Z',
      items: [
        { name: 'Beras Setra Ramos 5kg', price: 79000, quantity: 1, total: 79000 },
        { name: 'Minyak Goreng Bimoli 2L', price: 38500, quantity: 1, total: 38500 },
        { name: 'Sariwangi Teh Celup 25s', price: 7500, quantity: 2, total: 15000 }
      ],
      tax: 12500,
      discount: 0,
      totalAmount: 145000
    }
  },
  {
    id: 'rc-2',
    name: 'Warteg Kharisma Bahari',
    imageName: 'struk_warteg.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    data: {
      merchantName: 'WARTEG KHARISMA BAHARI',
      date: '2026-06-04T12:00:00Z',
      items: [
        { name: 'Nasi Rames Rendang', price: 28000, quantity: 1, total: 28000 },
        { name: 'Tempe Oreng + Sayur', price: 5000, quantity: 1, total: 5000 },
        { name: 'Es Teh Manis', price: 4000, quantity: 1, total: 4000 }
      ],
      tax: 0,
      discount: 2000, // Diskon warung
      totalAmount: 35000
    }
  },
  {
    id: 'rc-3',
    name: 'Starbucks Senayan City',
    imageName: 'struk_starbucks.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    data: {
      merchantName: 'STARBUCKS COFFEE SENCITY',
      date: '2026-06-04T17:15:00Z',
      items: [
        { name: 'Grande Caffe Latte', price: 57000, quantity: 2, total: 114000 },
        { name: 'Butter Croissant', price: 34000, quantity: 1, total: 34000 }
      ],
      tax: 14800,
      discount: 0,
      totalAmount: 162800
    }
  },
  {
    id: 'rc-4',
    name: 'Kopi Kenangan (Potensi Duplikat)',
    imageName: 'struk_kenangan_dup.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    data: {
      merchantName: 'ES KOPI SUSU - KOPI KENANGAN MALL',
      date: '2026-06-03T15:30:00Z', // Identik dengan tx-6!
      items: [
        { name: 'Es Kopi Kenangan Mantan', price: 24000, quantity: 2, total: 48000 },
        { name: 'Cokelat Klasik Medium', price: 22000, quantity: 2, total: 44000 }
      ],
      tax: 3000,
      discount: 0,
      totalAmount: 95000 // Total dan merchant sama persis
    }
  }
];
