'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { orderService } from '@/services/cartService';
import { useCartStore } from '@/store/cartStore';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function OrderSuccessPage() {
  const params = useParams();
  const { resetCount } = useCartStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset cart count when order success page loads
    resetCount();
    loadOrder();
  }, []);

  const loadOrder = async () => {
    try {
      const orderNumber = params.orderNumber as string;
      if (!orderNumber) {
        setError('Order number is missing');
        return;
      }
      const data = await orderService.getOrder(orderNumber);
      setOrder(data);
    } catch (err: any) {
      console.error('Error loading order:', err);
      setError(err.response?.data?.error || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="bg-white md:bg-gray-50 min-h-[calc(100vh-120px)] md:min-h-[calc(100vh-56px)] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-48 h-48 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-12"></div>
            <p className="text-[13px] text-gray-500">Loading order...</p>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error || !order) {
    return (
      <ProtectedRoute>
        <main className="bg-white md:bg-gray-50 min-h-[calc(100vh-120px)] md:min-h-[calc(100vh-56px)] flex items-center justify-center">
          <div className="max-w-[680px] mx-auto px-16 py-32">
            <div className="bg-white border border-red-200 rounded-xl p-24 md:p-32 shadow-sm text-center">
              <div className="w-80 h-80 mx-auto mb-20 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-[48px]">✕</span>
              </div>
              <h1 className="text-[24px] md:text-[28px] font-bold text-gray-900 mb-8">
                Order Not Found
              </h1>
              <p className="text-[14px] text-gray-600 mb-20">
                {error || 'We couldn\'t find this order. It may have been cancelled or the link is invalid.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-12 justify-center">
                <Link
                  href="/products"
                  className="px-24 h-40 bg-brand-600 text-white rounded-lg font-semibold text-[14px] flex items-center justify-center hover:bg-brand-700 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="bg-white md:bg-gray-50 min-h-[calc(100vh-120px)] md:min-h-[calc(100vh-56px)]">
        <div className="max-w-[680px] mx-auto px-16 py-32 md:py-40">
          <div className="bg-white border border-gray-200 rounded-xl p-24 md:p-32 shadow-sm text-center">
            {/* Success Icon */}
            <div className="w-80 h-80 mx-auto mb-20 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-[48px]">✓</span>
            </div>

            <h1 className="text-[24px] md:text-[28px] font-bold text-gray-900 mb-8">
              Order Placed Successfully!
            </h1>
            
            <p className="text-[14px] text-gray-600 mb-20">
              Thank you for your order. We&apos;ve received your order and will process it soon.
            </p>

            {order && (
              <div className="bg-gray-50 rounded-lg p-20 mb-24 text-left">
                <div className="grid grid-cols-2 gap-12 text-[13px]">
                  <div>
                    <div className="text-gray-500 mb-4">Order Number</div>
                    <div className="font-semibold text-gray-900">{order.order_number || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-4">Total Amount</div>
                    <div className="font-semibold text-gray-900">
                      ${order.total ? parseFloat(order.total).toFixed(2) : '0.00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-4">Payment Method</div>
                    <div className="font-semibold text-gray-900 capitalize">
                      {order.payment_method ? order.payment_method.replace(/_/g, ' ') : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-4">Status</div>
                    <div className="font-semibold text-gray-900 capitalize">{order.status || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-12 justify-center">
              <Link
                href={order ? `/orders/${order.order_number}` : '/orders'}
                className="px-24 h-40 bg-brand-600 text-white rounded-lg font-semibold text-[14px] flex items-center justify-center hover:bg-brand-700 transition-colors"
              >
                View Order Details
              </Link>
              <Link
                href="/products"
                className="px-24 h-40 bg-white border border-gray-300 text-gray-900 rounded-lg font-semibold text-[14px] flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
