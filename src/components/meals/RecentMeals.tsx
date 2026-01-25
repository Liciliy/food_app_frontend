/**
 * Recent Meals Component
 * Displays a list of recent meals
 */

import { useEffect } from 'react';
import { useMealStore } from '../../stores/mealStore';
import { MealCard } from './MealCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { UtensilsCrossed } from 'lucide-react';

interface RecentMealsProps {
  limit?: number;
}

/**
 * Recent meals list component
 */
export function RecentMeals({ limit = 5 }: RecentMealsProps) {
  const { meals, isLoading, fetchMeals } = useMealStore();

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const displayMeals = limit ? meals.slice(0, limit) : meals;

  if (isLoading && meals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Meals</h2>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Meals</h2>
      
      {displayMeals.length === 0 ? (
        <div className="text-center py-8">
          <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No meals recorded yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Use the voice recorder above to log your first meal
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayMeals.map((meal, index) => (
            <MealCard key={meal.id ?? `meal-${index}`} meal={meal} />
          ))}
        </div>
      )}
    </div>
  );
}