/**
 * Calorie Goal Progress Component
 * Shows progress toward monthly calorie goals
 */

import { useMemo } from 'react';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import type { MonthlyStats } from '../../types';

interface CalorieGoalProgressProps {
  monthlyStats: MonthlyStats | null;
  dailyGoal?: number;
  isLoading?: boolean;
}

/**
 * Calorie goal progress for monthly view
 */
export function CalorieGoalProgress({ 
  monthlyStats, 
  dailyGoal = 2000,
  isLoading 
}: CalorieGoalProgressProps) {
  const stats = useMemo(() => {
    if (!monthlyStats) {
      return {
        totalCalories: 0,
        avgDaily: 0,
        daysInMonth: 30,
        mealCount: 0,
        monthlyGoal: dailyGoal * 30,
        progress: 0,
        variance: 0,
      };
    }

    const totalCalories = Number(monthlyStats.total_calories) || 0;
    const avgDaily = Number(monthlyStats.average_daily_calories) || 0;
    const daysInMonth = monthlyStats.days_in_month || 30;
    const monthlyGoal = dailyGoal * daysInMonth;
    
    // Calculate progress as percentage of expected calories so far
    const today = new Date();
    const dayOfMonth = today.getDate();
    const expectedSoFar = dailyGoal * dayOfMonth;
    const progress = expectedSoFar > 0 ? (totalCalories / expectedSoFar) * 100 : 0;
    
    // Variance from daily goal
    const variance = avgDaily - dailyGoal;

    return {
      totalCalories,
      avgDaily,
      daysInMonth,
      mealCount: monthlyStats.meal_count || 0,
      monthlyGoal,
      progress,
      variance,
    };
  }, [monthlyStats, dailyGoal]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Progress</h3>
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  const progressColor = 
    stats.progress >= 90 && stats.progress <= 110 ? 'text-green-600' :
    stats.progress < 80 ? 'text-yellow-600' : 'text-red-600';

  const progressBgColor = 
    stats.progress >= 90 && stats.progress <= 110 ? 'bg-green-500' :
    stats.progress < 80 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Monthly Progress</h3>
        <div className="flex items-center text-sm text-gray-500">
          <Target className="w-4 h-4 mr-1" />
          Goal: {dailyGoal.toLocaleString()} kcal/day
        </div>
      </div>

      {/* Progress Ring */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={stats.progress >= 90 && stats.progress <= 110 ? '#22c55e' : stats.progress < 80 ? '#eab308' : '#ef4444'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - Math.min(stats.progress, 100) / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${progressColor}`}>
              {Math.round(stats.progress)}%
            </span>
            <span className="text-xs text-gray-500">of goal</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Total Consumed</p>
          <p className="text-lg font-bold text-gray-900">
            {stats.totalCalories.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-1">kcal</span>
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Daily Average</p>
          <p className="text-lg font-bold text-gray-900">
            {Math.round(stats.avgDaily).toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-1">kcal</span>
          </p>
        </div>
      </div>

      {/* Variance Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Daily variance from goal</span>
          <div className={`flex items-center ${stats.variance > 0 ? 'text-red-600' : stats.variance < -200 ? 'text-yellow-600' : 'text-green-600'}`}>
            {stats.variance > 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            <span className="font-medium">
              {stats.variance > 0 ? '+' : ''}{Math.round(stats.variance)} kcal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
