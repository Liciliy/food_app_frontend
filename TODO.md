# Food Tracker Frontend - TODO List

## ✅ Completed
- [x] Project setup with Vite + React + TypeScript
- [x] Tailwind CSS configuration
- [x] Authentication store with Zustand
- [x] Login form with validation
- [x] Registration form with validation (email, first_name, last_name, passwords)
- [x] Protected routes with AuthGuard
- [x] Basic dashboard page
- [x] Makefile for common commands

## 🔧 Critical Fixes (In Progress)
- [x] Email verification flow (`/verify-email/:key` route)
- [x] Fix login response type (`token` instead of `key`)
- [x] Fix User type to include `pk`, `first_name`, `last_name`
- [x] Fix profile endpoint URL (`/auth/profile/` instead of `/auth/user/`)
- [x] Add "Resend verification email" functionality

## 📋 Important - Better UX (Next Priority)
- [ ] Update profile functionality (`PUT/PATCH /auth/profile/update/`)
- [ ] Profile page to display user info
- [ ] Better error messages for unverified email on login
- [ ] Loading states and skeleton screens
- [ ] Toast notifications for success/error feedback

## 🎤 Voice Recording & Meal Features (Main Feature)
- [x] Voice recording component (max 5 minutes)
- [ ] Audio upload to `/meals/voice/` endpoint
- [ ] Meal type selector (breakfast, lunch, dinner, snack)
- [ ] Display AI-analyzed meal data
- [ ] Meal list view with filtering
- [ ] Meal detail view
- [ ] Reduce max recording time to 1 minute
- [ ] Change recording behavior: if pressed, record until pressed again. If released, try to stop recording after N seconds of silence
- [ ] Send recording to backend immediately after recording ends (no additional button click needed)
- [ ] Auto-trim silent seconds at the end of recording
- [ ] Allow user to dismiss/delete processed record within 15 minutes (requires backend changes) - prevent deletion after 15 min
- [ ] Allow user to edit record for first 5 minutes after processing

## 📊 Statistics & Analytics
- [ ] Dashboard overview (today, this week, this month)
- [ ] Daily statistics page
- [ ] Weekly statistics with daily breakdown
- [ ] Monthly statistics with trends
- [ ] Line charts for calorie trends
- [ ] Pie charts for macro breakdown
- [ ] Custom date range filtering
- [ ] Add chart/map of when I ate today
- [ ] Add chart/heat map of what I ate for some period
- [ ] Add pie chart per day with each piece being a specific food and piece size representing calories consumed with that item
- [ ] Create similar pie charts for fat, protein, and carbs breakdown per food item

## 🔐 Security Features (Nice to Have)
- [ ] Session management page (`GET /auth/tokens/`)
- [ ] Revoke specific sessions (`DELETE /auth/tokens/{id}/`)
- [ ] Logout from all devices (`POST /auth/logout-all/`)
- [ ] MFA/TOTP setup and management
- [ ] Password change functionality

## 🎨 UI/UX Improvements (Nice to Have)
- [ ] Dark mode support
- [ ] PWA preparation (manifest, service worker)
- [ ] Offline support basics
- [ ] Push notification preparation
- [ ] Mobile-optimized navigation
- [ ] Animations and transitions

## 🧪 Testing & Quality
- [ ] Unit tests for components
- [ ] Integration tests for auth flow
- [ ] E2E tests with Playwright/Cypress
- [ ] Error boundary components
- [ ] Comprehensive error handling

## 📦 Deployment
- [ ] Environment configuration (.env files)
- [ ] Production build optimization
- [ ] Docker setup (optional)
- [ ] CI/CD pipeline (optional)
