/**
 * Meal Store
 * Global state management for meals and dashboard data using Zustand
 */

import { create } from 'zustand';
import { MealService } from '../services/mealService';
import { logger } from '../utils/logger';
import type { 
  Meal, 
  DashboardOverview, 
  DailyStats,
  WeeklyStats,
  MonthlyStats,
  ApiError 
} from '../types';

/**
 * Meal store state
 */
interface MealState {
  // Data
  meals: Meal[];
  currentMeal: Meal | null;
  dashboardData: DashboardOverview | null;
  dailyStats: DailyStats | null;
  weeklyStats: WeeklyStats | null;
  monthlyStats: MonthlyStats | null;
  
  // UI State
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  successMessage: string | null;
}

/**
 * Meal store actions
 */
interface MealActions {
  // Voice recording & meal creation
  uploadVoiceRecording: (audioFile: File) => Promise<Meal | null>;
  
  // Meal fetching
  fetchMeals: (params?: { date?: string; date_from?: string; date_to?: string }) => Promise<void>;
  fetchMealById: (mealId: number) => Promise<void>;
  
  // Dashboard & stats
  fetchDashboard: (silent?: boolean) => Promise<void>;
  fetchDailyStats: (date?: string) => Promise<void>;
  fetchWeeklyStats: (week?: string) => Promise<void>;
  fetchMonthlyStats: (month?: string) => Promise<void>;
  
  // UI helpers
  clearError: () => void;
  clearSuccess: () => void;
  resetUploadState: () => void;
}

/**
 * Complete meal store type
 */
type MealStore = MealState & MealActions;

/**
 * Meal store implementation
 */
export const useMealStore = create<MealStore>((set, get) => ({
  // ===== INITIAL STATE =====
  meals: [],
  currentMeal: null,
  dashboardData: null,
  dailyStats: null,
  weeklyStats: null,
  monthlyStats: null,
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,
  successMessage: null,

  // ===== ACTIONS =====

  /**
   * Upload voice recording and create meal
   */
  uploadVoiceRecording: async (audioFile: File) => {
    logger.state('mealStore', 'uploadVoiceRecording:start', { fileName: audioFile.name, size: audioFile.size });
    
    set({ 
      isUploading: true, 
      uploadProgress: 0, 
      error: null, 
      successMessage: null 
    });

    try {
      // Simulate progress (actual progress tracking would require XHR)
      set({ uploadProgress: 30 });
      
      logger.api('POST', '/food/voice-inputs/upload/', { fileName: audioFile.name });
      const meal = await MealService.uploadVoiceRecording(audioFile);
      logger.apiResponse('POST', '/food/voice-inputs/upload/', 200, meal);
      logger.debug('Meal object received:', meal);
      
      set({ uploadProgress: 100 });
      
      // Add new meal to the list
      const currentMeals = get().meals;
      
      // Format success message - handle total_calories as string or number
      const calories = meal.total_calories != null ? Number(meal.total_calories) : null;
      const caloriesText = calories != null && !isNaN(calories)
        ? `${Math.round(calories)} calories recorded.`
        : 'Meal recorded.';
      
      logger.state('mealStore', 'uploadVoiceRecording:success', { mealId: meal.id, calories: meal.total_calories });
      
      set({
        meals: [meal, ...currentMeals],
        currentMeal: meal,
        isUploading: false,
        uploadProgress: 0,
        successMessage: `Meal logged! ${caloriesText}`,
      });

      // Refresh dashboard data in background (don't await, don't let it fail the upload)
      get().fetchDashboard(true).catch(() => {
        // Silently ignore dashboard refresh errors
      });
      
      return meal;
    } catch (error) {
      logger.error('uploadVoiceRecording failed:', error);
      const apiError = error as ApiError;
      const errorMessage = typeof apiError === 'object' && apiError?.detail 
        ? apiError.detail 
        : 'Failed to process voice recording. Please try again.';
      set({
        isUploading: false,
        uploadProgress: 0,
        error: errorMessage,
      });
      return null;
    }
  },

  /**
   * Fetch meals with optional filtering
   */
  fetchMeals: async (params) => {
    set({ isLoading: true, error: null });

    try {
      const meals = await MealService.getMeals(params);
      set({ meals, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || 'Failed to fetch meals.',
      });
    }
  },

  /**
   * Fetch single meal by ID
   */
  fetchMealById: async (mealId: number) => {
    set({ isLoading: true, error: null });

    try {
      const meal = await MealService.getMealById(mealId);
      set({ currentMeal: meal, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || 'Failed to fetch meal details.',
      });
    }
  },

  /**
   * Fetch dashboard overview
   * @param silent - If true, don't update loading/error state (used for background refreshes)
   */
  fetchDashboard: async (silent = false) => {
    if (!silent) {
      set({ isLoading: true, error: null });
    }

    try {
      const dashboardData = await MealService.getDashboardOverview();
      set({ dashboardData, isLoading: false });
    } catch (error) {
      if (!silent) {
        const apiError = error as ApiError;
        set({
          isLoading: false,
          error: apiError.detail || 'Failed to fetch dashboard data.',
        });
      } else {
        set({ isLoading: false });
      }
    }
  },

  /**
   * Fetch daily statistics
   */
  fetchDailyStats: async (date?: string) => {
    set({ isLoading: true, error: null });

    try {
      const dailyStats = await MealService.getDailyStats(date);
      set({ dailyStats, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || 'Failed to fetch daily statistics.',
      });
    }
  },

  /**
   * Fetch weekly statistics
   */
  fetchWeeklyStats: async (week?: string) => {
    set({ isLoading: true, error: null });

    try {
      const weeklyStats = await MealService.getWeeklyStats(week);
      set({ weeklyStats, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || 'Failed to fetch weekly statistics.',
      });
    }
  },

  /**
   * Fetch monthly statistics
   */
  fetchMonthlyStats: async (month?: string) => {
    set({ isLoading: true, error: null });

    try {
      const monthlyStats = await MealService.getMonthlyStats(month);
      set({ monthlyStats, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || 'Failed to fetch monthly statistics.',
      });
    }
  },

  /**
   * Clear error message
   */
  clearError: () => set({ error: null }),

  /**
   * Clear success message
   */
  clearSuccess: () => set({ successMessage: null }),

  /**
   * Reset upload state
   */
  resetUploadState: () => set({ 
    isUploading: false, 
    uploadProgress: 0,
    currentMeal: null,
  }),
}));