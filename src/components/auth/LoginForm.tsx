/**
 * Login Form Component
 * Handles user authentication with email and password
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { useAuthStore } from '../../stores/authStore';
import type { LoginRequest } from '../../types';

/**
 * Login form validation schema
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

/**
 * Login form component
 * Provides email/password authentication with validation
 */
export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const { 
    login, 
    resendVerificationEmail, 
    isLoading, 
    error, 
    successMessage, 
    clearError, 
    clearSuccess 
  } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      clearSuccess();
      await login(data as LoginRequest);
      // Navigation will be handled by the auth guard/router
    } catch (error) {
      // Error is handled by the store
      console.error('Login failed:', error);
      // Pre-fill email for resend form
      setResendEmail(data.email);
    }
  };

  /**
   * Handle resend verification email
   */
  const handleResendVerification = async () => {
    const email = resendEmail || getValues('email');
    if (!email) return;
    
    try {
      clearError();
      await resendVerificationEmail(email);
      setShowResendForm(false);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Check if error is about email verification
   */
  const isVerificationError = error?.toLowerCase().includes('verify');

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to continue tracking your meals
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
            {isVerificationError && (
              <button
                type="button"
                onClick={() => setShowResendForm(true)}
                className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Resend verification email
              </button>
            )}
          </div>
        )}

        {/* Resend Verification Form */}
        {showResendForm && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-3">
              Enter your email to receive a new verification link:
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleResendVerification}
                isLoading={isLoading}
                disabled={!resendEmail || isLoading}
              >
                Send
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setShowResendForm(false)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-500"
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            leftIcon={<Mail />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="relative">
            <InputField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              leftIcon={<Lock />}
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
              >
                Sign up here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
