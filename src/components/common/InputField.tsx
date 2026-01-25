/**
 * Input Field Component
 * Reusable input field with validation states, labels, and icon support
 */

import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils';

/**
 * Props for the InputField component
 * Extends standard HTML input attributes
 */
interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Error message displayed below the input (triggers error styling) */
  error?: string;
  /** Helper text displayed below the input when no error */
  helperText?: string;
  /** Icon element displayed on the left side of the input */
  leftIcon?: ReactNode;
  /** Icon element displayed on the right side of the input */
  rightIcon?: ReactNode;
  /** Additional CSS classes for the input element */
  className?: string;
}

/**
 * Input field component with label, validation states, and icon support
 * 
 * @example
 * ```tsx
 * <InputField
 *   label="Email"
 *   type="email"
 *   error={errors.email?.message}
 *   leftIcon={<MailIcon />}
 * />
 * ```
 */
export function InputField({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}: InputFieldProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">{leftIcon}</div>
          </div>
        )}
        
        <input
          id={inputId}
          className={cn(
            'w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            hasError
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-primary-500 focus:border-transparent',
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">{rightIcon}</div>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="mt-1">
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {!error && helperText && (
            <p className="text-sm text-gray-500">
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
