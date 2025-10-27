import { useState, useEffect } from 'react';
import { Employee } from '../App';
import { SalesScreen } from './tablet/SalesScreen';
import { PaymentScreen } from './tablet/PaymentScreen';
import { ReceiptScreen } from './tablet/ReceiptScreen';
import { ShiftReport } from './tablet/ShiftReport';
import { LogOut, Menu, X, Settings, Package, Cake, FileText } from 'lucide-react';
import { dbService, Transaction } from '../services/DatabaseService';

interface TabletPOSProps {
  currentUser: Employee;
  onLogout: () => void;
  onClockOut: () => void;
  onSwitchToBackOffice?: (screen?: 'settings' | 'inventory') => void;
}

type TabletScreen = 'sales' | 'payment' | 'receipt' | 'shift-report';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
  notes?: string;
}

export interface Order {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export function TabletPOS({ currentUser, onLogout, onClockOut, onSwitchToBackOffice }: TabletPOSProps) {
  const [currentScreen, setCurrentScreen] = useState<TabletScreen>('sales');
  const [currentOrder, setCurrentOrder] = useState<Order>({
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
  });
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storeName, setStoreName] = useState('Toko Kue');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      const storedTransactions = await dbService.getTransactions();
      setTransactions(storedTransactions);
    };
    
    loadTransactions();
  }, []);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await dbService.getSettings();
        if (settings.business?.storeName) {
          setStoreName(settings.business.storeName);
        }
        if (settings.business?.storeLogo) {
          setStoreLogo(settings.business.storeLogo);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleCheckout = (order: Order) => {
    setCurrentOrder(order);
    setCurrentScreen('payment');
  };

  const handlePaymentComplete = (order: Order) => {
    setCompletedOrder(order);
    setCurrentScreen('receipt');
  };

  const handleNewOrder = () => {
    setCurrentOrder({
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
    });
    setCompletedOrder(null);
    setCurrentScreen('sales');
  };

  // Determine which menu items to show based on user role
  const showManagerItems = currentUser.role === 'manager' && onSwitchToBackOffice;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Settings Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            
            {showSettingsMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {showManagerItems && (
                  <>
                    <button
                      onClick={() => {
                        if (onSwitchToBackOffice) onSwitchToBackOffice('settings');
                        setShowSettingsMenu(false);
                      }}
                      className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                    >
                      <Settings className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Pengaturan</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onSwitchToBackOffice) onSwitchToBackOffice('inventory');
                        setShowSettingsMenu(false);
                      }}
                      className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                    >
                      <Package className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Inventori</span>
                    </button>
                    <div className="border-t border-gray-200 my-2"></div>
                  </>
                )}
                <button
                  onClick={() => {
                    setCurrentScreen('shift-report');
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                >
                  <FileText className="w-5 h-5 text-red-600" />
                  <span className="text-red-600">Laporan Shift</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {storeLogo ? (
              <img src={storeLogo} alt="Store Logo" className="w-6 h-6 object-contain" />
            ) : (
              <Cake className="w-6 h-6 text-orange-600" />
            )}
            <span className="text-orange-600">{storeName}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <span className="text-gray-600">Kasir: {currentUser.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onClockOut();
              onLogout();
            }}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentScreen === 'sales' && (
          <SalesScreen
            currentOrder={currentOrder}
            onOrderUpdate={setCurrentOrder}
            onCheckout={handleCheckout}
          />
        )}
        {currentScreen === 'payment' && (
          <PaymentScreen
            order={currentOrder}
            onPaymentComplete={handlePaymentComplete}
            onBack={() => setCurrentScreen('sales')}
          />
        )}
        {currentScreen === 'receipt' && completedOrder && (
          <ReceiptScreen
            order={completedOrder}
            onNewOrder={handleNewOrder}
            cashierName={currentUser.name}
          />
        )}
        {currentScreen === 'shift-report' && (
          <ShiftReport
            employeeName={currentUser.name}
            onBack={() => setCurrentScreen('sales')}
          />
        )}
      </div>
    </div>
  );
}