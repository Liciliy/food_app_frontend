/**
 * Authentication Service
 * Handles user authentication, registration, and profile management
 */

import { apiClient } from './api';
import type { 
  User, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  ResendVerificationRequest
} from '../types';

/**
 * Authentication service class
 * Provides methods for all authentication-related API operations
 */
export class AuthService {
  /**
   * User login
   * @param credentials - Email and password
   * @returns Promise with user data and authentication token
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login/', credentials);
    return response.data;
  }

  /**
   * User registration
   * Note: Token is NOT returned until email is verified
   * @param userData - Email, names, and password confirmation
   * @returns Promise with registration confirmation
   */
  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/registration/', userData);
    return response.data;
  }

  /**
   * Verify email with key from verification email
   * @param data - Verification key from email link
   * @returns Promise that resolves when email is verified
   */
  static async verifyEmail(data: VerifyEmailRequest): Promise<{ detail: string }> {
    const response = await apiClient.post<{ detail: string }>('/auth/registration/verify-email/', data);
    return response.data;
  }

  /**
   * Resend verification email
   * @param data - Email address to resend verification to
   * @returns Promise that resolves when email is sent
   */
  static async resendVerificationEmail(data: ResendVerificationRequest): Promise<{ detail: string }> {
    const response = await apiClient.post<{ detail: string }>('/auth/registration/resend-email/', data);
    return response.data;
  }

  /**
   * User logout
   * Invalidates the current session token on the server
   * @returns Promise that resolves when logout is complete
   */
  static async logout(): Promise<void> {
    await apiClient.post('/auth/logout/');
  }

  /**
   * Get current user profile
   * @returns Promise with current user information
   */
  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile/');
    return response.data;
  }

  /**
   * Validate if current token is still valid
   * @returns Promise that resolves if token is valid, rejects otherwise
   */
  static async validateToken(): Promise<User> {
    return this.getCurrentUser();
  }
}
