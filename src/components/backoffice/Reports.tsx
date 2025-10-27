import { useState } from 'react';
import { Calendar, Download, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Bakery product data
const BAKERY_PRODUCTS = [
  { id: '1', name: 'Kue Lapis', category: 'Kue', price: 15000, cost: 2000 },
  { id: '2', name: 'Kue Mangkok', category: 'Kue', price: 12000, cost: 1500 },
  { id: '3', name: 'Lemper', category: 'Kue', price: 10000, cost: 1200 },
  { id: '4', name: 'Pastel', category: 'Kue', price: 13000, cost: 1800 },
  { id: '5', name: 'Wajik', category: 'Kue', price: 8000, cost: 1000 },
  { id: '6', name: 'Bacang Ayam', category: 'Kue', price: 16000, cost: 2500 },
  { id: '7', name: 'Bacang T. Asin', category: 'Kue', price: 14000, cost: 2000 },
  { id: '8', name: 'Bakwan', category: 'Gorengan', price: 2000, cost: 800 },
  { id: '9', name: 'Bakwan Udang', category: 'Gorengan', price: 3000, cost: 1500 },
  { id: '10', name: 'Kue Ku', category: 'Kue', price: 9000, cost: 1200 },
  { id: '11', name: 'Paketku', category: 'Paket', price: 25000, cost: 3000 },
  { id: '12', name: 'Risoles', category: 'Gorengan', price: 2500, cost: 1000 },
];

// Generate realistic sales data for bakery products
const salesReport = [
  { date: '2025-10-18', transactions: 45, sales: 484750, avg: 10772 },
  { date: '2025-10-19', transactions: 67, sales: 725425, avg: 10827 },
  { date: '2025-10-20', transactions: 34, sales: 364575, avg: 10723 },
  { date: '2025-10-21', transactions: 56, sales: 610250, avg: 10897 },
  { date: '2025-10-22', transactions: 89, sales: 978925, avg: 10999 },
  { date: '2025-10-23', transactions: 101, sales: 1112550, avg: 11015 },
  { date: '2025-10-24', transactions: 78, sales: 856775, avg: 10984 },
];

const chartData = salesReport.map(item => ({
  date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  sales: item.sales,
}));

// Generate realistic transaction history with bakery items
const transactionHistory = [
  { id: '#1234', date: '2025-10-24', time: '2:45 PM', cashier: 'Sarah Johnson', items: 3, total: 38500, payment: 'Tunai' },
  { id: '#1233', date: '2025-10-24', time: '2:42 PM', cashier: 'Mike Chen', items: 2, total: 22250, payment: 'Kartu' },
  { id: '#1232', date: '2025-10-24', time: '2:38 PM', cashier: 'Sarah Johnson', items: 5, total: 61750, payment: 'QRIS' },
  { id: '#1230', date: '2025-10-24', time: '2:30 PM', cashier: 'Mike Chen', items: 4, total: 44000, payment: 'Kartu' },
  { id: '#1229', date: '2025-10-24', time: '2:25 PM', cashier: 'Sarah Johnson', items: 2, total: 25500, payment: 'Tunai' },
  { id: '#1227', date: '2025-10-24', time: '2:15 PM', cashier: 'Mike Chen', items: 3, total: 39250, payment: 'QRIS' },
];

// Top selling bakery items
const topSellingItems = [
  { name: 'Kue Lapis', sales: 28, revenue: 420000 },
  { name: 'Paketku', sales: 22, revenue: 550000 },
  { name: 'Bacang Ayam', sales: 18, revenue: 288000 },
  { name: 'Lemper', sales: 15, revenue: 150000 },
  { name: 'Bakwan Udang', sales: 12, revenue: 36000 },
];

const formatRupiah = (amount: number) => {
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
  }).format(amount);
};

export function Reports() {
  const [reportType, setReportType] = useState<'sales' | 'transactions' | 'products'>('sales');
  const [dateRange, setDateRange] = useState('week');

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">Laporan</h1>
            <p className="text-gray-600">Analisis bisnis dan riwayat transaksi toko kue</p>
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
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-gray-900 mb-6">Tinjauan Penjualan</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                  <Bar dataKey="sales" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
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
                    {salesReport.map((day, index) => (
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
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td className="text-gray-900 py-4 px-6">Total</td>
                      <td className="text-right text-gray-900 py-4 px-6">
                        {salesReport.reduce((sum, day) => sum + day.transactions, 0)}
                      </td>
                      <td className="text-right text-orange-600 py-4 px-6">
                        {formatRupiah(salesReport.reduce((sum, day) => sum + day.sales, 0))}
                      </td>
                      <td className="text-right text-gray-600 py-4 px-6">
                        {formatRupiah(salesReport.reduce((sum, day) => sum + day.sales, 0) / 
                           salesReport.reduce((sum, day) => sum + day.transactions, 0))}
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
                  {transactionHistory.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-gray-100 hover:bg-gray-50">
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
                        <span className="px-3 py-1 bg-gray-100 rounded-full">
                          {transaction.payment}
                        </span>
                      </td>
                    </tr>
                  ))}
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
                    {topSellingItems.map((item, index) => (
                      <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="text-gray-900 py-4 px-6">{item.name}</td>
                        <td className="text-right text-gray-600 py-4 px-6">{item.sales}</td>
                        <td className="text-right text-orange-600 py-4 px-6">{formatRupiah(item.revenue)}</td>
                        <td className="text-right text-gray-600 py-4 px-6">
                          {((item.revenue / topSellingItems.reduce((sum, i) => sum + i.revenue, 0)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td className="text-gray-900 py-4 px-6">Total</td>
                      <td className="text-right text-gray-900 py-4 px-6">
                        {topSellingItems.reduce((sum, item) => sum + item.sales, 0)}
                      </td>
                      <td className="text-right text-orange-600 py-4 px-6">
                        {formatRupiah(topSellingItems.reduce((sum, item) => sum + item.revenue, 0))}
                      </td>
                      <td className="text-right text-gray-600 py-4 px-6">100%</td>
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