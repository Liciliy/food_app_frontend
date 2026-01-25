# Food Tracking App - Frontend Development Guide

## Project Overview

This document describes the requirements and API endpoints for developing a frontend application for a comprehensive food tracking system. The backend is a Django REST API that provides voice-based food logging with AI-powered analysis and comprehensive statistics.

## Frontend Application Requirements

### Core Functionality
The frontend should be a modern, responsive web application that allows users to:

1. **User Authentication**
   - User registration with email
   - Login/logout functionality
   - Secure token-based authentication
   - Profile management

2. **Voice-Based Food Logging**
   - Record voice descriptions of meals
   - Upload audio files for analysis
   - View AI-analyzed meal data with nutritional information
   - Display standardized food items with English names

3. **Comprehensive Statistics & Analytics**
   - Dashboard with quick overview (today, this week, this month)
   - Daily statistics with detailed breakdown
   - Weekly statistics with daily comparisons
   - Monthly statistics with trends
   - Custom date range filtering
   - Charts and visualizations for calorie intake and nutritional data

4. **Meal Management**
   - View list of all recorded meals
   - Filter meals by various time periods
   - View detailed meal information
   - Browse meal history

### User Experience Requirements
- **Mobile-First Design**: Optimized for smartphone usage
- **Intuitive Voice Recording**: Large, accessible record button
- **Visual Analytics**: Charts showing calorie trends, macro breakdowns
- **Quick Access**: Dashboard with today's summary
- **Historical Data**: Easy browsing of past meals and statistics

## API Base URL and Authentication

**Base URL**: `http://localhost:8000/api/`

**Authentication**: Token-based authentication using Knox tokens
- Include in all authenticated requests: `Authorization: Token <your_token_here>`
- Tokens are obtained via login endpoint

## Backend Configuration for Frontend

The backend must be configured to redirect email verification links to the frontend:

**Environment Variable**:
```bash
FRONTEND_URL=http://localhost:5173  # Default value
```

This URL is used in verification emails. In production, set this to your actual frontend URL (e.g., `https://app.yourfoodtracker.com`).

## API Endpoints Reference

### 1. Authentication Endpoints

#### User Registration
- **Endpoint**: `POST /auth/registration/`
- **Purpose**: Create new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password1": "securepassword123",
    "password2": "securepassword123",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```
- **Response (201 Created)**: User details (token is NOT returned until email is verified)
- **Frontend Usage**: Registration form
- **Note**: After registration, a verification email is sent to the user

#### Email Verification Flow

After registration, the backend sends a verification email containing a link to the **frontend application**:

```
http://localhost:3000/verify-email/{verification_key}
```

The frontend URL is configured via the `FRONTEND_URL` environment variable (defaults to `http://localhost:3000`).

**Frontend implementation steps:**
1. Create a route at `/verify-email/:key` (e.g., React Router, Vue Router)
2. Extract the `key` parameter from the URL
3. Call the backend API to verify the email
4. Redirect user to login page on success, or show error message

#### Verify Email
- **Endpoint**: `POST /auth/registration/verify-email/`
- **Purpose**: Verify user's email address using key from verification email
- **Request Body**:
  ```json
  {
    "key": "verification_key_from_email"
  }
  ```
- **Response (200 OK)**: Confirmation message
  ```json
  {
    "detail": "ok"
  }
  ```
- **Error (404 Not Found)**: Invalid or expired key
- **Frontend Usage**: Called when user visits `/verify-email/{key}` route
- **Note**: Required before user can log in

#### Resend Verification Email
- **Endpoint**: `POST /auth/registration/resend-email/`
- **Purpose**: Resend verification email if user didn't receive it
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response (200 OK)**: Email sent (always returns success for security)
- **Frontend Usage**: "Resend verification email" button on login page or verification page

#### User Login
- **Endpoint**: `POST /auth/login/`
- **Purpose**: Authenticate user and get access token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK)**: Authentication token and user details
  ```json
  {
    "token": "abc123...",
    "user": {
      "pk": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
  ```
- **Error (400 Bad Request)**: If email is not verified or credentials are invalid
- **Frontend Usage**: Login form

