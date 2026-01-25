/**
 * Authentication Page
 * Combined login and registration page with tab switching
 */

import { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

type AuthMode = 'login' | 'register';

/**
 * Authentication page component
 * Provides both login and registration functionality with tab switching
 */
export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                mode === 'login'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                mode === 'register'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form Content */}
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        )}

        {/* App Info */}
        <div className="mt-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            🍽️ Food Tracking App
          </h2>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            Track your meals with AI-powered voice recognition. 
            Simply speak what you ate and let our AI analyze the nutritional content.
          </p>
        </div>

        {/* Features */}
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Features:</h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Voice-powered meal logging
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              AI nutritional analysis
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Comprehensive statistics
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Daily, weekly & monthly insights
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
