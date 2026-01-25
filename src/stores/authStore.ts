/**
 * Authentication Store
 * Global state management for user authentication using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthService } from '../services/authService';
import { storeToken, removeToken, getStoredToken } from '../services/api';
import type { 
  AuthState, 
  LoginRequest, 
  RegisterRequest, 
  ApiError 
} from '../types';

/**
 * Authentication store actions
 */
interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<{ requiresVerification: boolean; message: string }>;
  verifyEmail: (key: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
  initializeAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

/**
 * Extended auth state with success message
 */
interface ExtendedAuthState extends AuthState {
  successMessage: string | null;
}

/**
 * Complete authentication store interface
 */
type AuthStore = ExtendedAuthState & AuthActions;

/**
 * Authentication store implementation
 * Manages user authentication state and provides actions for auth operations
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ===== INITIAL STATE =====
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      successMessage: null,

      // ===== ACTIONS =====

      /**
       * User login action
       * Authenticates user and stores token
       */
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null, successMessage: null });

        try {
          const response = await AuthService.login(credentials);
          
          // Store token in localStorage (API returns 'token' not 'key')
          storeToken(response.token);
          
          // Update store state
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const apiError = error as ApiError;
          let errorMessage = 'Login failed. Please check your credentials.';
          
          // Check if it's an email verification error
          if (apiError.detail?.toLowerCase().includes('verified') || 
              apiError.detail?.toLowerCase().includes('verification')) {
            errorMessage = 'Please verify your email address before logging in. Check your inbox for the verification link.';
          } else if (apiError.detail) {
            errorMessage = apiError.detail;
          }
          
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
          });
          throw error;
        }
      },

      /**
       * User registration action
       * Creates new user account (requires email verification before login)
       */
      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null, successMessage: null });

        try {
          await AuthService.register(userData);
          
          // Registration successful - user needs to verify email
          const message = 'Registration successful! Please check your email to verify your account before logging in.';
          
          set({
            isLoading: false,
            error: null,
            successMessage: message,
          });
          
          return { requiresVerification: true, message };
        } catch (error) {
          const apiError = error as ApiError;
          let errorMessage = 'Registration failed. Please try again.';
          
          // Handle specific validation errors
          if (apiError.errors) {
            const errors = Object.values(apiError.errors).flat();
            errorMessage = errors.join(' ');
          } else if (apiError.non_field_errors) {
            errorMessage = apiError.non_field_errors.join(' ');
          } else if (apiError.detail) {
            errorMessage = apiError.detail;
          }

          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      /**
       * Verify email with key from verification link
       */
      verifyEmail: async (key: string) => {
        set({ isLoading: true, error: null, successMessage: null });

        try {
          await AuthService.verifyEmail({ key });
          
          set({
            isLoading: false,
            successMessage: 'Email verified successfully! You can now log in.',
            error: null,
          });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.detail || 'Email verification failed. The link may be invalid or expired.',
          });
          throw error;
        }
      },

      /**
       * Resend verification email
       */
      resendVerificationEmail: async (email: string) => {
        set({ isLoading: true, error: null, successMessage: null });

        try {
          await AuthService.resendVerificationEmail({ email });
          
          set({
            isLoading: false,
            successMessage: 'Verification email sent! Please check your inbox.',
            error: null,
          });
        } catch (error) {
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.detail || 'Failed to resend verification email.',
          });
          throw error;
        }
      },

      /**
       * User logout action
       * Clears authentication state and invalidates token
       */
      logout: async () => {
        set({ isLoading: true });

        try {
          // Attempt to logout on server (invalidate token)
          await AuthService.logout();
        } catch (error) {
          // Continue with logout even if server request fails
          console.warn('Server logout failed, continuing with local logout', error);
        } finally {
          // Always clear local state
          removeToken();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            successMessage: null,
          });
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Clear success message
       */
      clearSuccess: () => {
        set({ successMessage: null });
      },

      /**
       * Set loading state
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * Initialize authentication on app startup
       * Validates existing token and loads user data
       */
      initializeAuth: async () => {
        const token = getStoredToken();
        
        if (!token) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true, token });

        try {
          // Validate token and get user data
          const user = await AuthService.validateToken();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          // Token is invalid, clear auth state
          removeToken();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
    }),
    {
      name: 'food-app-auth', // Storage key name
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
