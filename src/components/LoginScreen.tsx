import { useState, useEffect } from 'react';
import { Lock, User } from 'lucide-react';
import { Employee } from '../App';
import { toast } from 'sonner';
import { dbService } from '../services/DatabaseService';

interface LoginScreenProps {
  onLogin: (user: Employee) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [pin, setPin] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const loadEmployees = async () => {
      // Initialize default data
      await dbService.initializeDefaultData();
      const storedEmployees = await dbService.getEmployees();
      setEmployees(storedEmployees);
    };
    
    loadEmployees();
  }, []);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        // Auto-submit when 4 digits entered
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <User className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-gray-900 mb-2">Login Karyawan</h1>
          <p className="text-gray-500">Masukkan PIN 4 digit Anda</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50"
              >
                {pin[i] && (
                  <Lock className="w-6 h-6 text-orange-600" />
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

        <div className="text-center text-gray-400 mt-8">
          <p>PIN Demo: 1234 (Manager), 5678 (Kasir)</p>
        </div>
      </div>
    </div>
  );
}