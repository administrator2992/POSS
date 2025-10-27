import { Banknote, ShoppingCart, TrendingUp, Users, ArrowUp, ArrowDown, Cake } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Generate random prices between 5000 and 25000 Rupiah
const generatePrice = () => Math.floor(Math.random() * (25000 - 5000 + 1) + 5000);

const salesData = [
  { day: 'Sen', sales: generatePrice() },
  { day: 'Sel', sales: generatePrice() },
  { day: 'Rab', sales: generatePrice() },
  { day: 'Kam', sales: generatePrice() },
  { day: 'Jum', sales: generatePrice() },
  { day: 'Sab', sales: generatePrice() },
  { day: 'Min', sales: generatePrice() },
];

const topItems = [
  { name: 'Kue Lapis', sales: 45, revenue: generatePrice() },
  { name: 'Lemper', sales: 38, revenue: generatePrice() },
  { name: 'Pastel', sales: 32, revenue: generatePrice() },
  { name: 'Bacang Ayam', sales: 28, revenue: generatePrice() },
  { name: 'Risoles', sales: 24, revenue: generatePrice() },
];

const categoryData = [
  { name: 'Kue', value: 4500, color: '#22c55e' },
  { name: 'Gorengan', value: 1200, color: '#3b82f6' },
  { name: 'Paket', value: 2100, color: '#f59e0b' },
  { name: 'Minuman', value: 900, color: '#8b5cf6' },
];

const recentTransactions = [
  { id: '#1234', time: '2:45 PM', items: 3, total: generatePrice(), status: 'completed' },
  { id: '#1233', time: '2:42 PM', items: 2, total: generatePrice(), status: 'completed' },
  { id: '#1232', time: '2:38 PM', items: 5, total: generatePrice(), status: 'completed' },
  { id: '#1231', time: '2:35 PM', items: 1, total: generatePrice(), status: 'completed' },
  { id: '#1230', time: '2:30 PM', items: 4, total: generatePrice(), status: 'completed' },
];

const formatRupiah = (amount: number) => {
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
  }).format(amount);
};

export function Dashboard() {
  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Ringkasan kinerja bisnis Anda</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Banknote className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex items-center gap-1 text-orange-600">
                <ArrowUp className="w-4 h-4" />
                <span>12.5%</span>
              </div>
            </div>
            <div className="text-gray-600 mb-1">Penjualan Hari Ini</div>
            <div className="text-gray-900">{formatRupiah(generatePrice())}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex items-center gap-1 text-orange-600">
                <ArrowUp className="w-4 h-4" />
                <span>8.2%</span>
              </div>
            </div>
            <div className="text-gray-600 mb-1">Transaksi</div>
            <div className="text-gray-900">142</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-brown-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-brown-600" />
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <ArrowDown className="w-4 h-4" />
                <span>2.1%</span>
              </div>
            </div>
            <div className="text-gray-600 mb-1">Rata-rata Transaksi</div>
            <div className="text-gray-900">{formatRupiah(generatePrice())}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex items-center gap-1 text-orange-600">
                <ArrowUp className="w-4 h-4" />
                <span>15.3%</span>
              </div>
            </div>
            <div className="text-gray-600 mb-1">Pelanggan</div>
            <div className="text-gray-900">128</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Sales Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-gray-900 mb-6">Tren Penjualan Mingguan</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                <Line type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-gray-900 mb-6">Penjualan berdasarkan Kategori</h2>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-gray-900 mb-6">Item Terlaris</h2>
            <div className="space-y-4">
              {topItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 mb-1">{item.name}</div>
                    <div className="text-gray-600">{item.sales} terjual</div>
                  </div>
                  <div className="text-orange-600">{formatRupiah(item.revenue)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-gray-900 mb-6">Transaksi Terbaru</h2>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-gray-900 mb-1">{transaction.id}</div>
                    <div className="text-gray-600">{transaction.time} · {transaction.items} item</div>
                  </div>
                  <div className="text-gray-900">{formatRupiah(transaction.total)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}