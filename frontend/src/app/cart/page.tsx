'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cartService, Cart } from '@/services/cartService';
import { CartItemSkeleton } from '@/components/Skeletons';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [error, setError] = useState('');

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

  const subtotal = useMemo(() => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce((sum: number, item: any) => {
      return sum + getItemPrice(item) * item.quantity;
    }, 0);
  }, [cart]);

  const handleQtyChange = async (itemId: number, nextQty: number) => {
    if (nextQty < 1) return;
    setUpdatingItemId(itemId);
    
    // Optimistically update the UI
    if (cart?.items) {
      const updatedItems = cart.items.map((item: any) =>
        item.id === itemId ? { ...item, quantity: nextQty } : item
      );
      setCart({ ...cart, items: updatedItems });
    }
    
    try {
      await cartService.updateCartItem(itemId, nextQty);
      // Refresh cart data in background without showing loading state
      const freshCart = await cartService.getCart();
      setCart(freshCart);
    } catch (err) {
      console.error('Error updating cart item:', err);
      setError('Failed to update item quantity.');
      // Reload to restore correct state on error
      await loadCart();
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setRemovingItemId(itemId);
    
    // Optimistically remove from UI
    if (cart?.items) {
      const updatedItems = cart.items.filter((item: any) => item.id !== itemId);
      setCart({ ...cart, items: updatedItems });
    }
    
    try {
      await cartService.removeCartItem(itemId);
      // Refresh cart data in background without showing loading state
      const freshCart = await cartService.getCart();
      setCart(freshCart);
    } catch (err) {
      console.error('Error removing cart item:', err);
      setError('Failed to remove item.');
      // Reload to restore correct state on error
      await loadCart();
    } finally {
      setRemovingItemId(null);
    }
  };

  const getItemImage = (item: any) => {
    const primary = item?.product?.primary_image;
    const fromPrimary = primary?.image || primary;
    const fromGallery = item?.product?.images?.[0]?.image;
    const imagePath = fromPrimary || fromGallery;
    if (!imagePath) return null;
    return imagePath.startsWith('http') ? imagePath : `http://localhost${imagePath}`;
  };

  const hasItems = cart?.items && cart.items.length > 0;

  return (
    <main className="bg-white md:bg-gray-50 md:min-h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-16 md:px-24 py-12">
          <div className="flex items-center gap-8 text-[13px] text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">Cart</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto">
        <div className="px-16 md:px-24 pt-20 pb-16 md:py-24">
          <h1 className="text-[22px] leading-[28px] md:text-[28px] md:leading-[36px] font-bold text-gray-900">
            Your Cart
          </h1>
          <p className="text-[13px] md:text-[14px] text-gray-500 mt-6">
            {loading ? 'Loading your cart...' : hasItems ? `${cart?.items.length} items` : 'Your cart is empty'}
          </p>
          {error && (
            <div className="mt-12 text-[13px] text-danger">{error}</div>
          )}
        </div>

        <div className="md:flex md:gap-24 lg:gap-32">
          {/* Items */}
          <div className="flex-1 px-16 md:px-24 md:pr-0 pb-24 md:pb-32 min-w-0">
            {loading ? (
              <div className="space-y-18">
                {Array.from({ length: 2 }).map((_, i) => (
                  <CartItemSkeleton key={i} />
                ))}
              </div>
            ) : hasItems ? (
              <div className="space-y-16">
                {cart?.items.map((item: any) => {
                  const imageUrl = getItemImage(item);
                  const price = getItemPrice(item);
                  const isUpdating = updatingItemId === item.id;
                  const isRemoving = removingItemId === item.id;

                  return (
                    <div key={item.id} className="flex gap-16 p-16 border-b border-gray-200 bg-white md:rounded-xl md:border md:border-gray-200 md:shadow-sm">
                      <div className="w-48 h-48 md:w-56 md:h-56 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.product?.name || 'Cart item'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[32px]">
                            🛍️
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-12">
                          <div>
                            <h3 className="text-[15px] md:text-[16px] font-semibold text-gray-900 mb-6">
                              {item.product?.name}
                            </h3>
                            {item.variant?.attribute_values?.length > 0 && (
                              <p className="text-[12px] text-gray-500 mb-8">
                                {item.variant.attribute_values
                                  .map((attr: any) => `${attr.attribute_name}: ${attr.value}`)
                                  .join(' • ')}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-[15px] font-semibold text-gray-900">
                              ${price.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-12 flex items-center justify-between gap-12">
                          <div className="flex items-center gap-8">
                            <button
                              onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isUpdating}
                              className="w-32 h-32 border border-gray-300 rounded flex items-center justify-center text-[18px] hover:border-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="w-32 text-center text-[14px] font-semibold text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                              disabled={isUpdating}
                              className="w-32 h-32 border border-gray-300 rounded flex items-center justify-center text-[18px] hover:border-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isRemoving}
                            className="text-[12px] text-gray-500 hover:text-danger transition-colors disabled:opacity-50"
                          >
                            {isRemoving ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[300px] md:min-h-[400px] bg-white md:rounded-xl md:border md:border-gray-200 pt-16 pb-16">
                <div className="text-center px-24">
                  <div className="w-64 h-64 mx-auto mb-16 bg-gray-100 rounded-full flex items-center justify-center text-[40px]">
                    🛒
                  </div>
                  <h3 className="text-[18px] font-bold text-gray-900 mb-8">Your cart is empty</h3>
                  <p className="text-[13px] text-gray-500 mb-20">
                    Looks like you haven&apos;t added anything yet.
                  </p>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center px-24 h-40 bg-brand-600 text-white rounded-lg font-semibold text-[14px] leading-none hover:bg-brand-700 transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="md:w-[360px] lg:w-[380px] flex-shrink-0 px-16 md:px-0 md:pr-24 pb-32">
            <div className="bg-white border border-gray-200 rounded-xl p-20 shadow-sm sticky top-[96px]">
              <h2 className="text-[16px] font-bold text-gray-900 mb-16">Order Summary</h2>

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

              <Link
                href="/checkout"
                className={`w-full h-40 rounded-lg font-semibold text-[14px] flex items-center justify-center transition-colors ${
                  hasItems ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                aria-disabled={!hasItems}
              >
                Proceed to Checkout
              </Link>

              <div className="mt-12 text-[12px] text-gray-500 text-center">
                Have a coupon? <span className="text-brand-600">Add it at checkout</span>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Link href="/products" className="text-[13px] text-brand-600 hover:text-brand-700 font-medium">
                Continue shopping →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
