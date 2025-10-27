import { useState } from 'react';
import { X, Percent, Banknote } from 'lucide-react';

interface DiscountModalProps {
  currentDiscount: number;
  subtotal: number;
  onClose: () => void;
  onApply: (discount: number) => void;
}

const PRESET_DISCOUNTS = [
  { label: '10%', type: 'percentage' as const, value: 10 },
  { label: '20%', type: 'percentage' as const, value: 20 },
  { label: '50%', type: 'percentage' as const, value: 50 },
  { label: 'Rp 5.000', type: 'fixed' as const, value: 5000 },
  { label: 'Rp 10.000', type: 'fixed' as const, value: 10000 },
];

export function DiscountModal({ currentDiscount, subtotal, onClose, onApply }: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateDiscount = (type: 'percentage' | 'fixed', value: number) => {
    if (type === 'percentage') {
      return (subtotal * value) / 100;
    }
    return value;
  };

  const handlePresetClick = (type: 'percentage' | 'fixed', value: number) => {
    const discount = calculateDiscount(type, value);
    onApply(discount);
  };

  const handleCustomApply = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) return;
    
    const discount = calculateDiscount(discountType, value);
    onApply(Math.min(discount, subtotal));
  };

  const handleRemoveDiscount = () => {
    onApply(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-gray-900">Terapkan Diskon</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Discount */}
          {currentDiscount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-orange-900">Diskon Saat Ini</p>
                <p className="text-orange-600">{formatRupiah(currentDiscount)}</p>
              </div>
              <button
                onClick={handleRemoveDiscount}
                className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
              >
                Hapus
              </button>
            </div>
          )}

          {/* Preset Discounts */}
          <div>
            <h3 className="text-gray-900 mb-3">Diskon Cepat</h3>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_DISCOUNTS.map((preset, index) => {
                const discountAmount = calculateDiscount(preset.type, preset.value);
                return (
                  <button
                    key={index}
                    onClick={() => handlePresetClick(preset.type, preset.value)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-center"
                  >
                    <div className="text-gray-900 mb-1">{preset.label}</div>
                    <div className="text-orange-600">{formatRupiah(discountAmount)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Discount */}
          <div>
            <h3 className="text-gray-900 mb-3">Diskon Kustom</h3>
            
            {/* Discount Type Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setDiscountType('percentage')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  discountType === 'percentage'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Percent className="w-4 h-4" />
                Persentase
              </button>
              <button
                onClick={() => setDiscountType('fixed')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  discountType === 'fixed'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Banknote className="w-4 h-4" />
                Nominal Tetap
              </button>
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? 'Masukkan %' : 'Masukkan Rp'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                onClick={handleCustomApply}
                disabled={!discountValue}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
