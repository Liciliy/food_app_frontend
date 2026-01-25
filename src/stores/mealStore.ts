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
  
  // Meal management
  revertMeal: (mealId: number) => Promise<boolean>;
  deleteMeal: (mealId: number) => Promise<boolean>;
  
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
   * Revert (undo) a recently created meal
   */
  revertMeal: async (mealId: number) => {
    logger.state('mealStore', 'revertMeal:start', { mealId });
    
    try {
      logger.api('POST', `/food/meals/${mealId}/revert/`, {});
      const response = await MealService.revertMeal(mealId);
      logger.apiResponse('POST', `/food/meals/${mealId}/revert/`, 200, response);
      
      // Remove the reverted meal from the list
      const currentMeals = get().meals;
      const updatedMeals = currentMeals.filter(meal => meal.id !== mealId);
      
      // Clear currentMeal if it was the reverted one
      const currentMeal = get().currentMeal;
      const newCurrentMeal = currentMeal?.id === mealId ? null : currentMeal;
      
      // Also update dailyStats.meals to reflect the revert immediately
      const currentDailyStats = get().dailyStats;
      const updatedDailyStats = currentDailyStats ? {
        ...currentDailyStats,
        meals: currentDailyStats.meals?.filter(meal => meal.id !== mealId) || [],
      } : null;
      
      logger.state('mealStore', 'revertMeal:success', { mealId, foodItemsDeleted: response.food_items_deleted });
      
      set({
        meals: updatedMeals,
        currentMeal: newCurrentMeal,
        dailyStats: updatedDailyStats,
        successMessage: `Meal undone. ${response.food_items_deleted} food items removed.`,
      });
      
      // Refresh dashboard data in background to get updated totals
      get().fetchDashboard(true).catch(() => {
        // Silently ignore dashboard refresh errors
      });
      
      return true;
    } catch (error) {
      logger.error('revertMeal failed:', error);
      const apiError = error as ApiError;
      const errorMessage = typeof apiError === 'object' && apiError?.detail 
        ? apiError.detail 
        : 'Failed to undo meal. The undo window may have expired.';
      set({ error: errorMessage });
      return false;
    }
  },

  /**
   * Delete a meal within the allowed time window (3 hours)
   */
  deleteMeal: async (mealId: number) => {
    logger.state('mealStore', 'deleteMeal:start', { mealId });
    
    try {
      logger.api('DELETE', `/food/meals/${mealId}/delete/`, {});
      const response = await MealService.deleteMeal(mealId);
      logger.apiResponse('DELETE', `/food/meals/${mealId}/delete/`, 200, response);
      
      // Remove the deleted meal from the list
      const currentMeals = get().meals;
      const updatedMeals = currentMeals.filter(meal => meal.id !== mealId);
      
      // Clear currentMeal if it was the deleted one
      const currentMeal = get().currentMeal;
      const newCurrentMeal = currentMeal?.id === mealId ? null : currentMeal;
      
      // Also update dailyStats.meals to reflect the deletion immediately
      const currentDailyStats = get().dailyStats;
      const updatedDailyStats = currentDailyStats ? {
        ...currentDailyStats,
        meals: currentDailyStats.meals?.filter(meal => meal.id !== mealId) || [],
      } : null;
      
      logger.state('mealStore', 'deleteMeal:success', { mealId, foodItemsDeleted: response.food_items_deleted });
      
      set({
        meals: updatedMeals,
        currentMeal: newCurrentMeal,
        dailyStats: updatedDailyStats,
        successMessage: `Meal deleted. ${response.food_items_deleted} food items removed.`,
      });
      
      // Refresh dashboard data in background to get updated totals
      get().fetchDashboard(true).catch(() => {
        // Silently ignore dashboard refresh errors
      });
      
      return true;
    } catch (error) {
      logger.error('deleteMeal failed:', error);
      const apiError = error as ApiError;
      const errorMessage = typeof apiError === 'object' && apiError?.detail 
        ? apiError.detail 
        : 'Failed to delete meal. The delete window may have expired.';
      set({ error: errorMessage });
      return false;
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