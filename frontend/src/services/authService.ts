import api from '@/lib/api';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_staff: boolean;
}

export const authService = {
  async register(data: RegisterData) {
    const response = await api.post('/api/users/register/', data);
    return response.data;
  },

  async login(data: LoginData) {
    const response = await api.post('/api/users/login/', data);
    return response.data;
  },

  async logout(refreshToken: string) {
    const response = await api.post('/api/users/logout/', { refresh: refreshToken });
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/api/users/profile/');
    return response.data;
  },

  async updateProfile(data: Partial<User>) {
    const response = await api.patch('/api/users/profile/', data);
    return response.data;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const response = await api.post('/api/users/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword,
    });
    return response.data;
  },

  async refreshToken(refreshToken: string) {
    const response = await api.post('/api/users/token/refresh/', { refresh: refreshToken });
    return response.data;
  },
};
