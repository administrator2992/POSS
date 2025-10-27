import { useState } from 'react';
import { X } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  code?: string;
}

interface ItemModifierModalProps {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (item: MenuItem, modifiers: string[], notes: string) => void;
}

// Updated modifier options for bakery items
const MODIFIER_OPTIONS = {
  Ukuran: ['Kecil (-Rp 5.000)', 'Reguler', 'Besar (+Rp 5.000)'],
  Topping: ['Keju (+Rp 3.000)', 'Coklat (+Rp 2.500)', 'Kacang (+Rp 2.000)', 'Kelapa (+Rp 1.500)'],
  Kemasan: ['Biasa', 'Premium (+Rp 1.000)', 'Eksklusif (+Rp 2.000)'],
};

const formatRupiah = (amount: number) => {
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
  }).format(amount);
};

export function ItemModifierModal({ item, onClose, onConfirm }: ItemModifierModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const toggleModifier = (modifier: string) => {
    setSelectedModifiers(prev =>
      prev.includes(modifier)
        ? prev.filter(m => m !== modifier)
        : [...prev, modifier]
    );
  };

  const handleConfirm = () => {
    onConfirm(item, selectedModifiers, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-gray-900 mb-1">{item.name}</h2>
            <p className="text-gray-600">
              {formatRupiah(item.price)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {Object.entries(MODIFIER_OPTIONS).map(([category, options]) => (
            <div key={category}>
              <h3 className="text-gray-900 mb-3">{category}</h3>
              <div className="grid grid-cols-2 gap-2">
                {options.map(option => (
                  <button
                    key={option}
                    onClick={() => toggleModifier(option)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                      selectedModifiers.includes(option)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <h3 className="text-gray-900 mb-3">Catatan Khusus</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan permintaan khusus..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-orange-500"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Tambah ke Pesanan
          </button>
        </div>
      </div>
    </div>
  );
}