import { useState, useEffect } from 'react';
import { Banknote, ShoppingCart, TrendingUp, Users, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dbService, Transaction, InventoryItem } from '../../services/DatabaseService';

const formatRupiah = (amount: number) => {
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
  }).format(amount);
};

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [txs, inv] = await Promise.all([
          dbService.getTransactions(),
          dbService.getInventory()
        ]);
        setTransactions(txs);
        setInventory(inv);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-orange-600 mx-auto" />
          <p className="text-gray-500">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Metrics Calculation ───────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTxs = transactions.filter(t => t.timestamp.startsWith(todayStr));
  
  const salesToday = todayTxs.reduce((sum, t) => sum + t.total, 0);
  const transactionsCount = todayTxs.length;
  const averageTransaction = transactionsCount > 0 ? Math.round(salesToday / transactionsCount) : 0;
  const customersCount = transactionsCount; // Since guest cashier POS, each transaction is a unique customer session

  // Calculate percentage updates dynamically compared to yesterday's sales
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdayTxs = transactions.filter(t => t.timestamp.startsWith(yesterdayStr));
  const salesYesterday = yesterdayTxs.reduce((sum, t) => sum + t.total, 0);
  
  const salesTrendPercentage = salesYesterday > 0 
    ? ((salesToday - salesYesterday) / salesYesterday * 100).toFixed(1)
    : '0.0';

  // ─── Weekly Trend Chart Calculation ───────────────────────────────────────
  const getWeeklyData = () => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      
      const dailyTxs = transactions.filter(t => t.timestamp.startsWith(dateStr));
      const dailySales = dailyTxs.reduce((sum, t) => sum + t.total, 0);
      
      result.push({ day: dayName, sales: dailySales });
    }
    return result;
  };
  const salesData = getWeeklyData();

  // ─── Categories Pie Chart Calculation ──────────────────────────────────────
  const categorySalesMap: { [cat: string]: number } = {};
  transactions.forEach(t => {
    t.items.forEach(item => {
      const invItem = inventory.find(i => i.id === item.id || i.name === item.name);
      const category = invItem?.category || 'Umum';
      categorySalesMap[category] = (categorySalesMap[category] || 0) + (item.price * item.quantity);
    });
  });

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280'];
  const categoryData = Object.keys(categorySalesMap).map((cat, idx) => ({
    name: cat,
    value: categorySalesMap[cat],
    color: COLORS[idx % COLORS.length]
  }));

  // ─── Top Selling Items Calculation ─────────────────────────────────────────
  const itemSalesMap: { [name: string]: { sales: number; revenue: number } } = {};
  transactions.forEach(t => {
    t.items.forEach(item => {
      if (!itemSalesMap[item.name]) {
        itemSalesMap[item.name] = { sales: 0, revenue: 0 };
      }
      itemSalesMap[item.name].sales += item.quantity;
      itemSalesMap[item.name].revenue += item.price * item.quantity;
    });
  });

  const topItems = Object.keys(itemSalesMap).map(name => ({
    name,
    sales: itemSalesMap[name].sales,
    revenue: itemSalesMap[name].revenue
  })).sort((a, b) => b.sales - a.sales).slice(0, 5);

  // ─── Recent Transactions Calculation ───────────────────────────────────────
  const recentTransactions = transactions.slice(-5).reverse().map(t => {
    const timeStr = new Date(t.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const itemsCount = t.items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      id: `#${t.id.slice(-4)}`,
      rawId: t.id,
      time: timeStr,
      items: itemsCount,
      total: t.total,
      status: 'completed'
    };
  });

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Ringkasan kinerja bisnis Anda hari ini</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Banknote className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                {parseFloat(salesTrendPercentage) >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span>{Math.abs(parseFloat(salesTrendPercentage))}%</span>
              </div>
            </div>
            <div className="text-gray-600 mb-1 text-sm">Penjualan Hari Ini</div>
            <div className="text-gray-900 text-2xl font-bold">{formatRupiah(salesToday)}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-gray-600 mb-1 text-sm">Transaksi Hari Ini</div>
            <div className="text-gray-900 text-2xl font-bold">{transactionsCount}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-brown-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-brown-600" />
              </div>
            </div>
            <div className="text-gray-600 mb-1 text-sm">Rata-rata Transaksi</div>
            <div className="text-gray-900 text-2xl font-bold">{formatRupiah(averageTransaction)}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-gray-600 mb-1 text-sm">Pelanggan Hari Ini</div>
            <div className="text-gray-900 text-2xl font-bold">{customersCount}</div>
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
              {categoryData.length > 0 ? (
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
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Tidak ada data penjualan kategori
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-gray-900 mb-6">Item Terlaris</h2>
            {topItems.length > 0 ? (
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-700 font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium mb-1">{item.name}</div>
                      <div className="text-gray-600 text-sm">{item.sales} terjual</div>
                    </div>
                    <div className="text-orange-600 font-semibold">{formatRupiah(item.revenue)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                Belum ada data item terlaris
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-gray-900 mb-6">Transaksi Terbaru</h2>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.rawId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-gray-900 font-medium mb-1">{transaction.id}</div>
                      <div className="text-gray-600 text-sm">{transaction.time} · {transaction.items} item</div>
                    </div>
                    <div className="text-gray-900 font-semibold">{formatRupiah(transaction.total)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                Belum ada transaksi terbaru
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}