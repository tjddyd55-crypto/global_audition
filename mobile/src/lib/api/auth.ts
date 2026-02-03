import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await apiClient.post('/api/v1/auth/login', { email, password });
    return data;
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem('auth_token', token);
  },

  async clearToken(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
  },
};
