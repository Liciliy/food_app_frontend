/**
 * Main Application Component
 * Sets up routing and authentication flow
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/auth/AuthGuard';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { useAuthStore } from './stores/authStore';

/**
 * Main application component
 * Handles routing between authenticated and non-authenticated sections
 */
function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public route - Authentication */}
          <Route 
            path="/auth" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />
            } 
          />

          {/* Public route - Email Verification */}
          <Route 
            path="/verify-email/:key" 
            element={<VerifyEmailPage />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <AuthGuard fallback={<AuthPage />}>
                <DashboardPage />
              </AuthGuard>
            } 
          />

          {/* Statistics page */}
          <Route 
            path="/statistics" 
            element={
              <AuthGuard fallback={<AuthPage />}>
                <StatisticsPage />
              </AuthGuard>
            } 
          />
          
          {/* Root redirect */}
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />
            } 
          />
          
          {/* Catch-all redirect */}
          <Route 
            path="*" 
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
