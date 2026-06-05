export type AllocationType = 'primer' | 'sekunder' | 'investasi';

export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface ReceiptScanResult {
  merchantName: string;
  items: ReceiptItem[];
  tax: number;
  discount: number;
  totalAmount: number;
  date: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO format or YYYY-MM-DD HH:mm
  description: string;
  amount: number; // positive for incoming, negative for outgoing
  type: 'incoming' | 'outgoing';
  allocation: AllocationType | null; // null for income/uncategorized
  category: string;
  runningBalance: number;
  userEmail?: string;
}

export type AgentStep = 'idle' | 'gemini' | 'claude' | 'gpt' | 'completed' | 'failed';

export interface AgentStatus {
  step: AgentStep;
  geminiLogs: string[];
  claudeLogs: string[];
  gptLogs: string[];
}
