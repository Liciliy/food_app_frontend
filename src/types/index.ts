/**
 * Core data types for the Food Tracking Application
 * These types match the API response structures defined in the backend
 */

// ===== AUTHENTICATION TYPES =====

/**
 * User profile information
 */
export interface User {
  pk: number;
  email: string;
  first_name: string;
  last_name: string;
}

/**
 * Authentication token response from login
 */
export interface AuthResponse {
  token: string; // Knox token
  user: User;
}

/**
 * Registration response (no token until email verified)
 */
export interface RegisterResponse {
  detail: string;
}

/**
 * Email verification request
 */
export interface VerifyEmailRequest {
  key: string;
}

/**
 * Resend verification email request
 */
export interface ResendVerificationRequest {
  email: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  email: string;
  first_name: string;
  last_name: string;
  password1: string;
  password2: string;
}

// ===== MEAL TYPES =====

/**
 * Types of meals supported by the application
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Nutritional macros breakdown
 */
export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Individual food item within a meal
 */
export interface FoodItem {
  id: number;
  name: string; // Original name (may be in user's language)
  name_in_english?: string | null; // English translation
  brand?: string | null;
  quantity?: string | null; // Decimal as string
  unit?: string | null; // Original unit
  unit_in_english?: string | null; // English translation
  calories_total?: string | null; // Decimal as string
  protein_grams?: string | null;
  carbs_grams?: string | null;
  fat_grams?: string | null;
  extra_details?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Voice input information for meal creation
 */
export interface VoiceInput {
  id: number;
  audio_duration_seconds: number;
  transcription: string;
}

/**
 * LLM analysis metadata
 */
export interface LLMAnalysis {
  analysis_model: string;
  analysis_latency_ms: number;
}

/**
 * Complete meal object as returned by the API
 */
export interface Meal {
  id: number;
  user?: number;
  voice_input?: number | VoiceInput | null;
  llm_analysis?: number | LLMAnalysis | null;
  consumed_at: string; // ISO date string
  user_timezone?: string | null; // User's timezone at meal logging (IANA format)
  consumed_at_raw?: string | null; // Raw time reference from speech
  meal_type: MealType | 'unknown';
  description?: string | null;
  description_en?: string | null;
  cuisine?: string | null;
  cuisine_en?: string | null;
  portion_size?: string | null;
  portion_size_en?: string | null;
  additional_info?: string | null;
  additional_info_en?: string | null;
  total_calories?: string | number; // Can be decimal string or number
  total_protein?: string | number;
  total_carbs?: string | number;
  total_fat?: string | number;
  macros?: Macros; // Computed macros object
  food_items?: FoodItem[];
}

// ===== STATISTICS TYPES =====

/**
 * Daily statistics summary
 */
export interface DailyStats {
  date: string;
  total_calories: number;
  macros: Macros;
  meal_count: number;
  meal_breakdown: {
    [key in MealType]: {
      count: number;
      calories: number;
      meals: Meal[];
    };
  };
  meals: Meal[];
}

/**
 * Single day breakdown for weekly view
 */
export interface DayBreakdown {
  date: string;
  day_name: string;
  calories: number;
  meal_count: number;
}

/**
 * Weekly statistics summary
 */
export interface WeeklyStats {
  week: string; // Format: YYYY-WNN
  week_start: string;
  week_end: string;
  total_calories: number;
  average_daily_calories: number;
  meal_count: number;
  daily_breakdown: Record<string, DayBreakdown>;
}

/**
 * Monthly statistics summary
 */
export interface MonthlyStats {
  month: string; // Format: YYYY-MM
  year: number;
  month_number: number;
  month_name: string;
  total_calories: number;
  average_daily_calories: number;
  meal_count: number;
  days_in_month: number;
}

/**
 * Dashboard overview with quick stats
 */
export interface DashboardOverview {
  today: {
    date: string;
    calories: number;
    meal_count: number;
  };
  this_week: {
    week_start: string;
    week_end: string;
    calories: number;
    meal_count: number;
    average_daily_calories: number;
  };
  this_month: {
    month: string;
    calories: number;
    meal_count: number;
  };
}

// ===== API ERROR TYPES =====

/**
 * Standard API error response structure
 */
export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  non_field_errors?: string[];
}

// ===== FORM TYPES =====

/**
 * Voice recording upload payload
 */
export interface VoiceUploadRequest {
  audio_file: File;
  meal_type: MealType;
}

// ===== APPLICATION STATE TYPES =====

/**
 * Authentication state in the store
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * UI state for various components
 */
export interface UIState {
  isRecording: boolean;
  isUploading: boolean;
  selectedMealType: MealType;
  selectedDate: Date;
  selectedWeek: string;
  selectedMonth: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

/**
 * Application data state
 */
export interface AppDataState {
  meals: Meal[];
  dashboardData: DashboardOverview | null;
  dailyStats: DailyStats | null;
  weeklyStats: WeeklyStats | null;
  monthlyStats: MonthlyStats | null;
  isLoading: boolean;
  error: string | null;
}
