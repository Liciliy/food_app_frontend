/**
 * Application Entry Point
 * Renders the main App component with React 18 concurrent features
 */

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize i18n (must be imported before App)
import './i18n';

// Ensure root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Create React root and render app
createRoot(rootElement).render(
  <StrictMode>
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <App />
    </Suspense>
  </StrictMode>
);
