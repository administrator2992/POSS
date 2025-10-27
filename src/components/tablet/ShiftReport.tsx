import { useState, useEffect } from 'react';
import { ArrowLeft, Banknote, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { dbService, Transaction } from '../../services/DatabaseService';

// Utility function to simulate printing
const printReport = async (reportContent: string) => {
  try {
    // In a real implementation with Capacitor or other native plugins,
    // this would connect to a physical printer
    
    // For web browsers, we can use the browser's print functionality
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laporan Shift</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .report { max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
              .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
              .card { border: 1px solid #ccc; border-radius: 8px; padding: 15px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            <div class="report">
              ${reportContent}
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

interface ShiftReportProps {
  employeeName: string;
  onBack: () => void;
}

// Helper function to format currency
const formatRupiah = (amount: number) => {
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format time
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function ShiftReport({ employeeName, onBack }: ShiftReportProps) {
  const [cashCounted, setCashCounted] = useState('');
  const [shiftData, setShiftData] = useState({
    startTime: new Date(),
    currentTime: new Date(),
    totalSales: 0,
    transactions: 0,
    averageTransaction: 0,
    cashExpected: 0,
    cardSales: 0,
    qrisSales: 0,
    topItems: [] as { name: string; quantity: number; revenue: number }[],
    hourlyBreakdown: [] as { hour: string; sales: number; transactions: number }[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShiftData = async () => {
      try {
        setLoading(true);
        const transactions = await dbService.getTransactions();
        
        // Filter transactions by current employee
        const employeeTransactions = transactions.filter(t => t.cashier === employeeName);
        
        // Calculate statistics
        let totalSales = 0;
        let cashSales = 0;
        let cardSales = 0;
        let qrisSales = 0;
        let itemQuantities: { [name: string]: { quantity: number; revenue: number } } = {};
        let hourlySales: { [hour: string]: { sales: number; transactions: number } } = {};
        
        // Process each transaction
        employeeTransactions.forEach(transaction => {
          totalSales += transaction.total;
          
          // For simplicity, we'll assume all transactions are cash
          // In a real implementation, you would track payment methods
          cashSales += transaction.total;
          
          // Process items for top items calculation
          transaction.items.forEach(item => {
            if (!itemQuantities[item.name]) {
              itemQuantities[item.name] = { quantity: 0, revenue: 0 };
            }
            itemQuantities[item.name].quantity += item.quantity;
            itemQuantities[item.name].revenue += item.price * item.quantity;
          });
          
          // Process hourly breakdown
          const transactionHour = new Date(transaction.timestamp).getHours();
          const hourKey = `${transactionHour}:00`;
          if (!hourlySales[hourKey]) {
            hourlySales[hourKey] = { sales: 0, transactions: 0 };
          }
          hourlySales[hourKey].sales += transaction.total;
          hourlySales[hourKey].transactions += 1;
        });
        
        // Convert item quantities to array and sort by quantity
        const topItems = Object.entries(itemQuantities)
          .map(([name, data]) => ({
            name,
            quantity: data.quantity,
            revenue: data.revenue
          }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
        
        // Convert hourly sales to array and sort by hour
        const hourlyBreakdown = Object.entries(hourlySales)
          .map(([hour, data]) => ({
            hour: `${hour} - ${parseInt(hour.split(':')[0]) + 1}:00`,
            sales: data.sales,
            transactions: data.transactions
          }))
          .sort((a, b) => {
            const hourA = parseInt(a.hour.split(':')[0]);
            const hourB = parseInt(b.hour.split(':')[0]);
            return hourA - hourB;
          });
        
        const averageTransaction = employeeTransactions.length > 0 
          ? totalSales / employeeTransactions.length 
          : 0;
        
        setShiftData({
          startTime: employeeTransactions.length > 0 
            ? new Date(employeeTransactions[employeeTransactions.length - 1].timestamp) 
            : new Date(),
          currentTime: new Date(),
          totalSales,
          transactions: employeeTransactions.length,
          averageTransaction,
          cashExpected: cashSales,
          cardSales,
          qrisSales,
          topItems,
          hourlyBreakdown
        });
      } catch (error) {
        console.error('Error loading shift data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadShiftData();
  }, [employeeName]);
  
  const cashDifference = cashCounted ? parseFloat(cashCounted) - shiftData.cashExpected : 0;

  const handlePrintReport = async () => {
    try {
      // Create report content
      const reportContent = `
        <div class="header">
          <h1>Laporan Shift</h1>
          <p>Karyawan: ${employeeName}</p>
          <p>Mulai Shift: ${formatTime(shiftData.startTime)}</p>
          <p>Waktu Saat Ini: ${formatTime(shiftData.currentTime)}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Ringkasan Penjualan</div>
          <div class="grid">
            <div class="card">
              <p>Total Penjualan: ${formatRupiah(shiftData.totalSales)}</p>
            </div>
            <div class="card">
              <p>Transaksi: ${shiftData.transactions}</p>
            </div>
            <div class="card">
              <p>Rata-rata Transaksi: ${formatRupiah(shiftData.averageTransaction)}</p>
            </div>
            <div class="card">
              <p>Pelanggan: ${shiftData.transactions}</p>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Metode Pembayaran</div>
          <div class="grid">
            <div class="card">
              <p>Tunai: ${formatRupiah(shiftData.cashExpected)}</p>
            </div>
            <div class="card">
              <p>Kartu: ${formatRupiah(shiftData.cardSales)}</p>
            </div>
            <div class="card">
              <p>QRIS: ${formatRupiah(shiftData.qrisSales)}</p>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Item Terlaris</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Terjual</th>
                <th>Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              ${shiftData.topItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatRupiah(item.revenue)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <div class="section-title">Rincian Per Jam</div>
          <table>
            <thead>
              <tr>
                <th>Jam</th>
                <th>Penjualan</th>
                <th>Transaksi</th>
                <th>Rata-rata/Transaksi</th>
              </tr>
            </thead>
            <tbody>
              ${shiftData.hourlyBreakdown.map(hour => `
                <tr>
                  <td>${hour.hour}</td>
                  <td>${formatRupiah(hour.sales)}</td>
                  <td>${hour.transactions}</td>
                  <td>${formatRupiah(hour.transactions > 0 ? hour.sales / hour.transactions : 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Try to print
      const success = await printReport(reportContent);
      
      if (success) {
        // Show success message
        alert('Laporan berhasil dicetak!');
      } else {
        // Fallback message
        alert('Silakan gunakan fungsi print browser untuk mencetak laporan');
      }
    } catch (error) {
      alert('Gagal mencetak laporan. Periksa koneksi printer.');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
          <h1 className="text-gray-900">Laporan Shift</h1>
          <div className="w-32"></div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Memuat data shift...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </button>
        <h1 className="text-gray-900">Laporan Shift</h1>
        <div className="w-32"></div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Shift Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-gray-900 mb-4">Informasi Shift</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-gray-600 mb-1">Karyawan</div>
                <div className="text-gray-900">{employeeName}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Mulai Shift</div>
                <div className="text-gray-900">{formatTime(shiftData.startTime)}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Waktu Saat Ini</div>
                <div className="text-gray-900">{formatTime(shiftData.currentTime)}</div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-gray-600 text-sm">Total Penjualan</div>
              </div>
              <div className="text-gray-900 text-lg">{formatRupiah(shiftData.totalSales)}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-gray-600 text-sm">Transaksi</div>
              </div>
              <div className="text-gray-900 text-lg">{shiftData.transactions}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-brown-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-brown-600" />
                </div>
                <div className="text-gray-600 text-sm">Rata-rata Transaksi</div>
              </div>
              <div className="text-gray-900 text-lg">{formatRupiah(shiftData.averageTransaction)}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-gray-600 text-sm">Pelanggan</div>
              </div>
              <div className="text-gray-900 text-lg">{shiftData.transactions}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-gray-900 mb-4">Metode Pembayaran</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Tunai</span>
                  <span className="text-gray-900">{formatRupiah(shiftData.cashExpected)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Kartu</span>
                  <span className="text-gray-900">{formatRupiah(shiftData.cardSales)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">QRIS</span>
                  <span className="text-gray-900">{formatRupiah(shiftData.qrisSales)}</span>
                </div>
              </div>

              {/* Cash Counting */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-gray-900 mb-2">Uang Tunai Dihitung</label>
                <input
                  type="number"
                  value={cashCounted}
                  onChange={(e) => setCashCounted(e.target.value)}
                  placeholder="Masukkan jumlah uang tunai"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 mb-3 text-sm"
                  step="0.01"
                />
                {cashCounted && (
                  <div className={`p-3 rounded-lg ${
                    Math.abs(cashDifference) < 0.01
                      ? 'bg-orange-50 border border-orange-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={Math.abs(cashDifference) < 0.01 ? 'text-orange-600 text-sm' : 'text-red-600 text-sm'}>
                      {Math.abs(cashDifference) < 0.01 ? 'Uang Tunai Seimbang' : 'Selisih Uang Tunai'}
                    </div>
                    <div className={Math.abs(cashDifference) < 0.01 ? 'text-orange-900 text-sm' : 'text-red-900 text-sm'}>
                      {cashDifference > 0 ? '+' : ''}{formatRupiah(cashDifference)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Selling Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-gray-900 mb-4">Item Terlaris</h2>
              <div className="space-y-3">
                {shiftData.topItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-gray-900 mb-1">{item.name}</div>
                      <div className="text-gray-600 text-sm">{item.quantity} terjual</div>
                    </div>
                    <div className="text-orange-600 text-sm">{formatRupiah(item.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hourly Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-gray-900 mb-4">Rincian Per Jam</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-gray-600 py-2 px-3 text-sm">Jam</th>
                    <th className="text-right text-gray-600 py-2 px-3 text-sm">Penjualan</th>
                    <th className="text-right text-gray-600 py-2 px-3 text-sm">Transaksi</th>
                    <th className="text-right text-gray-600 py-2 px-3 text-sm">Rata-rata/Transaksi</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftData.hourlyBreakdown.map((hour, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="text-gray-900 py-2 px-3 text-sm">{hour.hour}</td>
                      <td className="text-right text-gray-900 py-2 px-3 text-sm">{formatRupiah(hour.sales)}</td>
                      <td className="text-right text-gray-600 py-2 px-3 text-sm">{hour.transactions}</td>
                      <td className="text-right text-gray-600 py-2 px-3 text-sm">
                        {formatRupiah(hour.transactions > 0 ? hour.sales / hour.transactions : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handlePrintReport}
              className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
              Cetak Laporan
            </button>
            <button className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
              Kirim Laporan via Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}