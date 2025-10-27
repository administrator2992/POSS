import { useState, useEffect, useRef } from 'react';
import { Save, Store, Users, Bell, CreditCard, Printer, Database, Wifi, Share2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../../services/ApiService';
import { dbService } from '../../services/DatabaseService';

interface BusinessSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxRate: number;
  currency: string;
  timezone: string;
  storeLogo?: string; // Base64 encoded logo
}

interface NotificationSettings {
  lowStockAlerts: boolean;
  orderNotifications: boolean;
  shiftReports: boolean;
}

interface PaymentSettings {
  cashEnabled: boolean;
  creditCardEnabled: boolean;
  digitalWalletEnabled: boolean;
  defaultPaymentMethod: string;
}

interface PrinterSettings {
  printerEnabled: boolean;
  printerName: string;
  autoPrintReceipts: boolean;
}

interface NetworkSettings {
  enableBroadcasting: boolean;
  broadcastInterval: number;
  autoSync: boolean;
}



export function Settings() {
  const [activeTab, setActiveTab] = useState('business');
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    storeName: 'Toko Kue',
    storeAddress: 'Jl. Merdeka No. 123, Jakarta',
    storePhone: '+62 21 1234 5678',
    taxRate: 10,
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    storeLogo: undefined,
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    lowStockAlerts: true,
    orderNotifications: true,
    shiftReports: true,
  });
  
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    cashEnabled: true,
    creditCardEnabled: true,
    digitalWalletEnabled: true,
    defaultPaymentMethod: 'cash',
  });

  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    printerEnabled: false,
    printerName: '',
    autoPrintReceipts: false,
  });

  const [networkSettings, setNetworkSettings] = useState<NetworkSettings>({
    enableBroadcasting: false,
    broadcastInterval: 30,
    autoSync: false,
  });

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await dbService.getSettings();
        if (savedSettings.business) setBusinessSettings(savedSettings.business);
        if (savedSettings.notifications) setNotificationSettings(savedSettings.notifications);
        if (savedSettings.payments) setPaymentSettings(savedSettings.payments);
        if (savedSettings.printer) setPrinterSettings(savedSettings.printer);
        if (savedSettings.network) setNetworkSettings(savedSettings.network);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleBusinessSettingsChange = (field: keyof BusinessSettings, value: string | number) => {
    setBusinessSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleBusinessSettingsChange('storeLogo', event.target.result as string);
          toast.success('Logo berhasil diunggah');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationSettingsChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentSettingsChange = (field: keyof PaymentSettings, value: string | boolean) => {
    setPaymentSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePrinterSettingsChange = (field: keyof PrinterSettings, value: string | boolean) => {
    setPrinterSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNetworkSettingsChange = (field: keyof NetworkSettings, value: string | number | boolean) => {
    const updatedSettings = { ...networkSettings, [field]: value };
    setNetworkSettings(updatedSettings);
    
    // Handle broadcasting toggle
    if (field === 'enableBroadcasting') {
      if (value) {
        apiService.startBroadcasting();
      } else {
        apiService.stopBroadcasting();
      }
    }
  };

  const handleSave = async () => {
    try {
      // Save settings to database
      const allSettings = {
        business: businessSettings,
        notifications: notificationSettings,
        payments: paymentSettings,
        printer: printerSettings,
        network: networkSettings
      };
      
      await dbService.saveSettings(allSettings);
      
      toast.success('Pengaturan berhasil diatur');
      console.log('Business Settings:', businessSettings);
      console.log('Notification Settings:', notificationSettings);
      console.log('Payment Settings:', paymentSettings);
      console.log('Printer Settings:', printerSettings);
      console.log('Network Settings:', networkSettings);

      // If auto sync is enabled, sync with network
      if (networkSettings.autoSync) {
        await apiService.syncWithNetwork();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleManualSync = async () => {
    const result = await apiService.syncWithNetwork();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const tabs = [
    { id: 'business', name: 'Business', icon: Store },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'printer', name: 'Printer', icon: Printer },
    { id: 'network', name: 'Network', icon: Wifi },
    { id: 'users', name: 'Users', icon: Users },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">Pengaturan</h1>
            <p className="text-gray-600">Kelola preferensi dan konfigurasi toko Anda</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Simpan Perubahan
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-orange-600 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Business Settings */}
            {activeTab === 'business' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Informasi Bisnis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Store Logo Upload */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo Toko
                    </label>
                    <div className="flex items-center gap-4">
                      {businessSettings.storeLogo ? (
                        <img 
                          src={businessSettings.storeLogo} 
                          alt="Store Logo" 
                          className="w-16 h-16 object-contain rounded-lg border border-gray-300"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
                          <Store className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer">
                          <Upload className="w-4 h-4" />
                          Unggah Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-sm text-gray-500 mt-2">Format: JPG, PNG, GIF (Max 2MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Store Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Toko
                    </label>
                    <input
                      type="text"
                      value={businessSettings.storeName}
                      onChange={(e) => handleBusinessSettingsChange('storeName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Telepon
                    </label>
                    <input
                      type="text"
                      value={businessSettings.storePhone}
                      onChange={(e) => handleBusinessSettingsChange('storePhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat Toko
                    </label>
                    <textarea
                      value={businessSettings.storeAddress}
                      onChange={(e) => handleBusinessSettingsChange('storeAddress', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarif Pajak (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={businessSettings.taxRate}
                      onChange={(e) => handleBusinessSettingsChange('taxRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mata Uang
                    </label>
                    <select
                      value={businessSettings.currency}
                      onChange={(e) => handleBusinessSettingsChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="IDR">IDR (Rupiah Indonesia)</option>
                      <option value="USD">USD (Dolar AS)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Waktu
                    </label>
                    <select
                      value={businessSettings.timezone}
                      onChange={(e) => handleBusinessSettingsChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="Asia/Jakarta">Asia/Jakarta</option>
                      <option value="Asia/Makassar">Asia/Makassar</option>
                      <option value="Asia/Jayapura">Asia/Jayapura</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Preferensi Notifikasi</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Peringatan Stok Rendah</h3>
                      <p className="text-sm text-gray-600">Dapatkan notifikasi ketika inventori menipis</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.lowStockAlerts}
                        onChange={(e) => handleNotificationSettingsChange('lowStockAlerts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Notifikasi Pesanan</h3>
                      <p className="text-sm text-gray-600">Terima peringatan untuk pesanan baru</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.orderNotifications}
                        onChange={(e) => handleNotificationSettingsChange('orderNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Laporan Shift</h3>
                      <p className="text-sm text-gray-600">Laporan ringkasan shift harian</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.shiftReports}
                        onChange={(e) => handleNotificationSettingsChange('shiftReports', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Metode Pembayaran</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Tunai</h3>
                      <p className="text-sm text-gray-600">Terima pembayaran tunai</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.cashEnabled}
                        onChange={(e) => handlePaymentSettingsChange('cashEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Kartu Kredit/Debit</h3>
                      <p className="text-sm text-gray-600">Terima pembayaran kartu</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.creditCardEnabled}
                        onChange={(e) => handlePaymentSettingsChange('creditCardEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Dompet Digital</h3>
                      <p className="text-sm text-gray-600">Terima pembayaran digital (OVO, GoPay, dll.)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.digitalWalletEnabled}
                        onChange={(e) => handlePaymentSettingsChange('digitalWalletEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                
                  <div className="pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metode Pembayaran Default
                    </label>
                    <select
                      value={paymentSettings.defaultPaymentMethod}
                      onChange={(e) => handlePaymentSettingsChange('defaultPaymentMethod', e.target.value)}
                      className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="cash">Tunai</option>
                      <option value="card">Kartu Kredit/Debit</option>
                      <option value="digital">Dompet Digital</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Printer Settings */}
            {activeTab === 'printer' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Konfigurasi Printer</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Aktifkan Printer</h3>
                      <p className="text-sm text-gray-600">Hubungkan ke printer struk</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printerSettings.printerEnabled}
                        onChange={(e) => handlePrinterSettingsChange('printerEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                
                  {printerSettings.printerEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama/Model Printer
                        </label>
                        <input
                          type="text"
                          value={printerSettings.printerName}
                          onChange={(e) => handlePrinterSettingsChange('printerName', e.target.value)}
                          placeholder="contoh: Epson TM-T20"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Cetak Struk Otomatis</h3>
                          <p className="text-sm text-gray-600">Cetak struk secara otomatis setelah pembayaran</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={printerSettings.autoPrintReceipts}
                            onChange={(e) => handlePrinterSettingsChange('autoPrintReceipts', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Network Settings */}
            {activeTab === 'network' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Konfigurasi Jaringan</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Aktifkan Penyiaran Data</h3>
                      <p className="text-sm text-gray-600">Siarkan data ke perangkat lain di jaringan</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={networkSettings.enableBroadcasting}
                        onChange={(e) => handleNetworkSettingsChange('enableBroadcasting', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                
                  {networkSettings.enableBroadcasting && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interval Penyiaran (detik)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="300"
                          value={networkSettings.broadcastInterval}
                          onChange={(e) => handleNetworkSettingsChange('broadcastInterval', parseInt(e.target.value) || 30)}
                          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <p className="text-sm text-gray-500 mt-1">Seberapa sering menyiarakan data (10-300 detik)</p>
                      </div>
                    
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Sinkronisasi Otomatis</h3>
                          <p className="text-sm text-gray-600">Secara otomatis sinkronkan data saat menyimpan pengaturan</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={networkSettings.autoSync}
                            onChange={(e) => handleNetworkSettingsChange('autoSync', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    </>
                  )}
                
                  <div className="pt-4">
                    <button
                      onClick={handleManualSync}
                      disabled={!networkSettings.enableBroadcasting}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Share2 className="w-4 h-4" />
                      Sinkronkan Data Sekarang
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Siarkan semua data ke perangkat jaringan secara manual
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Users Settings */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Manajemen Pengguna</h2>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800">
                    Manajemen pengguna tersedia di bagian Manajemen Karyawan. 
                    Silakan navigasi ke halaman Manajemen Karyawan untuk menambah atau mengedit pengguna.
                  </p>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
}