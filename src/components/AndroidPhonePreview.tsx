/**
 * Android Phone Preview - Realistic SDK Integration
 * Simulates a real Android app with HyperCheckout SDK
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { HyperServices, SDKResponse, SDKEvent } from './HyperCheckoutSDK';
import {
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  ChevronRight,
  Shield,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  IndianRupee
} from 'lucide-react';

interface AndroidPhonePreviewProps {
  merchantId: string;
  clientId: string;
  apiKey: string;
  environment: 'sandbox' | 'production';
  onLog: (type: 'info' | 'success' | 'error' | 'warning' | 'sdk', message: string, details?: string) => void;
  sessionPayload: any;
  orderDetails: { orderId: string; amount: string; customerId: string } | null;
  sdkStatus: 'idle' | 'initiating' | 'ready' | 'processing' | 'success' | 'error' | 'cancelled';
  onSdkStatusChange: (status: AndroidPhonePreviewProps['sdkStatus']) => void;
  paymentPageUrl?: string | null;
  onUseRealPage?: () => void;
}

// Payment method types
interface PaymentMethod {
  id: string;
  name: string;
  type: 'upi' | 'card' | 'wallet' | 'netbanking';
  icon: React.ReactNode;
  description?: string;
  popular?: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'upi',
    name: 'UPI',
    type: 'upi',
    icon: <Smartphone className="w-5 h-5" />,
    description: 'Google Pay, PhonePe, Paytm',
    popular: true
  },
  {
    id: 'card',
    name: 'Card',
    type: 'card',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Visa, Mastercard, RuPay',
    popular: true
  },
  {
    id: 'wallet',
    name: 'Wallet',
    type: 'wallet',
    icon: <Wallet className="w-5 h-5" />,
    description: 'Paytm, Amazon Pay, Mobikwik'
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    type: 'netbanking',
    icon: <Building2 className="w-5 h-5" />,
    description: 'All major banks'
  }
];

// Android status bar time
const useAndroidTime = () => {
  const [time, setTime] = useState('12:00');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
};

export function AndroidPhonePreview({
  merchantId,
  clientId,
  environment,
  onLog,
  sessionPayload,
  orderDetails,
  sdkStatus,
  onSdkStatusChange,
  paymentPageUrl,
  onUseRealPage
}: AndroidPhonePreviewProps) {
  // Android time
  const androidTime = useAndroidTime();

  // SDK instance
  const sdkRef = useRef<HyperServices | null>(null);

  // UI States
  const [currentScreen, setCurrentScreen] = useState<'products' | 'cart' | 'payment'>('products');
  const [showHyperCheckout, setShowHyperCheckout] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'methods' | 'details' | 'processing' | 'result'>('methods');
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string; txnId?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cartCount, setCartCount] = useState(1);

  // Initialize SDK when component mounts
  useEffect(() => {
    if (!sdkRef.current) {
      sdkRef.current = new HyperServices();

      // Set up callback listener
      sdkRef.current.setCallbackListener((response: SDKResponse) => {
        handleSDKEvent(response);
      });

      onLog('info', 'Android Activity: onCreate()');
      onLog('sdk', 'HyperServices instance created');
    }

    return () => {
      sdkRef.current?.terminate();
      sdkRef.current = null;
    };
  }, []);

  // Handle SDK events
  const handleSDKEvent = useCallback((response: SDKResponse) => {
    const { event, payload, error } = response;

    switch (event) {
      case 'initiate_started':
        onLog('sdk', 'Event: initiate_started');
        onSdkStatusChange('initiating');
        break;

      case 'initiate_result':
        onLog('sdk', 'Event: initiate_result', JSON.stringify(payload, null, 2));
        if (payload?.status === 'success') {
          onSdkStatusChange('ready');
          onLog('success', 'SDK ready for payments');
        }
        break;

      case 'process_started':
        onLog('sdk', 'Event: process_started', JSON.stringify(payload, null, 2));
        onSdkStatusChange('processing');
        setShowHyperCheckout(true);
        setPaymentStep('methods');
        break;

      case 'show_loader':
        setIsLoading(true);
        break;

      case 'hide_loader':
        setIsLoading(false);
        break;

      case 'process_result':
        onLog('sdk', 'Event: process_result', JSON.stringify(payload, null, 2));
        handlePaymentResult(payload);
        break;

      case 'terminate':
        onLog('info', 'SDK terminated');
        onSdkStatusChange('idle');
        break;
    }
  }, [onLog, onSdkStatusChange]);

  // Handle payment result
  const handlePaymentResult = (payload: any) => {
    setIsLoading(false);

    if (payload?.status === 'charged') {
      setPaymentResult({
        success: true,
        message: 'Payment successful!',
        txnId: payload.transactionId
      });
      setPaymentStep('result');
      onSdkStatusChange('success');
      onLog('success', `Payment charged: ${payload.transactionId}`);
    } else if (payload?.status === 'cancelled') {
      setPaymentResult({
        success: false,
        message: 'Payment cancelled'
      });
      setPaymentStep('result');
      onSdkStatusChange('cancelled');
    } else {
      setPaymentResult({
        success: false,
        message: payload?.errorMessage || 'Payment failed'
      });
      setPaymentStep('result');
      onSdkStatusChange('error');
    }
  };

  // Start SDK initiation
  const initiateSDK = useCallback(() => {
    if (!sdkRef.current) return;

    const initiatePayload = {
      requestId: `REQ_${Date.now()}`,
      service: 'in.juspay.hyperpay',
      payload: {
        action: 'initiate',
        merchantId: merchantId || 'demo_merchant',
        clientId: clientId || 'demo_client',
        environment: environment
      }
    };

    onLog('sdk', 'HyperCheckout.initiate()', JSON.stringify(initiatePayload, null, 2));
    sdkRef.current.initiate(initiatePayload);
  }, [merchantId, clientId, environment, onLog]);

  // Start payment process
  const startPayment = useCallback(() => {
    if (!sdkRef.current || !orderDetails) return;

    // If we have a real payment page URL, use that instead of simulated SDK
    if (paymentPageUrl && onUseRealPage) {
      onLog('info', 'Real payment page available, switching to Real Juspay Page mode');
      onUseRealPage();
      return;
    }

    const processPayload = sessionPayload || {
      requestId: `REQ_${Date.now()}`,
      service: 'in.juspay.hyperpay',
      payload: {
        action: 'paymentPage',
        merchantId: merchantId || 'demo_merchant',
        clientId: clientId || 'demo_client',
        orderId: orderDetails.orderId,
        amount: orderDetails.amount,
        currency: 'INR',
        customerEmail: 'customer@example.com',
        customerMobile: '9876543210'
      }
    };

    onLog('sdk', 'HyperCheckout.process()', JSON.stringify({
      requestId: processPayload.requestId,
      service: processPayload.service,
      orderId: processPayload.payload.orderId,
      amount: processPayload.payload.amount
    }, null, 2));

    sdkRef.current.process(processPayload);
  }, [merchantId, clientId, orderDetails, sessionPayload, onLog, paymentPageUrl, onUseRealPage]);

  // Submit payment with selected method
  const submitPayment = async () => {
    if (!sdkRef.current || !selectedMethod) return;

    setPaymentStep('processing');
    setIsLoading(true);

    onLog('info', `Submitting ${selectedMethod} payment...`);

    await sdkRef.current.submitPayment(selectedMethod);
  };

  // Reset payment flow
  const resetPayment = () => {
    setShowHyperCheckout(false);
    setSelectedMethod(null);
    setPaymentStep('methods');
    setPaymentResult(null);
    setCurrentScreen('products');
    onSdkStatusChange('ready');
  };

  // Render Android status bar
  const StatusBar = () => (
    <div className="h-6 bg-black flex items-center justify-between px-4 text-white text-[10px] select-none">
      <div className="flex items-center gap-1">
        <span className="font-medium">{androidTime}</span>
      </div>
      <div className="flex items-center gap-1">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.18.18-.29.43-.29.71 0 .28.11.53.29.71l11 11c.39.39 1.02.39 1.41 0l11-11c.18-.18.29-.43.29-.71 0-.28-.11-.53-.29-.71C20.66 4.78 16.54 3 12 3z"/>
        </svg>
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
        </svg>
        <div className="flex items-center gap-0.5">
          <div className="w-1 h-2 bg-white rounded-sm" />
          <div className="w-1 h-2 bg-white rounded-sm" />
          <div className="w-1 h-2 bg-white rounded-sm" />
          <div className="w-1 h-2 bg-zinc-600 rounded-sm" />
        </div>
      </div>
    </div>
  );

  // Render Products Screen
  const ProductsScreen = () => (
    <div className="flex-1 flex flex-col bg-zinc-50">
      {/* App Header */}
      <div className="bg-orange-500 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">ShopEase</h1>
            <p className="text-xs opacity-80">Premium Store</p>
          </div>
          <div className="relative">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">SDK Status:</span> {sdkStatus === 'idle' ? 'Not initialized' : sdkStatus === 'ready' ? 'Ready for payment' : sdkStatus}
          </p>
        </div>

        {/* Product Card */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="h-40 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <span className="text-6xl">🎧</span>
          </div>
          <div className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900">Wireless Earbuds Pro</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Noise cancellation • 30h battery</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-600">₹1.00</p>
                <p className="text-xs text-zinc-400 line-through">₹1,999</p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 bg-zinc-100 rounded-lg p-1">
                <button
                  onClick={() => setCartCount(Math.max(0, cartCount - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-zinc-600 shadow-sm"
                >
                  −
                </button>
                <span className="w-6 text-center font-medium">{cartCount}</span>
                <button
                  onClick={() => setCartCount(cartCount + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-orange-600 shadow-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-3 bg-white border-t border-zinc-200">
        <button
          onClick={() => {
            if (sdkStatus === 'idle') {
              initiateSDK();
            }
            setCurrentScreen('cart');
          }}
          disabled={cartCount === 0}
          className={cn(
            "w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors",
            cartCount === 0 ? "bg-zinc-300" : "bg-orange-500 hover:bg-orange-600"
          )}
        >
          Go to Cart
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Render Cart Screen
  const CartScreen = () => (
    <div className="flex-1 flex flex-col bg-zinc-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-zinc-200 flex items-center gap-3">
        <button onClick={() => setCurrentScreen('products')} className="text-zinc-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-lg">Shopping Cart</h1>
      </div>

      {/* Cart Items */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-3">
          <div className="flex gap-3">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-3xl">🎧</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900">Wireless Earbuds Pro</h3>
              <p className="text-xs text-zinc-500">Qty: {cartCount}</p>
              <p className="font-bold text-orange-600 mt-1">₹{(1.00 * cartCount).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-3 mt-3">
          <h3 className="font-semibold text-sm mb-2">Bill Details</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Item Total</span>
              <span>₹{(1.00 * cartCount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Delivery Fee</span>
              <span className="text-green-600">FREE</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Taxes</span>
              <span>₹0.00</span>
            </div>
            <div className="border-t border-zinc-200 pt-2 mt-2">
              <div className="flex justify-between font-bold text-zinc-900">
                <span>To Pay</span>
                <span>₹{(1.00 * cartCount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SDK Status */}
        <div className={cn(
          "rounded-lg p-3 mt-3 border",
          sdkStatus === 'ready' ? "bg-green-50 border-green-200" :
          sdkStatus === 'initiating' ? "bg-amber-50 border-amber-200" :
          "bg-zinc-50 border-zinc-200"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              sdkStatus === 'ready' ? "bg-green-500" :
              sdkStatus === 'initiating' ? "bg-amber-500 animate-pulse" :
              "bg-zinc-400"
            )} />
            <span className="text-xs font-medium">
              {sdkStatus === 'idle' ? 'SDK: Not initialized' :
               sdkStatus === 'initiating' ? 'SDK: Initializing...' :
               sdkStatus === 'ready' ? 'SDK: Ready for payment' :
               `SDK: ${sdkStatus}`}
            </span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="p-3 bg-white border-t border-zinc-200">
        <button
          onClick={() => {
            onLog('info', 'User clicked Proceed to Pay');
            startPayment();
          }}
          disabled={sdkStatus !== 'ready'}
          className={cn(
            "w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors",
            sdkStatus === 'ready' ? "bg-orange-500 hover:bg-orange-600" : "bg-zinc-300"
          )}
        >
          {sdkStatus === 'initiating' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Initializing SDK...
            </>
          ) : (
            <>Proceed to Pay ₹{(1.00 * cartCount).toFixed(2)}</>
          )}
        </button>
      </div>
    </div>
  );

  // Render HyperCheckout Payment Sheet
  const HyperCheckoutSheet = () => (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-white z-50 flex flex-col"
    >
      {/* HyperCheckout Header */}
      <div className="bg-white border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">j</span>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">
                {merchantId || 'Demo Store'}
              </p>
              <p className="text-[10px] text-zinc-500">Powered by Juspay</p>
            </div>
          </div>
          <button
            onClick={() => {
              onLog('warning', 'User dismissed HyperCheckout');
              resetPayment();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Amount Display */}
      <div className="bg-zinc-50 px-4 py-4 border-b border-zinc-200">
        <p className="text-xs text-zinc-500 uppercase tracking-wide">Amount to Pay</p>
        <div className="flex items-baseline gap-2 mt-1">
          <IndianRupee className="w-5 h-5 text-zinc-900" />
          <span className="text-3xl font-bold text-zinc-900">
            {orderDetails?.amount || '1.00'}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Order #{orderDetails?.orderId.slice(-8) || 'XXXXXXXX'}
        </p>
      </div>

      {/* Payment Content */}
      <div className="flex-1 overflow-y-auto">
        {paymentStep === 'methods' && (
          <div className="divide-y divide-zinc-100">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  setSelectedMethod(method.id);
                  onLog('info', `Selected payment method: ${method.name}`);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 transition-colors",
                  selectedMethod === method.id ? "bg-violet-50" : "hover:bg-zinc-50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  method.type === 'upi' ? "bg-green-100 text-green-600" :
                  method.type === 'card' ? "bg-blue-100 text-blue-600" :
                  method.type === 'wallet' ? "bg-purple-100 text-purple-600" :
                  "bg-orange-100 text-orange-600"
                )}>
                  {method.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900">{method.name}</span>
                    {method.popular && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{method.description}</p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  selectedMethod === method.id ? "border-violet-600 bg-violet-600" : "border-zinc-300"
                )}>
                  {selectedMethod === method.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {paymentStep === 'processing' && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4" />
            <p className="font-medium text-zinc-900">Processing Payment...</p>
            <p className="text-sm text-zinc-500 mt-1">Please do not close this screen</p>
          </div>
        )}

        {paymentStep === 'result' && paymentResult && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            {paymentResult.success ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-bold text-lg text-zinc-900">Payment Successful!</p>
                <p className="text-sm text-zinc-500 mt-1">Transaction ID: {paymentResult.txnId?.slice(-8)}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="font-bold text-lg text-zinc-900">Payment Failed</p>
                <p className="text-sm text-zinc-500 mt-1">{paymentResult.message}</p>
              </>
            )}
            <button
              onClick={resetPayment}
              className="mt-6 px-6 py-2 bg-violet-600 text-white rounded-lg font-medium"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Pay Button */}
      {paymentStep === 'methods' && (
        <div className="p-4 border-t border-zinc-200 bg-white">
          <button
            onClick={submitPayment}
            disabled={!selectedMethod || isLoading}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors",
              selectedMethod ? "bg-violet-600 hover:bg-violet-700" : "bg-zinc-300"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay ₹{orderDetails?.amount || '1.00'}</>
            )}
          </button>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] text-zinc-400">
              256-bit SSL Encryption • PCI-DSS Certified
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="relative w-[320px] h-[640px] bg-black rounded-[2.5rem] border-[12px] border-zinc-800 shadow-2xl overflow-hidden">
      {/* Phone Buttons */}
      <div className="absolute -right-[12px] top-24 w-[4px] h-10 bg-zinc-700 rounded-r" />
      <div className="absolute -right-[12px] top-36 w-[4px] h-14 bg-zinc-700 rounded-r" />
      <div className="absolute -left-[12px] top-32 w-[4px] h-7 bg-zinc-700 rounded-l" />

      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-zinc-800 rounded-b-2xl z-50 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-zinc-600" />
        <div className="w-16 h-1 bg-zinc-700 rounded-full" />
      </div>

      {/* Screen */}
      <div className="w-full h-full bg-white rounded-[1.8rem] overflow-hidden flex flex-col pt-6">
        <StatusBar />

        <div className="flex-1 relative">
          {currentScreen === 'products' && <ProductsScreen />}
          {currentScreen === 'cart' && <CartScreen />}

          <AnimatePresence>
            {showHyperCheckout && <HyperCheckoutSheet />}
          </AnimatePresence>
        </div>

        {/* Android Navigation Bar */}
        <div className="h-12 bg-white border-t border-zinc-200 flex items-center justify-around px-4">
          <div className="w-6 h-6 border-2 border-zinc-800 rounded-sm" />
          <div className="w-5 h-5 border-2 border-zinc-800 rounded-full" />
          <svg className="w-5 h-5 text-zinc-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default AndroidPhonePreview;
