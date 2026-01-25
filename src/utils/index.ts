/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

import { clsx, type ClassValue } from 'clsx';

// Re-export logger for convenient access
export { logger } from './logger';

/**
 * Utility function to merge CSS classes
 * Combines clsx for conditional classes with proper string handling
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format date to readable string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format date to API-compatible string (YYYY-MM-DD)
 * @param date - Date to format
 * @returns API-compatible date string
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format time from date
 * @param date - Date to extract time from
 * @returns Time string in HH:MM format
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(dateObj);
}

/**
 * Format meal time with timezone awareness
 * @param consumedAt - ISO date string of when meal was consumed
 * @param userTimezone - User's timezone at meal logging (IANA format)
 * @returns Formatted date and time string
 */
export function formatMealTime(
  consumedAt: string,
  userTimezone?: string | null
): string {
  const dateObj = new Date(consumedAt);
  
  // If we have the user's timezone, format in that timezone
  if (userTimezone) {
    return dateObj.toLocaleString('en-US', {
      timeZone: userTimezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  
  // Fallback to browser's timezone
  return dateObj.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Format calories with proper rounding
 * @param calories - Calorie value to format (number or string)
 * @returns Formatted calorie string
 */
export function formatCalories(calories: number | string | null | undefined): string {
  if (calories == null) return '0';
  const num = typeof calories === 'string' ? parseFloat(calories) : calories;
  return isNaN(num) ? '0' : Math.round(num).toLocaleString();
}

/**
 * Format macros to one decimal place
 * @param value - Macro value to format (number or string)
 * @returns Formatted macro string with 'g' suffix
 */
export function formatMacros(value: number | string | null | undefined): string {
  if (value == null) return '0.0g';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0.0g' : `${num.toFixed(1)}g`;
}

/**
 * Capitalize first letter of string
 * @param str - String to capitalize
 * @returns Capitalized string, or empty string if input is nullish
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get week number from date
 * @param date - Date to get week number for
 * @returns Week string in YYYY-WNN format
 */
export function getWeekNumber(date: Date): string {
  const year = date.getFullYear();
  const onejan = new Date(year, 0, 1);
  const millisecsInDay = 86400000;
  const week = Math.ceil(
    ((date.getTime() - onejan.getTime()) / millisecsInDay + onejan.getDay() + 1) / 7
  );
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Get month string from date
 * @param date - Date to get month string for
 * @returns Month string in YYYY-MM format
 */
export function getMonthString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Debounce function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