#### User Logout
- **Endpoint**: `POST /auth/logout/`
- **Purpose**: Invalidate current session token
- **Headers**: `Authorization: Token <token>`
- **Response (204 No Content)**: Token invalidated
- **Frontend Usage**: Logout button

#### Get User Profile
- **Endpoint**: `GET /auth/profile/`
- **Purpose**: Get current user profile information
- **Headers**: `Authorization: Token <token>`
- **Frontend Usage**: Profile display, user settings

#### Update User Profile
- **Endpoint**: `PUT /auth/profile/update/` or `PATCH /auth/profile/update/`
- **Purpose**: Update current user profile information
- **Headers**: `Authorization: Token <token>`
- **Request Body** (all fields optional for PATCH):
  ```json
  {
    "first_name": "John",
    "last_name": "Doe"
  }
  ```
- **Frontend Usage**: Profile edit form

#### Logout from All Devices
- **Endpoint**: `POST /auth/logout-all/`
- **Purpose**: Invalidate all session tokens for the user (logout from all devices)
- **Headers**: `Authorization: Token <token>`
- **Response (200 OK)**: All tokens invalidated
- **Frontend Usage**: Security settings, "logout everywhere" button

#### List Active Sessions
- **Endpoint**: `GET /auth/tokens/`
- **Purpose**: List all active authentication tokens/sessions
- **Headers**: `Authorization: Token <token>`
- **Response (200 OK)**: Array of active sessions with device info
- **Frontend Usage**: Session management page

#### Revoke Specific Session
- **Endpoint**: `DELETE /auth/tokens/{id}/`
- **Purpose**: Revoke a specific session token
- **Headers**: `Authorization: Token <token>`
- **Response (204 No Content)**: Token revoked
- **Frontend Usage**: Remove individual device access

### 1.1. Multi-Factor Authentication (MFA) Endpoints

The API supports MFA using TOTP (Time-based One-Time Password) via authenticator apps.
Email MFA has a known limitation when email is used as the username field.

#### Activate TOTP MFA
- **Endpoint**: `POST /auth/mfa/app/activate/`
- **Purpose**: Start TOTP MFA activation, get provisioning URI for authenticator app
- **Headers**: `Authorization: Token <token>`
- **Response (200 OK)**:
  ```json
  {
    "details": "otpauth://totp/Food%20App:user@example.com?secret=ABCD1234...&issuer=Food%20App&period=600"
  }
  ```
- **Frontend Usage**: Display QR code from provisioning URI for scanning with authenticator app
- **Note**: The `period` parameter indicates how often the code changes (600 seconds by default)

#### Confirm TOTP MFA Activation
- **Endpoint**: `POST /auth/mfa/app/activate/confirm/`
- **Purpose**: Confirm MFA activation with code from authenticator app
- **Headers**: `Authorization: Token <token>`
- **Request Body**:
  ```json
  {
    "code": "123456"
  }
  ```
- **Response (200 OK)**: MFA activated successfully
- **Error (400 Bad Request)**: Invalid or expired code
- **Frontend Usage**: Code input field to verify authenticator setup

#### Deactivate MFA
- **Endpoint**: `POST /auth/mfa/app/deactivate/`
- **Purpose**: Disable MFA for the account
- **Headers**: `Authorization: Token <token>`
- **Frontend Usage**: Security settings to disable MFA

#### List Active MFA Methods
- **Endpoint**: `GET /auth/mfa/mfa/user-active-methods/`
- **Purpose**: Get list of user's active MFA methods
- **Headers**: `Authorization: Token <token>`
- **Response (200 OK)**: Array of active MFA methods
- **Frontend Usage**: Show which MFA methods are enabled

#### Regenerate Backup Codes
- **Endpoint**: `POST /auth/mfa/app/codes/regenerate/`
- **Purpose**: Generate new backup codes for account recovery
- **Headers**: `Authorization: Token <token>`
- **Response (200 OK)**: New backup codes
- **Frontend Usage**: Backup codes management in security settings

### 2. Voice Input & Meal Creation

