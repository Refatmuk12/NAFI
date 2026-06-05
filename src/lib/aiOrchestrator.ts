import { ReceiptScanResult, Transaction, AllocationType } from '@/types/financial';

export interface AgentLogEvent {
  step: 'gemini' | 'claude' | 'gpt' | 'completed';
  logs: string[];
  partialData?: any;
}

export function simulateMultiAgentPipeline(
  receipt: ReceiptScanResult,
  existingTransactions: Transaction[],
  onLog: (event: AgentLogEvent) => void
): Promise<{
  scanData: ReceiptScanResult;
  isDuplicate: boolean;
  allocation: AllocationType;
  category: string;
  gptAdvice: string;
}> {
  return new Promise((resolve) => {
    let currentLogs: string[] = [];

    // --- AGENT 1: GEMINI (OCR) ---
    setTimeout(() => {
      currentLogs = [
        '🔄 [GEMINI 2.5 FLASH] Connecting to Vision Core API...',
        '📸 [GEMINI 2.5 FLASH] Image payload received (1.4 MB).',
        '🔍 [GEMINI 2.5 FLASH] Running OCR character segmentation...',
        `📄 [GEMINI 2.5 FLASH] Detected merchant: "${receipt.merchantName}"`,
        `📄 [GEMINI 2.5 FLASH] Extracted items: ${receipt.items.length} positions found.`,
        `📄 [GEMINI 2.5 FLASH] Extracted raw amount: IDR ${receipt.totalAmount.toLocaleString('id-ID')}`,
        '✅ [GEMINI 2.5 FLASH] Formatted raw JSON output successfully.'
      ];
      onLog({ step: 'gemini', logs: [...currentLogs], partialData: receipt });

      // --- AGENT 2: CLAUDE (Financial Rules & Classification) ---
      setTimeout(() => {
        // Run classification
        const merchantLower = receipt.merchantName.toLowerCase();
        let allocation: AllocationType = 'primer';
        let category = 'Lain-lain (Primer)';

        if (
          merchantLower.includes('midi') ||
          merchantLower.includes('indo') ||
          merchantLower.includes('mart')
        ) {
          allocation = 'primer';
          category = 'Belanja Grosir';
        } else if (
          merchantLower.includes('warteg') ||
          merchantLower.includes('makan') ||
          merchantLower.includes('resto')
        ) {
          allocation = 'primer';
          category = 'Makanan Harian';
        } else if (
          merchantLower.includes('starbucks') ||
          merchantLower.includes('kenangan') ||
          merchantLower.includes('cafe') ||
          merchantLower.includes('kopi')
        ) {
          allocation = 'sekunder';
          category = 'Hiburan & Gaya Hidup';
        } else if (
          merchantLower.includes('bibit') ||
          merchantLower.includes('reksa') ||
          merchantLower.includes('saham') ||
          merchantLower.includes('invest')
        ) {
          allocation = 'investasi';
          category = 'Investasi';
        }

        // Duplicate Check Rules (Business Rules: ±10 min, identical amount, identical merchant)
        const receiptTime = new Date(receipt.date).getTime();
        const isDuplicate = existingTransactions.some((tx) => {
          const txTime = new Date(tx.date).getTime();
          const timeDiffMins = Math.abs(txTime - receiptTime) / (1000 * 60);
          const sameAmount = Math.abs(tx.amount) === receipt.totalAmount;
          const sameMerchant = tx.description.toLowerCase().includes(receipt.merchantName.toLowerCase()) || 
                               receipt.merchantName.toLowerCase().includes(tx.description.toLowerCase());
          return timeDiffMins <= 10 && sameAmount && sameMerchant;
        });

        currentLogs = [
          ...currentLogs,
          '🔄 [CLAUDE 3.5 SONNET] Running accounting engine validation...',
          '⚡ [CLAUDE 3.5 SONNET] Received Gemini OCR output schema.',
          `🔎 [CLAUDE 3.5 SONNET] Auditing transaction logs for duplicates (delta ±10 mins)...`,
          isDuplicate 
            ? `⚠️ [CLAUDE 3.5 SONNET] ALERT: Potential duplicate detected! Match found within 10 min window.` 
            : '✅ [CLAUDE 3.5 SONNET] Duplicate check passed. No duplicates found.',
          `🏷️ [CLAUDE 3.5 SONNET] Running 60-20-20 mapping algorithm for merchant: "${receipt.merchantName}"`,
          `🎯 [CLAUDE 3.5 SONNET] Classified to Pos: [${allocation.toUpperCase()}] Category: "${category}"`,
          '🛡️ [CLAUDE 3.5 SONNET] Enforcing database integers accuracy & SQL sanitization.'
        ];
        onLog({
          step: 'claude',
          logs: [...currentLogs],
          partialData: { receipt, isDuplicate, allocation, category }
        });

        // --- AGENT 3: GPT-4o (Advisory Core) ---
        setTimeout(() => {
          // Calculate mock advice
          let gptAdvice = '';
          if (allocation === 'sekunder') {
            gptAdvice = `Pengeluaran di "${receipt.merchantName}" sebesar IDR ${receipt.totalAmount.toLocaleString('id-ID')} masuk dalam kategori Sekunder/Keinginan. Saldo berjalan Anda terpantau aman, namun pastikan akumulasi pos sekunder Anda tidak melebihi batas bulanan 20% agar alokasi investasi Anda tetap optimal.`;
          } else if (allocation === 'primer') {
            gptAdvice = `Pencatatan kebutuhan Primer sebesar IDR ${receipt.totalAmount.toLocaleString('id-ID')} berhasil diverifikasi. Ini adalah pos pengeluaran wajib. Pengeluaran primer Anda masih berada di dalam batas aman 60%. Pertahankan kontrol belanja bulanan Anda.`;
          } else {
            gptAdvice = `Alokasi investasi baru sebesar IDR ${receipt.totalAmount.toLocaleString('id-ID')} terdeteksi. Ini adalah kebiasaan keuangan yang sangat baik untuk mengamankan aset masa depan Anda. Saldo darurat dan portofolio investasi Anda bertambah aman.`;
          }

          currentLogs = [
            ...currentLogs,
            '🔄 [GPT-4o ADVISOR] Activating Financial Advisory Core...',
            '📊 [GPT-4o ADVISOR] Analyzing running balance and budget limits (60-20-20)...',
            '💡 [GPT-4o ADVISOR] Generating personalized wealth management advice...',
            '✅ [GPT-4o ADVISOR] Advice payload compiled.'
          ];
          
          onLog({
            step: 'gpt',
            logs: [...currentLogs],
            partialData: { receipt, isDuplicate, allocation, category, gptAdvice }
          });

          // --- PIPELINE COMPLETED ---
          setTimeout(() => {
            onLog({ step: 'completed', logs: [...currentLogs] });
            resolve({
              scanData: receipt,
              isDuplicate,
              allocation,
              category,
              gptAdvice
            });
          }, 600);
        }, 1200);
      }, 1400);
    }, 1200);
  });
}
