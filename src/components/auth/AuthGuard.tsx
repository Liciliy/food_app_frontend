/**
 * Auth Guard Component
 * Protects routes that require authentication
 */

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Authentication guard component
 * Ensures user is authenticated before rendering protected content
 * Automatically initializes authentication on app startup
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        {fallback || (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Please sign in to continue
            </h1>
            <p className="text-gray-600">
              You need to be authenticated to access this page.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Render protected content if authenticated
  return <>{children}</>;
}