#### Upload Voice Recording
- **Endpoint**: `POST /food/voice-inputs/upload/`
- **Purpose**: Upload audio file for food analysis
- **Headers**: `Authorization: Token <token>`
- **Request**: Multipart form data with audio file
- **Request Body**:
  ```
  audio: <audio_file.wav/mp3/m4a/ogg/webm/aac>
  ```
  Note: The field name `file` is also accepted as an alternative to `audio`.
- **Process**:
  1. Audio transcription using Whisper AI
  2. Food analysis using GPT-4o-mini
  3. Automatic meal record creation (meal type defaults to "unknown")
- **Response**: Created meal with analyzed food items
- **Frontend Usage**: Voice recording interface

### 3. Meal Management

#### List Meals (with filtering)
- **Endpoint**: `GET /food/meals/`
- **Purpose**: Retrieve user's meals with optional filtering
- **Headers**: `Authorization: Token <token>`
- **Query Parameters**:
  - `date`: Specific date (YYYY-MM-DD)
  - `date_from`: Start date for range (YYYY-MM-DD)
  - `date_to`: End date for range (YYYY-MM-DD)
  - `week`: Specific week (YYYY-WNN, e.g., "2025-W33")
  - `month`: Specific month (YYYY-MM)
- **Response**: Array of meal objects with food items and nutritional data
- **Frontend Usage**:
  - Meal history page
  - Filtered meal lists
  - Date range selections

#### Get Meal Details
- **Endpoint**: `GET /food/meals/{id}/`
- **Purpose**: Get detailed information about a specific meal
- **Headers**: `Authorization: Token <token>`
- **Response**: Complete meal object with all food items and analysis
- **Frontend Usage**: Meal detail view, edit meal page

### 4. Statistics & Analytics Endpoints

#### Dashboard Overview
- **Endpoint**: `GET /food/meals/dashboard/`
- **Purpose**: Get quick statistics overview
- **Headers**: `Authorization: Token <token>`
- **Response**:
  ```json
  {
    "today": {
      "date": "2025-08-17",
      "calories": 1850.5,
      "meal_count": 3
    },
    "this_week": {
      "week_start": "2025-08-11",
      "week_end": "2025-08-17",
      "calories": 12500.0,
      "meal_count": 18,
      "average_daily_calories": 1785.7
    },
    "this_month": {
      "month": "2025-08",
      "calories": 45000.0,
      "meal_count": 65
    }
  }
  ```
- **Frontend Usage**: Main dashboard with today/week/month cards

#### Daily Statistics
- **Endpoint**: `GET /food/meals/stats/daily/`
- **Purpose**: Detailed daily nutritional breakdown
- **Headers**: `Authorization: Token <token>`
- **Query Parameters**:
  - `date`: Target date (YYYY-MM-DD, optional, defaults to today)
- **Response**:
  ```json
  {
    "date": "2025-08-17",
    "total_calories": 1850.5,
    "macros": {
      "protein": 85.2,
      "carbs": 220.1,
      "fat": 65.8
    },
    "meal_count": 3,
    "meal_breakdown": {
      "breakfast": {
        "count": 1,
        "calories": 450.0,
        "meals": [...]
      },
      "lunch": {
        "count": 1,
        "calories": 650.5,
        "meals": [...]
      },
      "dinner": {
        "count": 1,
        "calories": 750.0,
        "meals": [...]
      }
    },
    "meals": [...]
  }
  ```
- **Frontend Usage**:
  - Daily view with macro breakdown
  - Meal type distribution charts
  - Daily calorie tracking

#### Weekly Statistics
- **Endpoint**: `GET /food/meals/stats/weekly/`
- **Purpose**: Weekly nutritional overview with daily breakdown
- **Headers**: `Authorization: Token <token>`
- **Query Parameters**:
  - `week`: Target week (YYYY-WNN, optional, defaults to current week)
- **Response**:
  ```json
  {
    "week": "2025-W33",
    "week_start": "2025-08-11",
    "week_end": "2025-08-17",
    "total_calories": 12500.0,
    "average_daily_calories": 1785.7,
    "meal_count": 18,
    "daily_breakdown": {
      "2025-08-11": {
        "date": "2025-08-11",
        "day_name": "Monday",
        "calories": 1800.0,
        "meal_count": 3
      },
      // ... rest of week
    }
  }
  ```
