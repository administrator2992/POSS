import { useState, useEffect } from 'react';
import { Lock, User, UserPlus } from 'lucide-react';
import { Employee } from '../App';
import { toast } from 'sonner';
import { dbService, Employee as DbEmployee } from '../services/DatabaseService';

interface LoginScreenProps {
  onLogin: (user: Employee) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [pin, setPin] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration form state
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPinConfirm, setRegPinConfirm] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSaving, setRegSaving] = useState(false);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const storedEmployees = await dbService.getEmployees();
        setEmployees(storedEmployees);
      } catch (error) {
        console.error('Error loading employees:', error);
        toast.error('Gagal memuat data karyawan');
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 6) {
        const employee = employees.find(emp => emp.pin === newPin);
        if (employee) {
          toast.success(`Selamat Datang, ${employee.name}!`);
          setTimeout(() => onLogin(employee), 300);
        } else {
          toast.error('PIN Tidak Valid');
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const handleRegister = async () => {
    if (!regName.trim()) {
      toast.error('Nama harus diisi');
      return;
    }
    if (regPin.length !== 6) {
      toast.error('PIN harus 6 digit');
      return;
    }
    if (regPin !== regPinConfirm) {
      toast.error('Konfirmasi PIN tidak cocok');
      return;
    }

    try {
      setRegSaving(true);

      const newEmployee: DbEmployee = {
        id: Date.now().toString(),
        name: regName.trim(),
        pin: regPin,
        role: 'manager',
        position: 'Manager',
        phone: regPhone.trim() || undefined,
        hourlyRate: 0,
        isActive: true,
      };

      await dbService.addEmployee(newEmployee);

      // Reload employees and auto-login
      const updatedEmployees = await dbService.getEmployees();
      setEmployees(updatedEmployees);

      toast.success(`Akun berhasil dibuat! Selamat datang, ${newEmployee.name}`);
      setShowRegister(false);

      const loginUser: Employee = {
        id: newEmployee.id,
        name: newEmployee.name,
        pin: newEmployee.pin,
        role: newEmployee.role,
      };
      setTimeout(() => onLogin(loginUser), 500);
    } catch (error) {
      console.error('Error registering employee:', error);
      toast.error('Gagal membuat akun');
    } finally {
      setRegSaving(false);
    }
  };

  // ─── Registration Form ──────────────────────────────────────────────────────

  if (!loading && employees.length === 0 && !showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-gray-900 mb-2">Selamat Datang di POSS</h1>
          <p className="text-gray-500 mb-8">
            Belum ada akun terdaftar. Buat akun admin pertama Anda untuk memulai.
          </p>
          <button
            onClick={() => setShowRegister(true)}
            className="w-full bg-orange-600 text-white px-6 py-4 rounded-lg hover:bg-orange-700 transition-colors text-lg font-medium"
          >
            Buat Akun Admin
          </button>
        </div>
      </div>
    );
  }

  if (!loading && showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-2">
              <UserPlus className="w-6 h-6 text-orange-600" />
            </div>
            <h1 className="text-gray-900 text-lg mb-0.5">Registrasi Admin</h1>
            <p className="text-gray-500 text-xs">Buat akun admin pertama untuk mengelola sistem</p>
          </div>

          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>

            {/* PIN + Confirm PIN side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">PIN (6 digit)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center text-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Konfirmasi PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={regPinConfirm}
                  onChange={(e) => setRegPinConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ulangi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center text-xl"
                />
              </div>
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nomor Telepon <span className="text-gray-400">(opsional)</span>
              </label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+62 812 3456 7890"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>

            {/* Buttons */}
            <div className="pt-1 space-y-2">
              <button
                onClick={handleRegister}
                disabled={regSaving}
                className="w-full bg-orange-600 text-white px-4 py-2.5 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {regSaving ? 'Membuat akun...' : 'Daftar & Mulai'}
              </button>
              <button
                onClick={() => {
                  setShowRegister(false);
                  setRegName('');
                  setRegPin('');
                  setRegPinConfirm('');
                  setRegPhone('');
                }}
                className="w-full bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Login PIN Pad ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <User className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-gray-900 mb-2">Login Karyawan</h1>
          <p className="text-gray-500">Masukkan PIN 6 digit Anda</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Memuat data...</div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50"
                  >
                    {pin[i] && (
                      <Lock className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className="h-16 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-900 border border-gray-200"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="h-16 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600 border border-red-200"
              >
                Hapus
              </button>
              <button
                onClick={() => handleNumberClick('0')}
                className="h-16 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-900 border border-gray-200"
              >
                0
              </button>
              <div className="h-16"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
