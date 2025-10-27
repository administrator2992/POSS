import { useState, useEffect } from 'react';
import { Order } from '../TabletPOS';
import { PaymentScreen } from './PaymentScreen';
import { ReceiptScreen } from './ReceiptScreen';
import { ShiftReport } from './ShiftReport';
import { LogOut, Menu, History, X, Settings, Package, Cake, Trash2, Minus, Plus, Tag, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { DiscountModal } from './DiscountModal';
import { dbService, Transaction, InventoryItem } from '../../services/DatabaseService';

interface SalesScreenProps {
  currentOrder: Order;
  onOrderUpdate: (order: Order) => void;
  onCheckout: (order: Order) => void;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  code?: string;
}

// Generate random prices between 5000 and 25000 Rupiah
const generatePrice = () => Math.floor(Math.random() * (25000 - 5000 + 1) + 5000);

const BAKERY_ITEMS = [
  { id: '1', name: 'Kue Lapis', code: 'KL', price: generatePrice() },
  { id: '2', name: 'Kue Mangkok', code: 'KM', price: generatePrice() },
  { id: '3', name: 'Lemper', code: 'LP', price: generatePrice() },
  { id: '4', name: 'Pastel', code: 'PS', price: generatePrice() },
  { id: '5', name: 'Wajik', code: 'WJ', price: generatePrice() },
  { id: '6', name: 'Bacang Ayam', code: 'BA', price: generatePrice() },
  { id: '7', name: 'Bacang T. Asin', code: 'BTA', price: generatePrice() },
  { id: '8', name: 'Bakwan', code: 'BK', price: generatePrice() },
  { id: '9', name: 'Bakwan Udang', code: 'BU', price: generatePrice() },
  { id: '10', name: 'Kue Ku', code: 'KK', price: generatePrice() },
  { id: '11', name: 'Paketku', code: 'PK', price: generatePrice() },
  { id: '12', name: 'Risoles', code: 'RS', price: generatePrice() },
];

type SearchMode = 'code' | 'name';

export function SalesScreen({ currentOrder, onOrderUpdate, onCheckout }: SalesScreenProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const loadTransactions = async () => {
      const storedTransactions = await dbService.getTransactions();
      setTransactions(storedTransactions);
    };
    
    loadTransactions();
  }, []);

  const filteredItems = BAKERY_ITEMS.filter(item => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    if (searchMode === 'code' && item.code) {
      return item.code.toLowerCase().includes(query);
    } else {
      return item.name.toLowerCase().includes(query);
    }
  });

  const calculateOrderTotals = (items: typeof currentOrder.items, discount = currentOrder.discount, taxRate = 0.1) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax - discount;
    return { subtotal, tax, total };
  };

  const addItemToOrder = (menuItem: MenuItem) => {
    handleAddWithModifiers(menuItem, [], '');
  };

  const handleAddWithModifiers = (menuItem: MenuItem, modifiers: string[], notes: string) => {
    // If the item doesn't have a price (from database), generate one
    const itemWithPrice = {
      ...menuItem,
      price: menuItem.price || generatePrice()
    };
    
    const existingItemIndex = currentOrder.items.findIndex(
      item => item.id === itemWithPrice.id && 
      JSON.stringify(item.modifiers) === JSON.stringify(modifiers) &&
      item.notes === notes
    );

    let newItems;
    if (existingItemIndex >= 0) {
      newItems = [...currentOrder.items];
      newItems[existingItemIndex].quantity += 1;
    } else {
      newItems = [
        ...currentOrder.items,
        {
          id: itemWithPrice.id,
          name: itemWithPrice.name,
          price: itemWithPrice.price,
          quantity: 1,
          modifiers: modifiers.length > 0 ? modifiers : undefined,
          notes: notes || undefined,
        },
      ];
    }

    const totals = calculateOrderTotals(newItems);
    onOrderUpdate({
      ...currentOrder,
      items: newItems,
      ...totals,
    });
    toast.success(`${itemWithPrice.name} ditambahkan ke pesanan`);
  };

  const updateItemQuantity = (index: number, delta: number) => {
    const newItems = [...currentOrder.items];
    newItems[index].quantity += delta;

    if (newItems[index].quantity <= 0) {
      newItems.splice(index, 1);
    }

    const totals = calculateOrderTotals(newItems);
    onOrderUpdate({
      ...currentOrder,
      items: newItems,
      ...totals,
    });
  };

  const removeItem = (index: number) => {
    const newItems = currentOrder.items.filter((_, i) => i !== index);
    const totals = calculateOrderTotals(newItems);
    onOrderUpdate({
      ...currentOrder,
      items: newItems,
      ...totals,
    });
  };

  const applyDiscount = (discount: number) => {
    const totals = calculateOrderTotals(currentOrder.items, discount);
    onOrderUpdate({
      ...currentOrder,
      discount,
      ...totals,
    });
    setShowDiscountModal(false);
    toast.success('Diskon diterapkan');
  };

  const handleCheckout = () => {
    if (currentOrder.items.length === 0) {
      toast.error('Silakan tambahkan item ke pesanan');
      return;
    }
    onCheckout(currentOrder);
  };

  const formatRupiah = (amount: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-full flex">
      {/* Left: Menu Items */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Search Bar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setSearchMode('name')}
              className={`flex-1 px-6 py-2 rounded-lg whitespace-nowrap transition-colors ${
                searchMode === 'name'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nama Produk
            </button>
            <button
              onClick={() => setSearchMode('code')}
              className={`flex-1 px-6 py-2 rounded-lg whitespace-nowrap transition-colors ${
                searchMode === 'code'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Kode Produk
            </button>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchMode === 'code' ? 'Masukkan kode produk...' : 'Cari nama produk...'}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => addItemToOrder(item)}
                className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-orange-500 transition-all hover:shadow-md text-left"
              >
                <div className="aspect-square bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg mb-3 flex items-center justify-center">
                  <Cake className="w-12 h-12 text-orange-600" />
                </div>
                <div className="text-gray-900 mb-1">{item.name}</div>
                <div className="text-gray-500 mb-2">{item.code}</div>
                <div className="text-orange-600">{formatRupiah(item.price)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Order Cart */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Order Header with History */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-gray-900">Pesanan</h3>
          
          <div className="relative">
            <button
              onClick={() => setShowHistoryMenu(!showHistoryMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <History className="w-6 h-6 text-gray-700" />
            </button>
            
            {showHistoryMenu && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-gray-900">Riwayat Transaksi</h3>
                  <button
                    onClick={() => setShowHistoryMenu(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-3 max-h-96 overflow-auto">
                  {transactions.length > 0 ? (
                    transactions.slice().reverse().map((transaction) => (
                      <div key={transaction.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-900">#{transaction.id.substring(0, 8)}</span>
                          <span className="text-gray-600">
                            {new Date(transaction.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{transaction.items.length} item</span>
                          <span className="text-orange-600">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            }).format(transaction.total)}
                          </span>
                        </div>
                        <div className="text-gray-500 text-sm mt-1">
                          Kasir: {transaction.cashier}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      Tidak ada riwayat transaksi
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-auto p-4">
          {currentOrder.items.length === 0 ? (
            <div className="text-center text-gray-400 mt-12">
              <Cake className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Belum ada item</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-gray-900">{item.name}</div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="text-gray-500 mt-1">
                          {item.modifiers.join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-gray-500 italic mt-1">
                          Catatan: {item.notes}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItemQuantity(index, -1)}
                        className="w-8 h-8 bg-white rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(index, 1)}
                        className="w-8 h-8 bg-white rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-gray-900">
                      {formatRupiah(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary & Actions */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatRupiah(currentOrder.subtotal)}</span>
            </div>
            {currentOrder.discount > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Diskon</span>
                <span>-{formatRupiah(currentOrder.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Pajak (10%)</span>
              <span>{formatRupiah(currentOrder.tax)}</span>
            </div>
            <div className="flex justify-between text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{formatRupiah(currentOrder.total)}</span>
            </div>
          </div>

          <button
            onClick={() => setShowDiscountModal(true)}
            disabled={currentOrder.items.length === 0}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Tag className="w-4 h-4" />
            Terapkan Diskon
          </button>

          <button
            onClick={handleCheckout}
            disabled={currentOrder.items.length === 0}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Bayar
          </button>
        </div>
      </div>

      {/* Modals */}

      {showDiscountModal && (
        <DiscountModal
          currentDiscount={currentOrder.discount}
          subtotal={currentOrder.subtotal}
          onClose={() => setShowDiscountModal(false)}
          onApply={applyDiscount}
        />
      )}

      {/* Removed ScanAI modal */}
    </div>
  );
}