- **Frontend Usage**:
  - Weekly view with daily comparison
  - Weekly trend charts
  - Day-by-day breakdown

#### Monthly Statistics
- **Endpoint**: `GET /food/meals/stats/monthly/`
- **Purpose**: Monthly nutritional summary
- **Headers**: `Authorization: Token <token>`
- **Query Parameters**:
  - `month`: Target month (YYYY-MM, optional, defaults to current month)
- **Response**:
  ```json
  {
    "month": "2025-08",
    "year": 2025,
    "month_number": 8,
    "month_name": "August",
    "total_calories": 45000.0,
    "average_daily_calories": 1451.6,
    "meal_count": 65,
    "days_in_month": 31
  }
  ```
- **Frontend Usage**:
  - Monthly overview
  - Monthly trend analysis
  - Average daily intake

## Data Models Reference

### Meal Object Structure
```json
{
  "id": 123,
  "description": "Breakfast with oatmeal and fruits",
  "meal_type": "breakfast",
  "total_calories": 450.25,
  "macros": {
    "protein": 15.5,
    "carbs": 65.2,
    "fat": 12.8
  },
  "consumed_at": "2025-08-17T08:30:00Z",
  "food_items": [
    {
      "id": 456,
      "name": "Вівсянка",
      "name_in_english": "Oatmeal",
      "quantity": 100.0,
      "unit": "г",
      "unit_in_english": "g",
      "calories_per_unit": 3.89,
      "total_calories": 389.0,
      "macros": {
        "protein": 13.2,
        "carbs": 58.7,
        "fat": 6.5
      }
    }
  ],
  "voice_input": {
    "id": 789,
    "audio_duration_seconds": 15.5,
    "transcription": "I had oatmeal with banana and honey for breakfast"
  },
  "llm_analysis": {
    "analysis_model": "gpt-4o-mini",
    "analysis_latency_ms": 1250
  }
}
```

## Frontend Architecture Recommendations

### Technology Stack Suggestions
- **Framework**: React.js or Vue.js for component-based UI
- **State Management**: Redux/Vuex for authentication state and data caching
- **HTTP Client**: Axios with interceptors for token management
- **Charts**: Chart.js or D3.js for statistics visualization
- **Audio Recording**: Web Audio API or RecordRTC for voice recording
- **Styling**: Tailwind CSS or Material-UI for responsive design
- **Date Handling**: date-fns or moment.js for date manipulations
- **TOTP for MFA**: otplib or similar for generating TOTP codes (if implementing authenticator preview)

### Key Components Structure

#### 1. Authentication Components
- `LoginForm`: Email/password login
- `RegisterForm`: Account creation with email, password, first/last name
- `EmailVerification`: Handle email verification link/key
- `AuthGuard`: Route protection wrapper
- `MFASetup`: QR code display and code verification for TOTP setup
- `SessionManager`: List and revoke active sessions

#### 2. Voice Recording Components
- `VoiceRecorder`: Audio recording interface with visual feedback
- `RecordingStatus`: Upload progress and processing status

#### 3. Dashboard Components
- `DashboardOverview`: Today/week/month summary cards
- `QuickStats`: Calorie goals and progress bars
- `RecentMeals`: Latest meal entries

#### 4. Statistics Components
- `CalorieChart`: Line/bar charts for calorie trends
- `MacroBreakdown`: Pie chart for protein/carbs/fat distribution
- `TimeRangeSelector`: Date/week/month picker
- `StatsCards`: Numerical statistics display

#### 5. Meal Management Components
- `MealList`: Paginated list of meals with filtering
- `MealCard`: Individual meal display with food items
- `MealDetail`: Detailed view with all nutritional information
- `DateFilter`: Date range and period selection

### State Management Strategy

#### Authentication State
```javascript
{
  user: {
    id: number,
    email: string,
    isAuthenticated: boolean
  },
  token: string | null
}
```

#### App State
```javascript
{
  meals: Array<Meal>,
  statistics: {
    dashboard: DashboardData,
    daily: DailyStats,
    weekly: WeeklyStats,
    monthly: MonthlyStats
  },
  filters: {
    selectedDate: Date,
    selectedWeek: string,
    selectedMonth: string,
    dateRange: { from: Date, to: Date }
  },
  ui: {
    isRecording: boolean,
    isUploading: boolean
  }
}
```

