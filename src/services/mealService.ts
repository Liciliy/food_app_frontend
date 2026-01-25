/**
 * Meal Service
 * Handles all meal-related API operations including voice upload
 */

import { apiClient, createFormData } from './api';
import { logger } from '../utils/logger';
import type { 
  Meal, 
  DashboardOverview, 
  DailyStats,
  WeeklyStats,
  MonthlyStats
} from '../types';

/**
 * Voice upload API response structure
 * The API returns the meal nested inside a wrapper object
 */
interface VoiceUploadResponse {
  voice_input_id: number;
  analysis: {
    id: number;
    user: number;
    voice_input: number;
    // Additional analysis fields...
  };
  meal: Meal;
}

/**
 * Revert meal API response structure
 */
interface RevertMealResponse {
  message: string;
  meal_id: number;
  voice_input_id: number;
  llm_analysis_id: number;
  time_extraction_id: number | null;
  food_items_deleted: number;
  reverted_at: string;
}

/**
 * Delete meal API response structure
 */
interface DeleteMealResponse {
  message: string;
  meal_id: number;
  voice_input_id: number;
  llm_analysis_id: number;
  time_extraction_id: number | null;
  food_items_deleted: number;
  deleted_at: string;
}

/**
 * Meal service class
 * Provides methods for meal management and voice recording upload
 */
export class MealService {
  /**
   * Upload voice recording for meal analysis
   * @param audioFile - Audio file (wav, mp3, m4a, ogg, webm, aac)
   * @returns Promise with created meal data
   */
  static async uploadVoiceRecording(audioFile: File): Promise<Meal> {
    const formData = createFormData({ audio: audioFile });
    
    // Add client timestamp and timezone for accurate time detection
    const clientTimestamp = new Date().toISOString().slice(0, 19); // "2026-01-24T14:30:00"
    const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // "Europe/Kyiv"
    
    formData.append('client_timestamp', clientTimestamp);
    formData.append('client_timezone', clientTimezone);
    
    const response = await apiClient.post<VoiceUploadResponse>('/food/voice-inputs/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for audio processing
    });
    
    logger.debug('Voice upload raw response:', response.data);
    
    // Extract the meal from the nested response structure
    const meal = response.data.meal;
    
    if (!meal) {
      logger.error('No meal object in voice upload response', response.data);
      throw new Error('Invalid response: meal data not found');
    }
    
    return meal;
  }

  /**
   * Get list of meals with optional filtering
   * @param params - Filter parameters
   * @returns Promise with array of meals
   */
  static async getMeals(params?: {
    date?: string;
    date_from?: string;
    date_to?: string;
    week?: string;
    month?: string;
  }): Promise<Meal[]> {
    const response = await apiClient.get<Meal[]>('/food/meals/', { params });
    return response.data;
  }

  /**
   * Get single meal details
   * @param mealId - Meal ID
   * @returns Promise with meal details
   */
  static async getMealById(mealId: number): Promise<Meal> {
    const response = await apiClient.get<Meal>(`/food/meals/${mealId}/`);
    return response.data;
  }

  /**
   * Get dashboard overview statistics
   * @returns Promise with dashboard data
   */
  static async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await apiClient.get<DashboardOverview>('/food/meals/dashboard/');
    return response.data;
  }

  /**
   * Get daily statistics
   * @param date - Target date (YYYY-MM-DD), defaults to today
   * @returns Promise with daily stats
   */
  static async getDailyStats(date?: string): Promise<DailyStats> {
    const response = await apiClient.get<DailyStats>('/food/meals/stats/daily/', {
      params: date ? { date } : undefined,
    });
    return response.data;
  }

  /**
   * Get weekly statistics
   * @param week - Target week (YYYY-WNN), defaults to current week
   * @returns Promise with weekly stats
   */
  static async getWeeklyStats(week?: string): Promise<WeeklyStats> {
    const response = await apiClient.get<WeeklyStats>('/food/meals/stats/weekly/', {
      params: week ? { week } : undefined,
    });
    return response.data;
  }

  /**
   * Get monthly statistics
   * @param month - Target month (YYYY-MM), defaults to current month
   * @returns Promise with monthly stats
   */
  static async getMonthlyStats(month?: string): Promise<MonthlyStats> {
    const response = await apiClient.get<MonthlyStats>('/food/meals/stats/monthly/', {
      params: month ? { month } : undefined,
    });
    return response.data;
  }

  /**
   * Revert (undo) a recently created meal
   * Only available within 20 seconds after meal analysis completes
   * @param mealId - Meal ID to revert
   * @returns Promise with revert response
   */
  static async revertMeal(mealId: number): Promise<RevertMealResponse> {
    const response = await apiClient.post<RevertMealResponse>(`/food/meals/${mealId}/revert/`);
    return response.data;
  }

  /**
   * Delete a meal within the allowed time window
   * Only available within 3 hours after meal creation
   * @param mealId - Meal ID to delete
   * @returns Promise with delete response
   */
  static async deleteMeal(mealId: number): Promise<DeleteMealResponse> {
    const response = await apiClient.delete<DeleteMealResponse>(`/food/meals/${mealId}/delete/`);
    return response.data;
  }
}