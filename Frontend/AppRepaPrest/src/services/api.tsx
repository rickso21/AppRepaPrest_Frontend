import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import * as SecureStore from 'expo-secure-store';

export const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token Refresh');
      }
    } catch (error) {
      console.warn('No se pudo obtener token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('tokenExpiry');
      console.log('Sesión expirada');
    }
    return Promise.reject(error);
  }
);