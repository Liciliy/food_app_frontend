/**
 * Email Verification Page
 * Handles email verification when user clicks the link from verification email
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/common/Button';

/**
 * Email verification page component
 * Extracts key from URL and calls verification API
 */
export function VerifyEmailPage() {
  const { t } = useTranslation('auth');
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const { verifyEmail, isLoading, error, successMessage, clearError, clearSuccess } = useAuthStore();
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  // Clear messages on mount
  useEffect(() => {
    clearError();
    clearSuccess();
  }, [clearError, clearSuccess]);

  // Attempt verification when component mounts with a key
  useEffect(() => {
    if (key && !verificationAttempted) {
      setVerificationAttempted(true);
      verifyEmail(key).catch(() => {
        // Error is handled by the store
      });
    }
  }, [key, verifyEmail, verificationAttempted]);

  // Handle navigation to login
  const handleGoToLogin = () => {
    clearSuccess();
    clearError();
    navigate('/auth');
  };

  // No key provided
  if (!key) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('verification.invalidLink')}
            </h1>
            <p className="text-gray-600 mb-6">
              {t('verification.invalidLinkMessage')}
            </p>
            <Link to="/auth">
              <Button className="w-full">{t('verification.goToLogin')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('verification.verifyingTitle')}
            </h1>
            <p className="text-gray-600">
              {t('verification.verifyingMessage')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (successMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('verification.success')}
            </h1>
            <p className="text-gray-600 mb-6">
              {successMessage}
            </p>
            <Button onClick={handleGoToLogin} className="w-full">
              {t('verification.continueToLogin')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('verification.error')}
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <Link to="/auth">
                <Button className="w-full">{t('verification.goToLogin')}</Button>
              </Link>
              <p className="text-sm text-gray-500">
                {t('verification.needNewLink')}{' '}
                <Link to="/auth" className="text-primary-600 hover:text-primary-500">
                  {t('verification.signInAndRequest')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default/initial state (should rarely be seen)
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Processing...
          </h1>
        </div>
      </div>
    </div>
  );
}