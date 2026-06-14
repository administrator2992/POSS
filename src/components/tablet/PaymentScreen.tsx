import { useState, useEffect, useRef, useCallback } from 'react';
import { Order } from '../TabletPOS';
import { CreditCard, Banknote, Smartphone, Gift, ArrowLeft, Split, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { createQrisOrder, pollQrisPayment, cancelQrisOrder, QrisStatus } from '../../services/DanaService';

const getFriendlyErrorMessage = (err: string | null | undefined): string => {
  if (!err) return 'Terjadi kesalahan sistem. Silakan coba kembali.';
  
  const lowerErr = err.toLowerCase();
  
  if (lowerErr.includes('5005401') || lowerErr.includes('internal server error')) {
    return 'Gagal memproses pembayaran DANA (Error Internal DANA). Periksa konfigurasi Merchant ID DANA Anda dan silakan coba lagi.';
  }
  if (lowerErr.includes('4010401') || lowerErr.includes('unauthorized') || lowerErr.includes('invalid signature') || lowerErr.includes('unauthorized_no_auth_header')) {
    return 'Gagal melakukan otentikasi dengan DANA. Periksa konfigurasi Kunci (Private/Public Key) dan Partner ID DANA Anda di backend.';
  }
  if (lowerErr.includes('network') || lowerErr.includes('failed to fetch') || lowerErr.includes('connection failed') || lowerErr.includes('unauthorizedaccess') || lowerErr.includes('failed to load resource')) {
    return 'Gagal terhubung ke server. Periksa koneksi internet Anda atau pastikan server backend aktif.';
  }
  if (lowerErr.includes('timeout')) {
    return 'Waktu permintaan pembayaran DANA habis. Silakan coba lagi.';
  }
  
  return err; // fallback if already friendly
};

interface PaymentScreenProps {
  order: Order;
  onPaymentComplete: (order: Order) => void;
  onBack: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'qris' | 'voucher';
type QrisState = 'idle' | 'generating' | 'waiting' | 'paid' | 'failed' | 'cancelled';

interface Payment {
  method: PaymentMethod;
  amount: number;
}

export function PaymentScreen({ order, onPaymentComplete, onBack }: PaymentScreenProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);

  // QRIS state
  const [qrisState, setQrisState] = useState<QrisState>('idle');
  const [qrisReferenceNo, setQrisReferenceNo] = useState<string | null>(null);
  const [qrisCheckoutUrl, setQrisCheckoutUrl] = useState<string | null>(null);
  const [qrisError, setQrisError] = useState<string | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);

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
    { id: 'qris' as const, label: 'QRIS', icon: Smartphone, color: 'bg-brown-100 text-brown-700 border-brown-300' },
  ];

  const quickAmounts = [20000, 50000, 100000, 200000];

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollAbortRef.current) pollAbortRef.current.abort();
    };
  }, []);

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
      addPayment(selectedMethod, remainingAmount);
    } else if (selectedMethod === 'qris') {
      handleQrisPay();
    } else {
      addPayment(selectedMethod, remainingAmount);
    }
  };

  // ─── QRIS Payment Flow ────────────────────────────────────────────────────

  const handleQrisPay = useCallback(async () => {
    if (remainingAmount <= 0) return;

    setQrisState('generating');
    setQrisError(null);
    setQrisCheckoutUrl(null);

    try {
      const orderId = `POSS${Date.now()}`;
      const result = await createQrisOrder(
        remainingAmount,
        orderId,
        order.items.map((i) => ({ 
          id: i.id, 
          name: i.name, 
          price: i.price, 
          quantity: i.quantity,
          category: i.category 
        }))
      );

      if (!result.success) {
        setQrisState('failed');
        const friendlyMsg = getFriendlyErrorMessage(result.error);
        setQrisError(friendlyMsg);
        toast.error(friendlyMsg);
        return;
      }

      setQrisReferenceNo(result.referenceNo);
      setQrisCheckoutUrl(result.checkoutUrl || result.qrContent);
      setQrisState('waiting');

      // Start polling for payment confirmation
      pollAbortRef.current = new AbortController();
      const finalStatus = await pollQrisPayment(
        result.referenceNo,
        3000,
        15 * 60 * 1000,
        (status: QrisStatus) => {
          console.log('QRIS status:', status.status);
        }
      );

      if (finalStatus.paid) {
        setQrisState('paid');
        toast.success('Pembayaran QRIS berhasil!');
        setPayments((prev) => [...prev, { method: 'qris', amount: remainingAmount }]);

        // Auto-complete after short delay
        setTimeout(() => {
          onPaymentComplete({ ...order, paymentMethod: 'QRIS' });
        }, 2000);
      } else if (finalStatus.status === 'TIMEOUT') {
        setQrisState('failed');
        setQrisError('Waktu pembayaran habis');
        toast.error('Waktu pembayaran habis');
      } else {
        setQrisState('cancelled');
        setQrisError('Pembayaran dibatalkan');
      }
    } catch (error: any) {
      setQrisState('failed');
      const friendlyMsg = getFriendlyErrorMessage(error.message);
      setQrisError(friendlyMsg);
      toast.error(friendlyMsg);
    }
  }, [remainingAmount, order, onPaymentComplete]);

  const handleCancelQris = async () => {
    if (pollAbortRef.current) pollAbortRef.current.abort();

    if (qrisReferenceNo) {
      try {
        await cancelQrisOrder(qrisReferenceNo);
      } catch {
        // ignore
      }
    }

    setQrisState('idle');
    setQrisReferenceNo(null);
    setQrisCheckoutUrl(null);
    setQrisError(null);
    toast.info('Pembayaran QRIS dibatalkan');
  };

  const handleRetryQris = () => {
    setQrisState('idle');
    setQrisReferenceNo(null);
    setQrisCheckoutUrl(null);
    setQrisError(null);
  };

  const handleCompletePayment = () => {
    if (remainingAmount > 0.01) {
      toast.error('Pembayaran belum lengkap');
      return;
    }

    toast.success('Pembayaran berhasil diselesaikan!');
    const mainMethod = payments[0]?.method === 'qris' ? 'QRIS' : 'Tunai';
    setTimeout(() => onPaymentComplete({ ...order, paymentMethod: mainMethod }), 500);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  // ─── QRIS Fullscreen Overlay ─────────────────────────────────────────────

  if (qrisState !== 'idle' && selectedMethod === 'qris') {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={qrisState === 'waiting' ? handleCancelQris : onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {qrisState === 'waiting' ? 'Batalkan' : 'Kembali'}
          </button>
          <h1 className="text-gray-900">Pembayaran QRIS</h1>
          <div className="w-24"></div>
        </div>

        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg p-5 max-w-sm w-full text-center">
            {/* Generating */}
            {qrisState === 'generating' && (
              <div className="py-8">
                <Loader2 className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-gray-900 text-xl mb-2">Membuat QRIS...</h2>
                <p className="text-gray-500">Mohon tunggu sebentar</p>
              </div>
            )}

            {/* Waiting for payment */}
            {qrisState === 'waiting' && (
              <div>
                <div className="mb-2">
                  <Smartphone className="w-8 h-8 text-orange-600 mx-auto mb-1" />
                  <h2 className="text-gray-900 text-lg mb-0.5">Scan QRIS</h2>
                  <p className="text-gray-500 text-xs">
                    Scan kode QR di bawah dengan aplikasi e-wallet atau mobile banking
                  </p>
                </div>

                {/* QR Code Display */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-2 mb-2">
                  {qrisCheckoutUrl ? (
                    <div className="bg-white p-2 rounded-lg">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrisCheckoutUrl)}`}
                        alt="QRIS Code"
                        className="mx-auto"
                        width={180}
                        height={180}
                      />
                    </div>
                  ) : (
                    <div className="py-8 text-gray-400">
                      <Smartphone className="w-12 h-12 mx-auto mb-1 opacity-30" />
                      <p className="text-sm">QR Code tidak tersedia</p>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 mb-2">
                  <div className="text-orange-600 text-xs">Total Pembayaran</div>
                  <div className="text-orange-900 text-xl font-bold">
                    {formatRupiah(remainingAmount)}
                  </div>
                </div>

                {/* Polling indicator */}
                <div className="flex items-center justify-center gap-1.5 text-gray-500 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menunggu pembayaran...</span>
                </div>

                <p className="text-gray-400 text-[10px] mt-2">
                  Kode QR berlaku selama 15 menit
                </p>
              </div>
            )}

            {/* Payment successful */}
            {qrisState === 'paid' && (
              <div className="py-8">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h2 className="text-gray-900 text-xl mb-2">Pembayaran Berhasil!</h2>
                <p className="text-gray-500 mb-2">
                  QRIS payment confirmed
                </p>
                <div className="text-green-600 text-2xl font-bold">
                  {formatRupiah(remainingAmount)}
                </div>
              </div>
            )}

            {/* Failed / Cancelled */}
            {(qrisState === 'failed' || qrisState === 'cancelled') && (
              <div className="py-8">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-gray-900 text-xl mb-2">
                  {qrisState === 'cancelled' ? 'Pembayaran Dibatalkan' : 'Pembayaran Gagal'}
                </h2>
                <p className="text-gray-500 mb-6">{getFriendlyErrorMessage(qrisError)}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleRetryQris}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Coba Lagi
                  </button>
                  <button
                    onClick={() => {
                      setQrisState('idle');
                      setSelectedMethod('cash');
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Ganti Metode
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Normal Payment Screen ────────────────────────────────────────────────

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
              <div className="grid grid-cols-2 gap-4">
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

            {/* QRIS info */}
            {selectedMethod === 'qris' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-blue-900 font-medium">Pembayaran QRIS</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      Kode QR akan ditampilkan untuk di-scan dengan aplikasi e-wallet
                      atau mobile banking pelanggan. Pembayaran akan terkonfirmasi otomatis.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePayFull}
                disabled={remainingAmount <= 0}
                className="flex-1 px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedMethod === 'qris'
                  ? `Bayar QRIS ${formatRupiah(remainingAmount)}`
                  : `Bayar ${formatRupiah(remainingAmount)}`}
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
                        x
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
