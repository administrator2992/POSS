import { useState, useEffect } from 'react';
import { Employee } from '../App';
import { Dashboard } from './backoffice/Dashboard';
import { Reports } from './backoffice/Reports';
import { Inventory } from './backoffice/Inventory';
import { MenuManagement } from './backoffice/MenuManagement';
import { EmployeeManagement } from './backoffice/EmployeeManagement';
import { Settings } from './backoffice/Settings';
import {
  LayoutDashboard,
  FileText,
  Package,
  Cake,
  Users,
  LogOut,
  Tablet,
  Settings as SettingsIcon,
} from 'lucide-react';
import { dbService } from '../services/DatabaseService';

interface BackOfficeProps {
  currentUser: Employee;
  onLogout: () => void;
  onSwitchToTablet: () => void;
  initialScreen?: 'dashboard' | 'reports' | 'inventory' | 'menu' | 'employees' | 'settings';
}

type BackOfficeScreen = 'dashboard' | 'reports' | 'inventory' | 'menu' | 'employees' | 'settings';

export function BackOffice({ currentUser, onLogout, onSwitchToTablet, initialScreen }: BackOfficeProps) {
  const [currentScreen, setCurrentScreen] = useState<BackOfficeScreen>('dashboard');
  const [storeName, setStoreName] = useState('POSS');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);

  // Set initial screen when component mounts
  useEffect(() => {
    if (initialScreen) {
      setCurrentScreen(initialScreen);
    }
  }, [initialScreen]);

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

  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports' as const, label: 'Laporan', icon: FileText },
    { id: 'inventory' as const, label: 'Inventori', icon: Package },
    { id: 'menu' as const, label: 'Menu', icon: Cake },
    { id: 'employees' as const, label: 'Karyawan', icon: Users },
    { id: 'settings' as const, label: 'Pengaturan', icon: SettingsIcon },
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            {storeLogo ? (
              <img src={storeLogo} alt="Store Logo" className="w-6 h-6 object-contain" />
            ) : (
              <Cake className="w-6 h-6 text-orange-600" />
            )}
            <span className="text-orange-600">{storeName}</span>
          </div>
          <p className="text-gray-500">Back Office</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentScreen === item.id
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={onSwitchToTablet}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Tablet className="w-5 h-5" />
            <span>Mode POS</span>
          </button>
          <div className="px-4 py-2 text-gray-600">
            {currentUser.name}
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentScreen === 'dashboard' && <Dashboard />}
        {currentScreen === 'reports' && <Reports />}
        {currentScreen === 'inventory' && <Inventory />}
        {currentScreen === 'menu' && <MenuManagement />}
        {currentScreen === 'employees' && <EmployeeManagement />}
        {currentScreen === 'settings' && <Settings />}
      </div>
    </div>
  );
}