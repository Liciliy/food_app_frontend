/**
 * API Configuration and Base Setup
 * Configures Axios instance with base URL, interceptors, and error handling
 */

import axios, { type AxiosResponse, type AxiosError } from 'axios';
import type { ApiError } from '../types';

/**
 * Base URL for the Food Tracking API
 * Change this to match your backend server URL
 */
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Configured Axios instance for API calls
 * Includes automatic token injection and response/error interceptors
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Storage key for authentication token
 */
const TOKEN_STORAGE_KEY = 'food_app_auth_token';

/**
 * Get authentication token from localStorage
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Store authentication token in localStorage
 */
export const storeToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

/**
 * Remove authentication token from localStorage
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

/**
 * Request interceptor to automatically add authentication token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor for consistent error handling
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle authentication errors globally
    if (error.response?.status === 401) {
      // Token is invalid or expired
      removeToken();
      // Redirect to login page (will be handled by routing logic)
      window.location.href = '/login';
    }

    // Format error for consistent handling
    const apiError: ApiError = {
      detail: 'An unexpected error occurred',
      message: 'Please try again later',
    };

    if (error.response?.data) {
      const errorData = error.response.data as any;
      apiError.detail = errorData.detail || errorData.message || apiError.detail;
      apiError.errors = errorData.errors;
      apiError.non_field_errors = errorData.non_field_errors;
    } else if (error.message) {
      apiError.detail = error.message;
    }

    return Promise.reject(apiError);
  }
);

/**
 * Helper function to handle multipart form data uploads
 */
export const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });
  
  return formData;
};
