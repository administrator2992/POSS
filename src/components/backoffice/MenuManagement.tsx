import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Cake } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  available: boolean;
}

// Generate random prices between 5000 and 25000 Rupiah
const generatePrice = () => Math.floor(Math.random() * (25000 - 5000 + 1) + 5000);

const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Kue Lapis', category: 'Kue', price: generatePrice(), cost: 2000, available: true },
  { id: '2', name: 'Kue Mangkok', category: 'Kue', price: generatePrice(), cost: 1500, available: true },
  { id: '3', name: 'Lemper', category: 'Kue', price: generatePrice(), cost: 1200, available: true },
  { id: '4', name: 'Pastel', category: 'Kue', price: generatePrice(), cost: 1800, available: true },
  { id: '5', name: 'Wajik', category: 'Kue', price: generatePrice(), cost: 1000, available: true },
  { id: '6', name: 'Bacang Ayam', category: 'Kue', price: generatePrice(), cost: 2500, available: true },
  { id: '7', name: 'Bacang T. Asin', category: 'Kue', price: generatePrice(), cost: 2000, available: true },
  { id: '8', name: 'Bakwan', category: 'Gorengan', price: generatePrice(), cost: 800, available: true },
  { id: '9', name: 'Bakwan Udang', category: 'Gorengan', price: generatePrice(), cost: 1500, available: true },
  { id: '10', name: 'Kue Ku', category: 'Kue', price: generatePrice(), cost: 1200, available: true },
  { id: '11', name: 'Paketku', category: 'Paket', price: generatePrice(), cost: 3000, available: true },
  { id: '12', name: 'Risoles', category: 'Gorengan', price: generatePrice(), cost: 1000, available: true },
];

export function MenuManagement() {
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = ['all', ...Array.from(new Set(menu.map(item => item.category)))];

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleAvailability = (id: string) => {
    setMenu(menu.map(item =>
      item.id === id ? { ...item, available: !item.available } : item
    ));
    toast.success('Item availability updated');
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      setMenu(menu.filter(item => item.id !== id));
      toast.success('Item deleted successfully');
    }
  };

  const handleEdit = (id: string) => {
    toast.success('Item updated successfully');
  };

  const formatRupiah = (amount: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">Manajemen Menu</h1>
            <p className="text-gray-600">Buat dan edit item menu, kategori, dan harga</p>
          </div>
          <button
            onClick={() => {
              setShowAddModal(true);
              toast.success('Item berhasil ditambahkan');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Item
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-gray-600 mb-2">Total Item</div>
            <div className="text-gray-900">{menu.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-gray-600 mb-2">Tersedia</div>
            <div className="text-orange-600">{menu.filter(item => item.available).length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-gray-600 mb-2">Tidak Tersedia</div>
            <div className="text-red-600">{menu.filter(item => !item.available).length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-gray-600 mb-2">Harga Rata-rata</div>
            <div className="text-gray-900">
              {formatRupiah(menu.reduce((sum, item) => sum + item.price, 0) / menu.length)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari item menu..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    filterCategory === category
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'Semua' : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-2 gap-6">
          {filteredMenu.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Cake className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-gray-600">{item.category}</p>
                      </div>
                      {item.available ? (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                          Tersedia
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
                          Tidak Tersedia
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <div className="text-gray-600 mb-1">Harga</div>
                        <div className="text-orange-600">
                          {formatRupiah(item.price)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Biaya</div>
                        <div className="text-gray-900">{formatRupiah(item.cost)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Margin</div>
                        <div className="text-gray-900">
                          {(((item.price - item.cost) / item.price) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => toggleAvailability(item.id)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    item.available
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  {item.available ? 'Tandai Tidak Tersedia' : 'Tandai Tersedia'}
                </button>
                <button
                  onClick={() => handleEdit(item.id)}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Item Modal - Simplified for demo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-gray-900 mb-4">Tambah Item Menu Baru</h2>
            <p className="text-gray-600 mb-6">Fitur akan segera hadir - ini adalah antarmuka demo</p>
            <button
              onClick={() => {
                setShowAddModal(false);
                toast.success('Item berhasil ditambahkan');
              }}
              className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}