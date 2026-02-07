import api from '@/lib/api';

export interface CartItem {
  id: number;
  product: any;
  variant?: any;
  quantity: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: string;
}

export const cartService = {
  async getCart() {
    const response = await api.get('/api/orders/cart/');
    return response.data;
  },

  async addToCart(productId: number, variantId?: number, quantity: number = 1) {
    const response = await api.post('/api/orders/cart/items/', {
      product_id: productId,
      variant_id: variantId,
      quantity,
    });
    return response.data;
  },

  async updateCartItem(itemId: number, quantity: number) {
    const response = await api.patch(`/api/orders/cart/items/${itemId}/`, { quantity });
    return response.data;
  },

  async removeCartItem(itemId: number) {
    await api.delete(`/api/orders/cart/items/${itemId}/`);
  },
};

export const orderService = {
  async createOrder(shippingAddressId: number, billingAddressId: number, paymentMethod: string) {
    const response = await api.post('/api/orders/orders/create/', {
      shipping_address_id: shippingAddressId,
      billing_address_id: billingAddressId,
      payment_method: paymentMethod,
    });
    return response.data;
  },

  async getOrders() {
    const response = await api.get('/api/orders/orders/');
    return response.data;
  },

  async getOrder(orderNumber: string) {
    const response = await api.get(`/api/orders/orders/${orderNumber}/`);
    return response.data;
  },
};
