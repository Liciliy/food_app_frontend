/**
 * API Configuration and Base Setup
 * 
 * This module configures the Axios HTTP client with:
 * - Base URL from environment variables
 * - Automatic authentication token injection
 * - Consistent error handling and formatting
 * - Request/response interceptors
 * 
 * @module services/api
 */

import axios, { type AxiosResponse, type AxiosError } from 'axios';
import type { ApiError } from '../types';

/**
 * Base URL for the Food Tracking API
 * Configured via VITE_API_BASE_URL environment variable
 * Defaults to localhost:8000/api for development
 * 
 * @example
 * // In .env file:
 * // VITE_API_BASE_URL=https://api.yourfoodtracker.com/api
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Configured Axios instance for API calls
 * 
 * Features:
 * - Automatic token injection via request interceptor
 * - Global 401 handling (redirects to login)
 * - Consistent error formatting
 * - 30 second timeout for standard requests
 * 
 * @example
 * ```ts
 * const response = await apiClient.get('/food/meals/');
 * ```
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
