/**
 * Button Component
 * Reusable button with multiple variants, sizes, and loading state
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '../../utils';

/**
 * Props for the Button component
 * Extends standard HTML button attributes
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant
   * - 'primary': Solid background, primary color (default)
   * - 'secondary': Light background, muted color
   * - 'outline': Bordered, transparent background
   * - 'ghost': No border/background, text only
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size: 'sm', 'md' (default), 'lg' */
  size?: 'sm' | 'md' | 'lg';
  /** Shows loading spinner and disables button when true */
  isLoading?: boolean;
  /** Button content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Button component with multiple variants, sizes, and loading state
 * Automatically disabled when isLoading is true
 * 
 * @example
 * ```tsx
 * <Button variant="primary" isLoading={submitting}>
 *   Submit
 * </Button>
 * ```
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-700 focus:ring-secondary-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      {children}
    </button>
  );
}
