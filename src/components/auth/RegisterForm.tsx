/**
 * Registration Form Component
 * Handles user registration with email and password confirmation
 */

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, User, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { useAuthStore } from '../../stores/authStore';
import type { RegisterRequest } from '../../types';

/**
 * Registration form validation schema factory
 */
const createRegisterSchema = (t: (key: string, options?: Record<string, unknown>) => string) => z.object({
  first_name: z
    .string()
    .min(1, t('validation.firstNameRequired'))
    .max(50, t('validation.firstNameMax', { max: 50 })),
  last_name: z
    .string()
    .min(1, t('validation.lastNameRequired'))
    .max(50, t('validation.lastNameMax', { max: 50 })),
  email: z
    .string()
    .min(1, t('validation.emailRequired'))
    .email(t('validation.emailInvalid')),
  password1: z
    .string()
    .min(1, t('validation.passwordRequired'))
    .min(8, t('validation.passwordMin', { min: 8 }))
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      t('validation.passwordStrength')
    ),
  password2: z
    .string()
    .min(1, t('validation.passwordConfirmRequired')),
}).refine((data) => data.password1 === data.password2, {
  message: t('validation.passwordMismatch'),
  path: ["password2"],
});

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

/**
 * Registration form component
 * Provides user registration with email and password confirmation
 */
export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const { register: registerUser, isLoading, error, successMessage, clearError, clearSuccess } = useAuthStore();

  // Create schema with translations - memoized to avoid re-creating on every render
  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);
  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError();
      clearSuccess();
      const result = await registerUser(data as RegisterRequest);
      if (result.requiresVerification) {
        setRegistrationComplete(true);
      }
    } catch (error) {
      // Error is handled by the store
      console.error('Registration failed:', error);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Toggle confirm password visibility
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Show success message after registration
  if (registrationComplete && successMessage) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="card text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('register.checkEmail.title')}
          </h1>
          <p className="text-gray-600 mb-6">
            {successMessage}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>{t('register.checkEmail.tip')}</strong> {t('register.checkEmail.tipText')}
            </p>
          </div>
          {onSwitchToLogin && (
            <Button onClick={onSwitchToLogin} className="w-full">
              {t('register.checkEmail.goToLogin')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('register.title')}
          </h1>
          <p className="text-gray-600">
            {t('register.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label={t('register.firstName')}
              type="text"
              placeholder={t('register.firstNamePlaceholder')}
              leftIcon={<User />}
              error={errors.first_name?.message}
              {...register('first_name')}
            />
            <InputField
              label={t('register.lastName')}
              type="text"
              placeholder={t('register.lastNamePlaceholder')}
              leftIcon={<User />}
              error={errors.last_name?.message}
              {...register('last_name')}
            />
          </div>

          <InputField
            label={t('register.email')}
            type="email"
            placeholder={t('register.emailPlaceholder')}
            leftIcon={<Mail />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="relative">
            <InputField
              label={t('register.password')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('register.passwordPlaceholder')}
              leftIcon={<Lock />}
              error={errors.password1?.message}
              {...register('password1')}
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

          <div className="relative">
            <InputField
              label={t('register.confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t('register.confirmPasswordPlaceholder')}
              leftIcon={<Lock />}
              error={errors.password2?.message}
              {...register('password2')}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showConfirmPassword ? t('login.hidePassword') : t('login.showPassword')}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>At least 8 characters long</li>
              <li>Contains uppercase and lowercase letters</li>
              <li>Contains at least one number</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? t('register.signingUp') : t('register.signUp')}
          </Button>
        </form>

        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('register.hasAccount')}{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
              >
                {t('register.signInHere')}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
