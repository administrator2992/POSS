import { useState } from 'react';
import { Order } from '../TabletPOS';
import { CreditCard, Banknote, Smartphone, Gift, ArrowLeft, Split } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentScreenProps {
  order: Order;
  onPaymentComplete: (order: Order) => void;
  onBack: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'qris' | 'voucher';

interface Payment {
  method: PaymentMethod;
  amount: number;
}

export function PaymentScreen({ order, onPaymentComplete, onBack }: PaymentScreenProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = order.total - totalPaid;
  const change = cashAmount ? parseFloat(cashAmount) - remainingAmount : 0;

  const formatRupiah = (amount: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const paymentMethods = [
    { id: 'cash' as const, label: 'Tunai', icon: Banknote, color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { id: 'card' as const, label: 'Kartu', icon: CreditCard, color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { id: 'qris' as const, label: 'QRIS', icon: Smartphone, color: 'bg-brown-100 text-brown-700 border-brown-300' },
    { id: 'voucher' as const, label: 'Voucher', icon: Gift, color: 'bg-orange-100 text-orange-700 border-orange-300' },
  ];

  const quickAmounts = [20000, 50000, 100000, 200000];

  const addPayment = (method: PaymentMethod, amount: number) => {
    if (amount <= 0 || amount > remainingAmount) {
      toast.error('Jumlah pembayaran tidak valid');
      return;
    }

    setPayments([...payments, { method, amount }]);
    setCashAmount('');
    toast.success(`Pembayaran ${method.toUpperCase()} ditambahkan`);
  };

  const handlePayFull = () => {
    if (selectedMethod === 'cash') {
      const amount = parseFloat(cashAmount);
      if (!cashAmount || amount < remainingAmount) {
        toast.error('Jumlah tunai tidak cukup');
        return;
      }
    }

    addPayment(selectedMethod, remainingAmount);
  };

  const handleCompletePayment = () => {
    if (remainingAmount > 0.01) {
      toast.error('Pembayaran belum lengkap');
      return;
    }

    toast.success('Pembayaran berhasil diselesaikan!');
    setTimeout(() => onPaymentComplete(order), 500);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali ke Pesanan
        </button>
        <h1 className="text-gray-900">Pembayaran</h1>
        <button
          onClick={() => setIsSplitting(!isSplitting)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isSplitting
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Split className="w-4 h-4" />
          Bagi Tagihan
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Payment Methods */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Payment Method Selection */}
            <div>
              <h2 className="text-gray-900 mb-4">Metode Pembayaran</h2>
              <div className="grid grid-cols-4 gap-4">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedMethod === method.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <method.icon className={`w-8 h-8 mx-auto mb-2 ${
                      selectedMethod === method.id ? 'text-orange-600' : 'text-gray-400'
                    }`} />
                    <div className="text-gray-900">{method.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Input */}
            {selectedMethod === 'cash' && (
              <div>
                <h2 className="text-gray-900 mb-4">Jumlah Tunai</h2>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Masukkan jumlah tunai"
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 mb-4"
                  step="0.01"
                  min="0"
                />
                <div className="grid grid-cols-4 gap-3">
                  {quickAmounts.map(amount => (
                    <button
                      key={amount}
                      onClick={() => setCashAmount(amount.toString())}
                      className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {formatRupiah(amount)}
                    </button>
                  ))}
                </div>
                {change > 0 && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-orange-600">Kembalian</div>
                    <div className="text-orange-900">{formatRupiah(change)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePayFull}
                disabled={remainingAmount <= 0}
                className="flex-1 px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bayar {formatRupiah(remainingAmount)}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Order Summary & Payments */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Order Items */}
          <div className="flex-1 overflow-auto p-6 border-b border-gray-200">
            <h3 className="text-gray-900 mb-4">Ringkasan Pesanan</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-gray-600">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatRupiah(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payments Made */}
          {payments.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-gray-900 mb-4">Pembayaran</h3>
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center text-gray-600">
                    <span className="capitalize">{payment.method}</span>
                    <div className="flex items-center gap-2">
                      <span>{formatRupiah(payment.amount)}</span>
                      <button
                        onClick={() => removePayment(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Diskon</span>
                  <span>-{formatRupiah(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Pajak</span>
                <span>{formatRupiah(order.tax)}</span>
              </div>
              <div className="flex justify-between text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatRupiah(order.total)}</span>
              </div>
              {totalPaid > 0 && (
                <>
                  <div className="flex justify-between text-orange-600">
                    <span>Dibayar</span>
                    <span>{formatRupiah(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900">
                    <span>Sisa</span>
                    <span>{formatRupiah(remainingAmount)}</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleCompletePayment}
              disabled={remainingAmount > 0.01}
              className="w-full px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selesaikan Pembayaran
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}