### API Integration Patterns

#### Error Handling
- Implement global error interceptor for API calls
- Handle authentication errors (401) with automatic logout
- Display user-friendly error messages for network issues
- Retry logic for failed requests

#### Data Caching Strategy
- Cache dashboard data for quick loading
- Invalidate cache after new meal creation
- Store recent meals locally for offline viewing
- Implement optimistic updates for better UX

#### Real-time Updates
- Refresh dashboard after successful meal upload
- Update statistics when date filters change
- Show processing status during AI analysis

## User Flow Examples

### 1. Registration Flow
1. User fills registration form (email, password, name)
2. User submits → API returns 201, verification email sent
3. User receives email with link: `http://localhost:3000/verify-email/{key}`
4. User clicks link → Opens frontend at `/verify-email/{key}` route
5. Frontend extracts `key` from URL parameter
6. Frontend calls `POST /api/auth/registration/verify-email/` with `{"key": "..."}`
7. On success → Redirect to login page with success message
8. On error → Show error message with option to resend email

### 2. Login Flow (without MFA)
1. User enters email and password
2. API returns token and user details
3. Frontend stores token (localStorage/sessionStorage)
4. User redirected to dashboard

### 3. Login Flow (with MFA)
1. User enters email and password
2. API returns `ephemeral_token` (indicates MFA required)
3. User enters code from authenticator app
4. Frontend calls MFA code verification with ephemeral token + code
5. API returns actual auth token
6. User redirected to dashboard

### 4. MFA Setup Flow
1. User navigates to security settings
2. User clicks "Enable 2FA"
3. API returns provisioning URI (otpauth://...)
4. Frontend displays QR code from URI
5. User scans with authenticator app
6. User enters code from app to confirm
7. MFA is now active

### 5. Daily Usage Flow
1. User opens app → Dashboard loads with today's stats
2. User taps record button → Voice recording interface
3. User speaks meal description → Audio uploads and processes
4. User sees analyzed meal → Can review and confirm
5. Dashboard updates with new meal data

### 6. Statistics Review Flow
1. User navigates to stats → Daily view for today
2. User selects different date → API call with date parameter
3. User switches to weekly view → Weekly stats load
4. User browses different weeks → Historical data loads

### 7. Meal History Flow
1. User opens meal history → Recent meals list
2. User applies date filter → Filtered meal list
3. User taps meal → Detailed meal view
4. User can see all food items and nutritional breakdown

### 8. Session Management Flow
1. User navigates to security settings
2. User views list of active sessions (GET /auth/tokens/)
3. User can revoke individual sessions (DELETE /auth/tokens/{id}/)
4. User can logout from all devices (POST /auth/logout-all/)

## Error Handling & Edge Cases

### API Error Responses
- Handle 401 (Unauthorized): Redirect to login, clear stored token
- Handle 400 (Bad Request): Show validation errors (e.g., "E-mail is not verified")
- Handle 500 (Server Error): Show generic error message
- Handle network errors: Show connection issues

### Authentication Edge Cases
- Email not verified: Show message prompting user to check email
- Invalid/expired verification key: Show error, offer to resend
- Wrong password: Show "invalid credentials" message
- Token expired: Redirect to login

### Voice Recording Edge Cases
- Handle microphone permission denied
- Handle audio recording failures
- Handle file upload failures
- Handle AI analysis timeouts (should retry)

### Data Display Edge Cases
- Handle empty meal lists gracefully
- Handle missing nutritional data
- Handle timezone differences in dates
- Handle incomplete AI analysis results

## Performance Considerations

### API Optimization
- Implement pagination for meal lists
- Use date-based caching for statistics
- Lazy load meal details on demand
- Debounce API calls for search/filter

### UI Performance
- Implement virtual scrolling for large meal lists
- Use image lazy loading for food photos (if added later)
- Optimize chart rendering for large datasets
- Implement skeleton loading states

This comprehensive guide provides all the necessary information for implementing a full-featured frontend for the food tracking application. The API endpoints are production-ready and include comprehensive authentication, voice processing, and statistics capabilities.
