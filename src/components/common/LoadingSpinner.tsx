/**
 * Loading Spinner Component
 * Animated loading indicator with configurable sizes
 */

import { cn } from '../../utils';

/**
 * Props for the LoadingSpinner component
 */
interface LoadingSpinnerProps {
  /** Size of the spinner: 'sm' (16px), 'md' (24px), 'lg' (32px) */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animated loading spinner component
 * Includes proper accessibility attributes (role="status", aria-label)
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="lg" />
 * ```
 */
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-primary-600',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
