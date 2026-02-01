/**
 * Meal Card Component
 * Displays a single meal with nutritional information
 */

import { useTranslation } from 'react-i18next';
import { Clock, Utensils, Flame } from 'lucide-react';
import type { Meal } from '../../types';
import { formatTime, formatMealTime, formatCalories, formatMacros } from '../../utils';
import { cn } from '../../utils';

interface MealCardProps {
  meal: Meal;
  onClick?: () => void;
  compact?: boolean;
}

/**
 * Get meal type icon and color
 */
function getMealTypeStyle(mealType: string): { bgColor: string; textColor: string; icon: string; translationKey: string } {
  switch (mealType) {
    case 'breakfast':
      return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', icon: '🌅', translationKey: 'mealTypes.breakfast' };
    case 'lunch':
      return { bgColor: 'bg-orange-100', textColor: 'text-orange-700', icon: '☀️', translationKey: 'mealTypes.lunch' };
    case 'dinner':
      return { bgColor: 'bg-purple-100', textColor: 'text-purple-700', icon: '🌙', translationKey: 'mealTypes.dinner' };
    case 'snack':
      return { bgColor: 'bg-green-100', textColor: 'text-green-700', icon: '🍎', translationKey: 'mealTypes.snack' };
    default:
      return { bgColor: 'bg-gray-100', textColor: 'text-gray-700', icon: '🍽️', translationKey: 'mealTypes.unknown' };
  }
}

/**
 * Meal card component
 * Shows meal summary with food items and macros
 */
export function MealCard({ meal, onClick, compact = false }: MealCardProps) {
  const { t } = useTranslation('meals');
  const mealType = meal.meal_type || 'unknown';
  const mealStyle = getMealTypeStyle(mealType);
  const consumedTime = meal.consumed_at ? formatTime(meal.consumed_at) : '--:--';
  const consumedDateTime = meal.consumed_at ? formatMealTime(meal.consumed_at, meal.user_timezone) : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary-300',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            mealStyle.bgColor,
            mealStyle.textColor
          )}>
            {mealStyle.icon} {t(mealStyle.translationKey)}
          </span>
          <div className="flex items-center text-xs text-gray-500" title={consumedDateTime || undefined}>
            <Clock className="w-3 h-3 mr-1" />
            {consumedTime}
          </div>
        </div>
        
        <div className="flex items-center text-primary-600 font-semibold">
          <Flame className="w-4 h-4 mr-1" />
          {formatCalories(meal.total_calories)} {t('common:calories', { context: 'short' })}
        </div>
      </div>

      {/* Description */}
      {meal.description && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {meal.description}
        </p>
      )}

      {/* Food Items */}
      {!compact && meal.food_items && meal.food_items.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <Utensils className="w-3 h-3 mr-1" />
            {t('mealCard.itemsCount', { count: meal.food_items.length })}
          </div>
          <div className="flex flex-wrap gap-1">
            {meal.food_items.slice(0, 5).map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {item.name_in_english}
                <span className="ml-1 text-gray-500">
                  ({formatCalories(item.calories_total)})
                </span>
              </span>
            ))}
            {meal.food_items.length > 5 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                {t('mealCard.moreItems', { count: meal.food_items.length - 5 })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Macros - only show if macros data is available */}
      {meal.macros && (
        <div className="flex items-center space-x-4 pt-2 border-t border-gray-100">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{t('macros.protein')}</span>
              <span className="font-medium text-blue-600">
                {formatMacros(meal.macros.protein ?? 0)}
              </span>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(((meal.macros.protein ?? 0) / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{t('macros.carbs')}</span>
              <span className="font-medium text-yellow-600">
                {formatMacros(meal.macros.carbs ?? 0)}
              </span>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
              <div 
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${Math.min(((meal.macros.carbs ?? 0) / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{t('macros.fat')}</span>
              <span className="font-medium text-red-600">
                {formatMacros(meal.macros.fat ?? 0)}
              </span>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
              <div 
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${Math.min(((meal.macros.fat ?? 0) / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Transcription preview (if available) */}
      {!compact && typeof meal.voice_input === 'object' && meal.voice_input?.transcription && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic line-clamp-1">
            "{meal.voice_input.transcription}"
          </p>
        </div>
      )}

      {/* Time reference debug info (if available) */}
      {!compact && meal.consumed_at_raw && (
        <div className="mt-2">
          <p className="text-xs text-gray-400">
            {t('mealCard.timeDetected')}: "{meal.consumed_at_raw}"
          </p>
        </div>
      )}
    </div>
  );
}