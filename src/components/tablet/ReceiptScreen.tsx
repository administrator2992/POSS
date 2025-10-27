import { useState, useEffect } from 'react';
import { Order } from '../TabletPOS';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { dbService, Transaction } from '../../services/DatabaseService';

// Utility function to simulate printing
const printReceipt = async (receiptContent: string) => {
  try {
    // In a real implementation with Capacitor or other native plugins,
    // this would connect to a physical printer
    
    // For web browsers, we can use the browser's print functionality
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk Pembayaran</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .receipt { max-width: 300px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .items { margin-bottom: 20px; }
              .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .totals { border-top: 1px solid #000; padding-top: 10px; }
              .total { display: flex; justify-content: space-between; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${receiptContent}
            </div>
            <script>
              window.onload = function() {
                window.print();
                // Close the window after printing (may not work in all browsers)
                setTimeout(function() { window.close(); }, 1000);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Print error:', error);
    return false;
  }
};

interface ReceiptScreenProps {
  order: Order;
  onNewOrder: () => void;
  cashierName: string;
}

export function ReceiptScreen({ order, onNewOrder, cashierName }: ReceiptScreenProps) {
  const [transactionId, setTransactionId] = useState<string>('');

  useEffect(() => {
    // Save transaction to database when component mounts
    const saveTransaction = async () => {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        orderId: `ORD-${Date.now()}`,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        timestamp: new Date().toISOString(),
        cashier: cashierName
      };
      
      await dbService.addTransaction(newTransaction);
      setTransactionId(newTransaction.id);
    };
    
    saveTransaction();
  }, [order, cashierName]);

  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatRupiah = (amount: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrint = async () => {
    try {
      // Create receipt content
      const receiptContent = `
        <div class="header">
          <h2>Toko Kue</h2>
          <p>Jl. Raya Bakery No. 123</p>
          <p>Tel: (021) 123-4567</p>
          <p>${currentDate}</p>
          ${transactionId ? `<p>ID Transaksi: ${transactionId}</p>` : ''}
        </div>
        
        <div class="items">
          ${order.items.map(item => `
            <div class="item">
              <span>${item.quantity}x ${item.name}</span>
              <span>${formatRupiah(item.price * item.quantity)}</span>
            </div>
            ${item.modifiers && item.modifiers.length > 0 ? `<div style="margin-left: 10px; font-size: 12px;">${item.modifiers.join(', ')}</div>` : ''}
            ${item.notes ? `<div style="margin-left: 10px; font-size: 12px; font-style: italic;">Catatan: ${item.notes}</div>` : ''}
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="item">
            <span>Subtotal</span>
            <span>${formatRupiah(order.subtotal)}</span>
          </div>
          ${order.discount > 0 ? `
            <div class="item" style="color: orange;">
              <span>Diskon</span>
              <span>-${formatRupiah(order.discount)}</span>
            </div>
          ` : ''}
          <div class="item">
            <span>Pajak (10%)</span>
            <span>${formatRupiah(order.tax)}</span>
          </div>
          <div class="total">
            <span>Total</span>
            <span>${formatRupiah(order.total)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Terima kasih atas pembelian Anda!</p>
          <p>Silakan kembali lagi</p>
        </div>
      `;

      // Try to print
      const success = await printReceipt(receiptContent);
      
      if (success) {
        toast.success('Struk berhasil dicetak!');
      } else {
        // Fallback to showing receipt content in a modal
        toast.info('Silakan gunakan fungsi print browser untuk mencetak struk');
      }
    } catch (error) {
      toast.error('Gagal mencetak struk. Periksa koneksi printer.');
    }
  };

  const handleNoReceipt = () => {
    toast.info('Tidak ada struk dicetak');
    onNewOrder();
  };

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 p-2">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col h-full">
        {/* Success Header */}
        <div className="bg-orange-600 text-white p-3 text-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
          <h1 className="mb-1 text-base">Pembayaran Berhasil!</h1>
          <p className="text-xs">Transaksi selesai</p>
        </div>

        {/* Receipt Content */}
        <div className="p-4 flex flex-col flex-1 min-h-0">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex-1 min-h-0 flex flex-col">
            {/* Scrollable receipt content */}
            <div className="overflow-auto flex-1 min-h-0">
              {/* Store Info */}
              <div className="text-center mb-3">
                <h2 className="text-gray-900 mb-1 text-base">Toko Kue</h2>
                <p className="text-gray-600 text-xs">Jl. Raya Bakery No. 123</p>
                <p className="text-gray-600 text-xs">Tel: (021) 123-4567</p>
                <p className="text-gray-600 mt-1 text-xs">{currentDate}</p>
                {transactionId && (
                  <p className="text-gray-600 mt-1 text-xs">ID Transaksi: {transactionId}</p>
                )}
              </div>

              <div className="border-t border-gray-300 pt-2 mb-2">
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-gray-900 text-xs">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatRupiah(item.price * item.quantity)}</span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="text-gray-500 ml-3 text-xs">
                          {item.modifiers.join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-gray-500 italic ml-3 text-xs">
                          Catatan: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-300 pt-2 space-y-1">
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Subtotal</span>
                  <span>{formatRupiah(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-orange-600 text-xs">
                    <span>Diskon</span>
                    <span>-{formatRupiah(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Pajak (10%)</span>
                  <span>{formatRupiah(order.tax)}</span>
                </div>
                <div className="flex justify-between text-gray-900 pt-1 border-t border-gray-300 text-sm font-medium">
                  <span>Total</span>
                  <span>{formatRupiah(order.total)}</span>
                </div>
              </div>

              <div className="text-center mt-3 pt-3 border-t border-gray-300">
                <p className="text-gray-600 text-xs">Terima kasih atas pembelian Anda!</p>
                <p className="text-gray-600 text-xs">Silakan kembali lagi</p>
              </div>
            </div>
          </div>

          {/* Receipt Options - Fixed at bottom */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={handlePrint}
              className="flex flex-col items-center gap-1 p-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
            >
              <Printer className="w-4 h-4" />
              <span className="text-xs">Cetak Struk</span>
            </button>
            <button
              onClick={handleNoReceipt}
              className="flex flex-col items-center gap-1 p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <X className="w-4 h-4" />
              <span className="text-xs">Tidak Ada Struk</span>
            </button>
          </div>

          <button
            onClick={onNewOrder}
            className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm mt-3"
          >
            Pesanan Baru
          </button>
        </div>
      </div>
    </div>
  );
}