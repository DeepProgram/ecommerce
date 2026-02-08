import api from '@/lib/api';

export interface Address {
  id: number;
  address_type: 'shipping' | 'billing';
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface AddressFormData {
  address_type: 'shipping' | 'billing';
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export const addressService = {
  async getAddresses() {
    const response = await api.get('/api/users/addresses/');
    return response.data;
  },

  async createAddress(data: AddressFormData) {
    const response = await api.post('/api/users/addresses/', data);
    return response.data;
  },

  async updateAddress(id: number, data: Partial<AddressFormData>) {
    const response = await api.patch(`/api/users/addresses/${id}/`, data);
    return response.data;
  },

  async deleteAddress(id: number) {
    await api.delete(`/api/users/addresses/${id}/`);
  },
};
