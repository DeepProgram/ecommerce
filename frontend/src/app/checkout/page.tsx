'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cartService, Cart, orderService } from '@/services/cartService';
import { addressService, AddressFormData } from '@/services/addressService';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorModal from '@/components/ErrorModal';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Shipping form state
  const [shippingForm, setShippingForm] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  // Billing same as shipping checkbox
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cartService.getCart();
      setCart(data);
    } catch (err) {
      console.error('Error loading cart:', err);
      setError('Unable to load your cart right now.');
    } finally {
      setLoading(false);
    }
  };

  const getItemPrice = (item: any) => {
    const variantPrice = item?.variant?.effective_price || item?.variant?.price;
    const productPrice = item?.product?.base_price || item?.product?.price;
    const price = variantPrice ?? productPrice ?? 0;
    return typeof price === 'string' ? parseFloat(price) : Number(price);
  };

  const getItemImage = (item: any) => {
    const primary = item?.product?.primary_image;
    const fromPrimary = primary?.image || primary;
    const fromGallery = item?.product?.images?.[0]?.image;
    const imagePath = fromPrimary || fromGallery;
    if (!imagePath) return null;
    return imagePath.startsWith('http') ? imagePath : `http://localhost${imagePath}`;
  };

  const subtotal = useMemo(() => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce((sum: number, item: any) => {
      return sum + getItemPrice(item) * item.quantity;
    }, 0);
  }, [cart]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasItems || processing) return; // Prevent multiple submissions
    
    setProcessing(true);
    setError('');
    setShowErrorModal(false);
    
    try {
      // Create shipping address
      const shippingAddressData: AddressFormData = {
        address_type: 'shipping',
        ...shippingForm,
      };
      const shippingAddress = await addressService.createAddress(shippingAddressData);
      
      // Create billing address (same or separate)
      let billingAddress;
      if (billingSameAsShipping) {
        const billingAddressData: AddressFormData = {
          ...shippingAddressData,
          address_type: 'billing',
        };
        billingAddress = await addressService.createAddress(billingAddressData);
      } else {
        billingAddress = shippingAddress; // For now, use same address
      }
      
      // Create order
      const order = await orderService.createOrder(
        shippingAddress.id,
        billingAddress.id,
        paymentMethod,
        orderNotes
      );
      
      // Redirect to order success page
      // Cart will be naturally updated when user navigates back or page reloads
      router.push(`/orders/${order.order_number}`);
      
    } catch (err: any) {
      console.error('Error creating order:', err);
      const errorMessage = err.response?.data?.error || 'Failed to create order. Please try again.';
      setError(errorMessage);
      setShowErrorModal(true);
      setProcessing(false); // Re-enable button only on error
    }
    // Don't set processing to false on success - let navigation handle it
  };

  const hasItems = cart?.items && cart.items.length > 0;

  const inputClass =
    'w-full h-40 px-12 rounded-lg border border-gray-300 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-opacity-20 focus:border-brand-600';

  return (
    <ProtectedRoute>
      <main className="bg-white md:bg-gray-50 md:min-h-[calc(100vh-56px)]">
        {/* Header */}
        <div className="hidden md:block bg-white border-b border-gray-200">
          <div className="max-w-[1280px] mx-auto px-16 md:px-24 py-12">
            <div className="flex items-center gap-8 text-[13px] text-gray-500">
              <Link href="/" className="hover:text-brand-600">Home</Link>
              <span>›</span>
              <Link href="/cart" className="hover:text-brand-600">Cart</Link>
              <span>›</span>
              <span className="text-gray-900 font-medium">Checkout</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto">
          <div className="px-16 md:px-24 pt-20 pb-16 md:py-24">
            <h1 className="text-[22px] leading-[28px] md:text-[28px] md:leading-[36px] font-bold text-gray-900">
              Checkout
            </h1>
            <p className="text-[13px] md:text-[14px] text-gray-500 mt-6">
              {loading ? 'Loading your order...' : hasItems ? 'Complete your order details' : 'Your cart is empty'}
            </p>
          </div>

          {!loading && !hasItems ? (
            <div className="px-16 md:px-24 pb-32">
              <div className="flex items-center justify-center min-h-[300px] md:min-h-[400px] bg-white md:rounded-xl md:border md:border-gray-200 pt-16 pb-16">
                <div className="text-center px-24">
                  <div className="w-64 h-64 mx-auto mb-16 bg-gray-100 rounded-full flex items-center justify-center text-[40px]">
                    🧾
                  </div>
                  <h3 className="text-[18px] font-bold text-gray-900 mb-8">No items to checkout</h3>
                  <p className="text-[13px] text-gray-500 mb-20">
                    Add items to your cart before checking out.
                  </p>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center px-24 h-40 bg-brand-600 text-white rounded-lg font-semibold text-[14px] leading-none hover:bg-brand-700 transition-colors"
                  >
                    Browse Products
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="md:flex md:gap-24 lg:gap-32">
              {/* Left: Forms */}
              <div className="flex-1 px-16 md:px-24 md:pr-0 pb-24 md:pb-32 min-w-0 space-y-16">
                <form onSubmit={handleSubmitOrder} className="space-y-16">
                  {/* Shipping */}
                  <div className="bg-white border border-gray-200 rounded-xl p-20 shadow-sm">
                    <h2 className="text-[16px] font-bold text-gray-900 mb-16">Shipping Address</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div>
                        <label className="block text-[12px] text-gray-600 mb-6">First Name *</label>
                        <input 
                          name="full_name"
                          value={shippingForm.full_name}
                          onChange={handleInputChange}
                          className={inputClass} 
                          placeholder="John"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-gray-600 mb-6">Phone *</label>
                        <input 
                          name="phone"
                          value={shippingForm.phone}
                          onChange={handleInputChange}
                          className={inputClass} 
                          placeholder="+1 555 123 4567"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[12px] text-gray-600 mb-6">Address *</label>
                        <input 
                          name="address_line1"
                          value={shippingForm.address_line1}
                          onChange={handleInputChange}
                          className={inputClass} 
                          placeholder="123 Main St"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[12px] text-gray-600 mb-6">Apartment, suite, etc. (optional)</label>
                        <input 
                          name="address_line2"
                          value={shippingForm.address_line2}
                          onChange={handleInputChange}
                          className={inputClass} 
                          placeholder="Apt 4B"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-gray-600 mb-6">City *</label>
                        <input 
                          name="city"
                          value={shippingForm.city}
                          onChange={handleInputChange}
                          className={inputClass} 
                          placeholder="San Francisco"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-gray-600 mb-6">State/Province *</label>
                        <input 
                          name="state"
                          value={shippingForm.state}
                          onChange={handleInputChange}
                          className={inputClass} 
                          placeholder="California"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-gray-600 mb-6">Postal Code *</label>
                        <input 
                          name="postal_code"
                          value={shippingForm.postal_code}
                          onChange={handleInputChange}
                          className={inputClass} 
                          placeholder="94105"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-gray-600 mb-6">Country *</label>
                        <input 
                          name="country"
                          value={shippingForm.country}
                          onChange={handleInputChange}
                          className={inputClass} 
                          placeholder="United States"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mt-16">
                      <label className="flex items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={billingSameAsShipping}
                          onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                          className="w-16 h-16 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
                        />
                        <span className="text-[13px] text-gray-700">Billing address same as shipping</span>
                      </label>
                    </div>
                  </div>

                {/* Payment */}
                <div className="bg-white border border-gray-200 rounded-xl p-20 shadow-sm">
                  <h2 className="text-[16px] font-bold text-gray-900 mb-16">Payment</h2>
                  <div className="space-y-12">
                    <label className="flex items-center gap-10 p-12 rounded-lg border border-gray-200 cursor-pointer hover:border-brand-600 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="credit_card"
                        checked={paymentMethod === 'credit_card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-16 h-16 text-brand-600 focus:ring-brand-600"
                      />
                      <div>
                        <div className="text-[14px] font-semibold text-gray-900">Credit Card</div>
                        <div className="text-[12px] text-gray-500">Visa, Mastercard, Amex</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-10 p-12 rounded-lg border border-gray-200 cursor-pointer hover:border-brand-600 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="debit_card"
                        checked={paymentMethod === 'debit_card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-16 h-16 text-brand-600 focus:ring-brand-600"
                      />
                      <div>
                        <div className="text-[14px] font-semibold text-gray-900">Debit Card</div>
                        <div className="text-[12px] text-gray-500">Bank debit cards</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-10 p-12 rounded-lg border border-gray-200 cursor-pointer hover:border-brand-600 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-16 h-16 text-brand-600 focus:ring-brand-600"
                      />
                      <div>
                        <div className="text-[14px] font-semibold text-gray-900">UPI</div>
                        <div className="text-[12px] text-gray-500">Pay using UPI apps</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-10 p-12 rounded-lg border border-gray-200 cursor-pointer hover:border-brand-600 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-16 h-16 text-brand-600 focus:ring-brand-600"
                      />
                      <div>
                        <div className="text-[14px] font-semibold text-gray-900">Cash on Delivery</div>
                        <div className="text-[12px] text-gray-500">Pay when your order arrives</div>
                      </div>
                    </label>
                  </div>

                  {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                    <div className="mt-16 p-12 bg-blue-50 border border-blue-200 rounded-lg text-[13px] text-blue-700">
                      💳 Card payment will be processed securely on the next step.
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="bg-white border border-gray-200 rounded-xl p-20 shadow-sm">
                  <h2 className="text-[16px] font-bold text-gray-900 mb-16">Order Notes</h2>
                  <textarea
                    name="notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full min-h-[120px] p-12 rounded-lg border border-gray-300 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-opacity-20 focus:border-brand-600"
                    placeholder="Any special instructions for delivery?"
                  />
                </div>
              </form>
            </div>

              {/* Right: Summary */}
              <div className="md:w-[360px] lg:w-[380px] flex-shrink-0 px-16 md:px-0 md:pr-24 pb-32 md:pb-0">
                <div className="md:sticky md:top-[72px]">
                  <div className="bg-white border border-gray-200 rounded-xl p-20 shadow-sm">
                    <h2 className="text-[16px] font-bold text-gray-900 mb-16">Order Summary</h2>

                    <div className="space-y-12 mb-16">
                      {cart?.items?.map((item: any) => {
                        const imageUrl = getItemImage(item);
                        const price = getItemPrice(item);
                        return (
                          <div key={item.id} className="flex items-center gap-12">
                            <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={item.product?.name || 'Order item'}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-[18px]">
                                  🛍️
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-semibold text-gray-900 truncate">
                                {item.product?.name}
                              </div>
                              <div className="text-[12px] text-gray-500">
                                Qty: {item.quantity}
                              </div>
                            </div>
                            <div className="text-[13px] font-semibold text-gray-900">
                              ${(price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-12 text-[14px] text-gray-700">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Shipping</span>
                        <span className="text-gray-500">Calculated at checkout</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tax</span>
                        <span className="text-gray-500">Calculated at checkout</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 my-16"></div>

                    <div className="flex items-center justify-between text-[15px] font-semibold text-gray-900 mb-16">
                      <span>Total</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>

                  <button
                    type="submit"
                    onClick={handleSubmitOrder}
                    className={`w-full h-40 rounded-lg font-semibold text-[14px] flex items-center justify-center transition-colors ${
                      hasItems && !processing ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!hasItems || processing}
                  >
                    {processing ? 'Processing...' : 'Place Order'}
                  </button>

                    <div className="mt-12 text-[12px] text-gray-500 text-center">
                      By placing your order, you agree to our terms and privacy policy.
                    </div>
                  </div>

                  <div className="mt-16 text-center">
                    <Link href="/cart" className="text-[13px] text-brand-600 hover:text-brand-700 font-medium">
                      ← Back to cart
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Order Failed"
        message={error}
      />
    </ProtectedRoute>
  );
}
