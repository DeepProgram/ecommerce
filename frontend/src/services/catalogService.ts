import api from '@/lib/api';

export interface Product {
  id: number;
  name: string;
  slug: string;
  base_price: string;
  brand: {
    id: number;
    name: string;
    slug: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
  primary_image?: {
    id: number;
    image: string;
    alt_text: string;
  };
  has_variants: boolean;
}

export interface ProductDetail extends Product {
  description: string;
  images: Array<{
    id: number;
    image: string;
    alt_text: string;
  }>;
  variants: Array<{
    id: number;
    sku: string;
    price: string;
    effective_price: string;
    stock_quantity: number;
    attribute_values: Array<{
      attribute_name: string;
      attribute_slug: string;
      value: string;
    }>;
  }>;
  attribute_values: Array<{
    attribute_name: string;
    attribute_slug: string;
    value: string;
  }>;
  average_rating?: number;
  review_count: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent?: number;
  description: string;
}

export const catalogService = {
  async getCategories() {
    const response = await api.get('/api/catalog/categories/');
    return response.data;
  },

  async getCategory(slug: string) {
    const response = await api.get(`/api/catalog/categories/${slug}/`);
    return response.data;
  },

  async getProducts(params?: any) {
    const response = await api.get('/api/catalog/products/', { params });
    return response.data;
  },

  async getProduct(slug: string) {
    const response = await api.get(`/api/catalog/products/${slug}/`);
    return response.data;
  },

  async searchProducts(query: string, params?: any) {
    const response = await api.get('/api/catalog/search/', { 
      params: { q: query, ...params } 
    });
    return response.data;
  },
};
