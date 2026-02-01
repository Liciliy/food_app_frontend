/**
 * Meal History List Component
 * Detailed list of meals with nutritional breakdown
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Clock, Flame, Utensils } from 'lucide-react';
import type { Meal } from '../../types';
import { formatTime, formatCalories, formatMacros } from '../../utils';

interface MealHistoryListProps {
  meals: Meal[];
  title?: string;
}

/**
 * Meal type styling
 */
function getMealTypeStyle(mealType: string) {
  switch (mealType) {
    case 'breakfast':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🌅', translationKey: 'meals:mealTypes.breakfast' };
    case 'lunch':
      return { bg: 'bg-orange-100', text: 'text-orange-700', icon: '☀️', translationKey: 'meals:mealTypes.lunch' };
    case 'dinner':
      return { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🌙', translationKey: 'meals:mealTypes.dinner' };
    case 'snack':
      return { bg: 'bg-green-100', text: 'text-green-700', icon: '🍎', translationKey: 'meals:mealTypes.snack' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '🍽️', translationKey: 'meals:mealTypes.unknown' };
  }
}

/**
 * Individual meal item with expandable details
 */
function MealItem({ meal }: { meal: Meal }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const style = getMealTypeStyle(meal.meal_type || 'unknown');

  const calories = Number(meal.total_calories) || 0;
  const protein = Number(meal.macros?.protein) || 0;
  const carbs = Number(meal.macros?.carbs) || 0;
  const fat = Number(meal.macros?.fat) || 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
            {style.icon} {t(style.translationKey)}
          </span>
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            {meal.consumed_at ? formatTime(meal.consumed_at) : '--:--'}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center text-primary-600 font-semibold">
            <Flame className="w-4 h-4 mr-1" />
            {formatCalories(calories)} {t('common:calories_short')}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Description */}
          {meal.description && (
            <p className="text-sm text-gray-700 mt-3 mb-3">
              {meal.description_en || meal.description}
            </p>
          )}

          {/* Macros */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">{t('stats:summary.protein')}</p>
              <p className="text-sm font-bold text-blue-700">{formatMacros(protein)}</p>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-600">{t('stats:summary.carbs')}</p>
              <p className="text-sm font-bold text-yellow-700">{formatMacros(carbs)}</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600">{t('stats:summary.fat')}</p>
              <p className="text-sm font-bold text-green-700">{formatMacros(fat)}</p>
            </div>
          </div>

          {/* Food Items */}
          {meal.food_items && meal.food_items.length > 0 && (
            <div>
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <Utensils className="w-3 h-3 mr-1" />
                {t('meals:mealCard.itemsCount', { count: meal.food_items.length })}
              </div>
              <div className="space-y-2">
                {meal.food_items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.name_in_english || item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} {item.unit_in_english || item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCalories(Number(item.calories_total) || 0)} {t('common:calories_short')}
                      </p>
                      <p className="text-xs text-gray-500">
                        P: {formatMacros(Number(item.protein_grams) || 0)} |
                        C: {formatMacros(Number(item.carbs_grams) || 0)} |
                        F: {formatMacros(Number(item.fat_grams) || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Transcription */}
          {typeof meal.voice_input === 'object' && meal.voice_input?.transcription && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 italic">
                🎤 "{meal.voice_input.transcription}"
              </p>
            </div>
          )}

          {/* Cuisine & Additional Info */}
          <div className="mt-3 flex flex-wrap gap-2">
            {meal.cuisine_en && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                🍴 {meal.cuisine_en}
              </span>
            )}
            {meal.portion_size_en && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                📏 {meal.portion_size_en}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Meal history list component
 */
export function MealHistoryList({ meals, title }: MealHistoryListProps) {
  const { t } = useTranslation();
  const displayTitle = title || t('stats:history.title');
  
  if (!meals || meals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{displayTitle}</h3>
        <div className="text-center py-8 text-gray-400">
          <Utensils className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('stats:history.noMeals')}</p>
        </div>
      </div>
    );
  }

  // Sort meals by consumed_at time (most recent first)
  const sortedMeals = [...meals].sort((a, b) => {
    const dateA = a.consumed_at ? new Date(a.consumed_at).getTime() : 0;
    const dateB = b.consumed_at ? new Date(b.consumed_at).getTime() : 0;
    return dateB - dateA;
  });

  // Calculate totals
  const totalCalories = meals.reduce((sum, meal) => sum + (Number(meal.total_calories) || 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (Number(meal.macros?.protein) || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (Number(meal.macros?.carbs) || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (Number(meal.macros?.fat) || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{displayTitle}</h3>
        <span className="text-sm text-gray-500">{t('meals:mealCard.itemsCount', { count: meals.length })}</span>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">{t('stats:charts.total')}</p>
          <p className="text-sm font-bold text-gray-900">{formatCalories(totalCalories)} {t('common:calories_short')}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-blue-500">{t('stats:summary.protein')}</p>
          <p className="text-sm font-bold text-blue-600">{formatMacros(totalProtein)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-yellow-500">{t('stats:summary.carbs')}</p>
          <p className="text-sm font-bold text-yellow-600">{formatMacros(totalCarbs)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-green-500">{t('stats:summary.fat')}</p>
          <p className="text-sm font-bold text-green-600">{formatMacros(totalFat)}</p>
        </div>
      </div>

      {/* Meal List */}
      <div className="space-y-3">
        {sortedMeals.map((meal) => (
          <MealItem key={meal.id} meal={meal} />
        ))}
      </div>
    </div>
  );
}
