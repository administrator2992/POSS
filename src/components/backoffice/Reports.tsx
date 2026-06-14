import { useState, useEffect } from 'react';
import { Calendar, Download, Filter, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dbService, Transaction } from '../../services/DatabaseService';

const formatRupiah = (amount: number) => {
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
  }).format(amount);
};

export function Reports() {
  const [reportType, setReportType] = useState<'sales' | 'transactions' | 'products'>('sales');
  const [dateRange, setDateRange] = useState('week');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await dbService.getTransactions();
        setTransactions(data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.timestamp);
    const now = new Date();
    // Normalize dates to midnight to check exact day differences
    const tMidnight = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = Math.abs(nowMidnight.getTime() - tMidnight.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (dateRange === 'today') {
      return tDate.toDateString() === now.toDateString();
    } else if (dateRange === 'week') {
      return diffDays <= 7;
    } else if (dateRange === 'month') {
      return diffDays <= 30;
    } else if (dateRange === 'year') {
      return diffDays <= 365;
    }
    return true;
  });

  // ─── Sales Report Calculation ──────────────────────────────────────────────
  const salesByDate: { [dateStr: string]: { transactions: number; sales: number } } = {};
  
  filteredTransactions.forEach(t => {
    const dateStr = new Date(t.timestamp).toISOString().split('T')[0];
    if (!salesByDate[dateStr]) {
      salesByDate[dateStr] = { transactions: 0, sales: 0 };
    }
    salesByDate[dateStr].transactions += 1;
    salesByDate[dateStr].sales += t.total;
  });

  const salesReport = Object.keys(salesByDate).map(date => {
    const data = salesByDate[date];
    return {
      date,
      transactions: data.transactions,
      sales: data.sales,
      avg: data.transactions > 0 ? Math.round(data.sales / data.transactions) : 0
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  const chartData = salesReport.map(item => ({
    date: new Date(item.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
    sales: item.sales,
  }));

  // ─── Transaction History Calculation ──────────────────────────────────────
  const transactionHistory = filteredTransactions.map(t => {
    const dateObj = new Date(t.timestamp);
    return {
      id: `#${t.id.slice(-4)}`,
      rawId: t.id,
      date: dateObj.toISOString().split('T')[0],
      time: dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      cashier: t.cashier,
      items: t.items.reduce((sum, item) => sum + item.quantity, 0),
      total: t.total,
      payment: t.paymentMethod || 'Tunai'
    };
  }).reverse(); // Show latest first

  // ─── Top Selling Products Calculation ─────────────────────────────────────
  const productSales: { [name: string]: { sales: number; revenue: number } } = {};
  
  filteredTransactions.forEach(t => {
    t.items.forEach(item => {
      if (!productSales[item.name]) {
        productSales[item.name] = { sales: 0, revenue: 0 };
      }
      productSales[item.name].sales += item.quantity;
      productSales[item.name].revenue += item.price * item.quantity;
    });
  });

  const topSellingItems = Object.keys(productSales).map(name => {
    const data = productSales[name];
    return {
      name,
      sales: data.sales,
      revenue: data.revenue
    };
  }).sort((a, b) => b.sales - a.sales).slice(0, 5);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-orange-600 mx-auto" />
          <p className="text-gray-500">Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  const totalTx = salesReport.reduce((sum, day) => sum + day.transactions, 0);
  const totalSalesValue = salesReport.reduce((sum, day) => sum + day.sales, 0);
  const topItemsRevenueTotal = topSellingItems.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">Laporan</h1>
            <p className="text-gray-600">Analisis bisnis dan riwayat transaksi toko retail</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              <Download className="w-4 h-4" />
              Ekspor
            </button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setReportType('sales')}
            className={`px-6 py-3 rounded-lg transition-colors ${
              reportType === 'sales'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Laporan Penjualan
          </button>
          <button
            onClick={() => setReportType('transactions')}
            className={`px-6 py-3 rounded-lg transition-colors ${
              reportType === 'transactions'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Riwayat Transaksi
          </button>
          <button
            onClick={() => setReportType('products')}
            className={`px-6 py-3 rounded-lg transition-colors ${
              reportType === 'products'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Produk Terlaris
          </button>
        </div>

        {reportType === 'sales' && (
          <>
            {/* Date Range Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Rentang Tanggal:</span>
                </div>
                <div className="flex gap-2">
                  {['today', 'week', 'month', 'year'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                        dateRange === range
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {range === 'today' ? 'Hari Ini' : range === 'week' ? 'Minggu Ini' : range === 'month' ? 'Bulan Ini' : 'Tahun Ini'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-gray-900 mb-6">Tinjauan Penjualan</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                    <Bar dataKey="sales" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                  Tidak ada data penjualan untuk grafik
                </div>
              )}
            </div>

            {/* Sales Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-gray-900">Data Penjualan</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left text-gray-600 py-3 px-6">Tanggal</th>
                      <th className="text-right text-gray-600 py-3 px-6">Transaksi</th>
                      <th className="text-right text-gray-600 py-3 px-6">Penjualan</th>
                      <th className="text-right text-gray-600 py-3 px-6">Rata-rata/Transaksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport.length > 0 ? (
                      salesReport.map((day, index) => (
                        <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="text-gray-600 py-4 px-6">
                            {new Date(day.date).toLocaleDateString('id-ID', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="text-right text-gray-900 py-4 px-6">{day.transactions}</td>
                          <td className="text-right text-orange-600 py-4 px-6">{formatRupiah(day.sales)}</td>
                          <td className="text-right text-gray-600 py-4 px-6">{formatRupiah(day.avg)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center text-gray-500 py-8">
                          Belum ada data penjualan
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td className="text-gray-900 py-4 px-6 font-medium">Total</td>
                      <td className="text-right text-gray-900 py-4 px-6 font-medium">{totalTx}</td>
                      <td className="text-right text-orange-600 py-4 px-6 font-medium">{formatRupiah(totalSalesValue)}</td>
                      <td className="text-right text-gray-600 py-4 px-6 font-medium">
                        {formatRupiah(totalTx > 0 ? Math.round(totalSalesValue / totalTx) : 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}

        {reportType === 'transactions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-gray-900">Riwayat Transaksi</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-gray-600 py-3 px-6">ID Transaksi</th>
                    <th className="text-left text-gray-600 py-3 px-6">Tanggal & Waktu</th>
                    <th className="text-left text-gray-600 py-3 px-6">Kasir</th>
                    <th className="text-right text-gray-600 py-3 px-6">Item</th>
                    <th className="text-right text-gray-600 py-3 px-6">Total</th>
                    <th className="text-left text-gray-600 py-3 px-6">Pembayaran</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.length > 0 ? (
                    transactionHistory.map((transaction) => (
                      <tr key={transaction.rawId} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="text-gray-900 py-4 px-6">{transaction.id}</td>
                        <td className="text-gray-600 py-4 px-6">
                          {new Date(transaction.date).toLocaleDateString('id-ID', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          {transaction.time}
                        </td>
                        <td className="text-gray-600 py-4 px-6">{transaction.cashier}</td>
                        <td className="text-right text-gray-600 py-4 px-6">{transaction.items}</td>
                        <td className="text-right text-gray-900 py-4 px-6">{formatRupiah(transaction.total)}</td>
                        <td className="text-gray-600 py-4 px-6">
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                            {transaction.payment}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500 py-8">
                        Belum ada transaksi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'products' && (
          <>
            {/* Top Selling Products Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-gray-900 mb-6">Produk Terlaris</h2>
              {topSellingItems.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-gray-700 mb-4">Berdasarkan Jumlah Terjual</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topSellingItems}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip formatter={(value) => [value, 'Terjual']} />
                        <Bar dataKey="sales" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-gray-700 mb-4">Berdasarkan Pendapatan</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={topSellingItems}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {topSellingItems.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#22c55e', '#10b981', '#059669', '#047857', '#065f46'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                  Tidak ada data produk terlaris untuk grafik
                </div>
              )}
            </div>

            {/* Top Selling Products Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-gray-900">Daftar Produk Terlaris</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left text-gray-600 py-3 px-6">Produk</th>
                      <th className="text-right text-gray-600 py-3 px-6">Terjual</th>
                      <th className="text-right text-gray-600 py-3 px-6">Pendapatan</th>
                      <th className="text-right text-gray-600 py-3 px-6">Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellingItems.length > 0 ? (
                      topSellingItems.map((item, index) => (
                        <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="text-gray-900 py-4 px-6">{item.name}</td>
                          <td className="text-right text-gray-600 py-4 px-6">{item.sales}</td>
                          <td className="text-right text-orange-600 py-4 px-6">{formatRupiah(item.revenue)}</td>
                          <td className="text-right text-gray-600 py-4 px-6">
                            {topItemsRevenueTotal > 0
                              ? ((item.revenue / topItemsRevenueTotal) * 100).toFixed(1)
                              : '0'}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center text-gray-500 py-8">
                          Belum ada data produk terlaris
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td className="text-gray-900 py-4 px-6 font-medium">Total</td>
                      <td className="text-right text-gray-900 py-4 px-6 font-medium">
                        {topSellingItems.reduce((sum, item) => sum + item.sales, 0)}
                      </td>
                      <td className="text-right text-orange-600 py-4 px-6 font-medium">
                        {formatRupiah(topItemsRevenueTotal)}
                      </td>
                      <td className="text-right text-gray-600 py-4 px-6 font-medium">
                        {topItemsRevenueTotal > 0 ? '100%' : '0%'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}