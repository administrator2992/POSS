import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Package, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddEditInventoryItem } from './AddEditInventoryItem';
import { dbService, InventoryItem } from '../../services/DatabaseService';

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const loadInventory = async () => {
      const storedInventory = await dbService.getInventory();
      setInventory(storedInventory);
    };
    
    loadInventory();
  }, []);

  const categories = ['all', ...Array.from(new Set(inventory.map(item => item.category)))];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesLowStock = !showLowStock || item.stock <= item.lowStockThreshold;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = inventory.filter(item => item.stock <= item.lowStockThreshold).length;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await dbService.deleteInventoryItem(id);
      const updatedInventory = await dbService.getInventory();
      setInventory(updatedInventory);
      toast.success('Item berhasil dihapus');
    }
  };

  const handleUpdateStock = async (id: string) => {
    const newStock = prompt('Enter new stock amount:');
    if (newStock && !isNaN(Number(newStock))) {
      const itemToUpdate = inventory.find(item => item.id === id);
      if (itemToUpdate) {
        const updatedItem = {
          ...itemToUpdate,
          stock: Number(newStock),
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        await dbService.updateInventoryItem(updatedItem);
        const updatedInventory = await dbService.getInventory();
        setInventory(updatedInventory);
        toast.success('Stok berhasil diperbarui');
      }
    }
  };

  const handleSaveItem = async (item: InventoryItem) => {
    if (editingItem) {
      // Update existing item
      await dbService.updateInventoryItem(item);
      toast.success('Item berhasil diperbarui');
    } else {
      // Add new item
      await dbService.addInventoryItem(item);
      toast.success('Item berhasil ditambahkan');
    }
    
    const updatedInventory = await dbService.getInventory();
    setInventory(updatedInventory);
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Track and manage your stock levels</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {/* Alerts */}
        {lowStockCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-orange-900 mb-1">Low Stock Alert</div>
              <p className="text-orange-700">
                {lowStockCount} {lowStockCount === 1 ? 'item is' : 'items are'} running low on stock
              </p>
            </div>
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              {showLowStock ? 'Show All' : 'View Items'}
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inventory..."
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
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-gray-600 py-3 px-6">Item Name</th>
                  <th className="text-left text-gray-600 py-3 px-6">Category</th>
                  <th className="text-right text-gray-600 py-3 px-6">Stock</th>
                  <th className="text-right text-gray-600 py-3 px-6">Low Stock Alert</th>
                  <th className="text-left text-gray-600 py-3 px-6">Status</th>
                  <th className="text-left text-gray-600 py-3 px-6">Last Updated</th>
                  <th className="text-right text-gray-600 py-3 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const isLowStock = item.stock <= item.lowStockThreshold;
                  return (
                    <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="text-gray-900 py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-orange-600" />
                          </div>
                          {item.name}
                        </div>
                      </td>
                      <td className="text-gray-600 py-4 px-6">{item.category}</td>
                      <td className="text-right text-gray-900 py-4 px-6">
                        {item.stock} {item.unit}
                      </td>
                      <td className="text-right text-gray-600 py-4 px-6">
                        {item.lowStockThreshold} {item.unit}
                      </td>
                      <td className="text-left py-4 px-6">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="text-gray-600 py-4 px-6">
                        {new Date(item.lastUpdated).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="text-right py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit Item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <AddEditInventoryItem
          item={editingItem || undefined}
          onSave={handleSaveItem}
          onCancel={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          categories={categories.filter(cat => cat !== 'all') as string[]}
        />
      )}
    </div>
  );
}