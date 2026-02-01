/**
 * Login Form Component
 * Handles user authentication with email and password
 */

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { useAuthStore } from '../../stores/authStore';
import type { LoginRequest } from '../../types';

/**
 * Login form validation schema factory
 */
const createLoginSchema = (t: (key: string, options?: Record<string, unknown>) => string) => z.object({
  email: z
    .string()
    .min(1, t('validation.emailRequired'))
    .email(t('validation.emailInvalid')),
  password: z
    .string()
    .min(1, t('validation.passwordRequired'))
    .min(6, t('validation.passwordMin', { min: 6 })),
});

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

/**
 * Login form component
 * Provides email/password authentication with validation
 */
export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation('auth');
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

  // Create schema with translations - memoized to avoid re-creating on every render
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);
  type LoginFormData = z.infer<typeof loginSchema>;

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
            {t('login.title')}
          </h1>
          <p className="text-gray-600">
            {t('login.subtitle')}
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
                {t('verification.resend')}
              </button>
            )}
          </div>
        )}

        {/* Resend Verification Form */}
        {showResendForm && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-3">
              {t('verification.resendPrompt')}
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
            label={t('login.email')}
            type="email"
            placeholder={t('login.emailPlaceholder')}
            leftIcon={<Mail />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="relative">
            <InputField
              label={t('login.password')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('login.passwordPlaceholder')}
              leftIcon={<Lock />}
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
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
            {isLoading ? t('login.signingIn') : t('login.signIn')}
          </Button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('login.noAccount')}{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
              >
                {t('login.signUpHere')}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
