/**
 * Meal Pattern Chart Component
 * Shows when meals are typically eaten during the week
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { WeeklyStats } from '../../types';

interface MealPatternChartProps {
  weeklyStats: WeeklyStats | null;
  isLoading?: boolean;
}

/**
 * Custom tooltip
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-gray-900">{data.fullDay}</p>
      <p className="text-sm text-primary-600 font-bold">
        {data.meals} meal{data.meals !== 1 ? 's' : ''}
      </p>
      <p className="text-xs text-gray-500">
        {data.calories.toLocaleString()} kcal
      </p>
    </div>
  );
}

/**
 * Meal pattern chart showing meals per day of week
 */
export function MealPatternChart({ weeklyStats, isLoading }: MealPatternChartProps) {
  const chartData = useMemo(() => {
    if (!weeklyStats?.daily_breakdown) {
      return [];
    }

    return Object.entries(weeklyStats.daily_breakdown)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        day: data.day_name?.substring(0, 3) || date.substring(8, 10),
        fullDay: data.day_name || date,
        meals: data.meal_count || 0,
        calories: Number(data.calories) || 0,
      }));
  }, [weeklyStats]);

  const maxMeals = useMemo(() => {
    return Math.max(...chartData.map(d => d.meals), 5);
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Meals per Day</h3>
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Meals per Day</h3>
      
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          No data available
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                domain={[0, maxMeals]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="meals" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.meals >= 3 ? '#22c55e' : entry.meals >= 2 ? '#eab308' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex justify-center gap-4 mt-4 text-xs">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          3+ meals
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          2 meals
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          0-1 meals
        </span>
      </div>
    </div>
  );
}
