import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { dbService, InventoryItem } from '../../services/DatabaseService';

export function MenuManagement() {
  const [menu, setMenu] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    name: '',
    category: 'Umum',
    price: 0,
    cost: 0,
  });

  const loadMenu = async () => {
    try {
      const storedInventory = await dbService.getInventory();
      setMenu(storedInventory);
    } catch (error) {
      console.error('Error loading menu:', error);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const categories = ['all', ...Array.from(new Set(menu.map(item => item.category)))];

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleAvailability = async (id: string) => {
    const item = menu.find(i => i.id === id);
    if (item) {
      const updatedItem = {
        ...item,
        available: item.available === false ? true : false, // default is true if undefined
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      await dbService.updateInventoryItem(updatedItem);
      await loadMenu();
      toast.success('Ketersediaan item berhasil diperbarui');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      await dbService.deleteInventoryItem(id);
      await loadMenu();
      toast.success('Item berhasil dihapus');
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Umum',
      price: 0,
      cost: 0,
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price || 0,
      cost: item.cost || 0,
    });
    setShowAddModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama harus diisi');
      return;
    }

    try {
      if (editingItem) {
        // Edit existing
        const updatedItem: InventoryItem = {
          ...editingItem,
          name: formData.name.trim(),
          category: formData.category,
          price: formData.price,
          cost: formData.cost,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        await dbService.updateInventoryItem(updatedItem);
        toast.success('Item berhasil diperbarui');
      } else {
        // Add new
        const newItem: InventoryItem = {
          id: Date.now().toString(),
          name: formData.name.trim(),
          category: formData.category,
          price: formData.price,
          cost: formData.cost,
          stock: 0, // default stock
          unit: 'pcs',
          available: true,
          lowStockThreshold: 10,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        await dbService.addInventoryItem(newItem);
        toast.success('Item berhasil ditambahkan');
      }
      setShowAddModal(false);
      await loadMenu();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Gagal menyimpan item');
    }
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
            onClick={handleOpenAddModal}
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
            <div className="text-orange-600">{menu.filter(item => item.available !== false).length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-gray-600 mb-2">Tidak Tersedia</div>
            <div className="text-red-600">{menu.filter(item => item.available === false).length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-gray-600 mb-2">Harga Rata-rata</div>
            <div className="text-gray-900">
              {menu.length > 0
                ? formatRupiah(menu.reduce((sum, item) => sum + (item.price || 0), 0) / menu.length)
                : 'Rp 0'}
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

        {/* Menu Items Grid */}
        {filteredMenu.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {filteredMenu.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-gray-900 mb-1">{item.name}</h3>
                          <p className="text-gray-600">{item.category}</p>
                        </div>
                        {item.available !== false ? (
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
                            {formatRupiah(item.price || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 mb-1">Biaya</div>
                          <div className="text-gray-900">{formatRupiah(item.cost || 0)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 mb-1">Margin</div>
                          <div className="text-gray-900">
                            {item.price > 0
                              ? (((item.price - (item.cost || 0)) / item.price) * 100).toFixed(0)
                              : '0'}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    className="flex-1 px-4 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
                  >
                    {item.available !== false ? 'Tandai Tidak Tersedia' : 'Tandai Tersedia'}
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(item)}
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
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-20 text-orange-600" />
            <p className="text-lg">Tidak ada item menu ditemukan</p>
            <p className="text-sm text-gray-400 mt-1">Tambahkan item baru untuk memulai</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-gray-900 mb-4">
              {editingItem ? 'Edit Item Menu' : 'Tambah Item Menu Baru'}
            </h2>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Barang A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Makanan / Minuman / Barang"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price || ''}
                    placeholder="0"
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Modal / Cost (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cost || ''}
                    placeholder="0"
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}