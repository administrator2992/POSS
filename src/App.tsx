import { useState } from 'react';
import { Toaster } from 'sonner';
import { LoginScreen } from './components/LoginScreen';
import { TabletPOS } from './components/TabletPOS';
import { BackOffice } from './components/BackOffice';

export type UserRole = 'cashier' | 'manager' | null;

export interface Employee {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
}

function App() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [viewMode, setViewMode] = useState<'tablet' | 'backoffice'>('tablet');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [backOfficeScreen, setBackOfficeScreen] = useState<'dashboard' | 'reports' | 'inventory' | 'menu' | 'employees' | 'settings' | null>(null);

  const handleLogin = (user: Employee) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsClockedIn(false);
    setBackOfficeScreen(null);
  };

  const handleClockIn = () => {
    setIsClockedIn(true);
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
  };

  const toggleViewMode = (screen?: 'settings' | 'inventory') => {
    if (screen) {
      setBackOfficeScreen(screen);
      setViewMode('backoffice');
    } else {
      setViewMode(prev => {
        if (prev === 'backoffice') {
          // Reset back office screen when switching to tablet
          setBackOfficeScreen(null);
        }
        return prev === 'tablet' ? 'backoffice' : 'tablet';
      });
    }
  };

  if (!currentUser) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  if (!isClockedIn && viewMode === 'tablet') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-12 max-w-md w-full text-center">
          <h2 className="mb-6">Selamat Datang, {currentUser.name}</h2>
          <p className="text-gray-600 mb-8">Silakan masuk untuk memulai shift Anda</p>
          <div className="space-y-4">
            <button
              onClick={handleClockIn}
              className="w-full bg-orange-600 text-white px-6 py-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Masuk
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-200 text-gray-700 px-6 py-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      {viewMode === 'tablet' ? (
        <TabletPOS
          currentUser={currentUser}
          onLogout={handleLogout}
          onClockOut={handleClockOut}
          onSwitchToBackOffice={currentUser.role === 'manager' ? toggleViewMode : undefined}
        />
      ) : (
        <BackOffice
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchToTablet={() => toggleViewMode()}
          initialScreen={backOfficeScreen || undefined}
        />
      )}
    </>
  );
}

export default App;