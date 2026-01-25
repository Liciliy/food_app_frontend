/**
 * Weekly Calorie Trend Chart Component
 * Displays calorie intake over the past week as a line chart
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { WeeklyStats } from '../../types';

interface WeeklyCalorieTrendProps {
  stats: WeeklyStats | null;
  isLoading?: boolean;
}

/**
 * Custom tooltip for the chart
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-gray-900">{data.dayName}</p>
      <p className="text-sm text-gray-600">{data.fullDate}</p>
      <div className="mt-2">
        <p className="text-lg font-bold text-primary-600">
          {data.calories.toLocaleString()} kcal
        </p>
        <p className="text-xs text-gray-500">
          {data.mealCount} meal{data.mealCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

/**
 * Weekly calorie trend line chart
 * Shows daily calorie intake for the week with average reference line
 */
export function WeeklyCalorieTrend({ stats, isLoading }: WeeklyCalorieTrendProps) {
  const chartData = useMemo(() => {
    if (!stats?.daily_breakdown) {
      // Return empty week with day labels
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((day) => ({
        day,
        dayName: day,
        fullDate: '',
        calories: 0,
        mealCount: 0,
      }));
    }

    // Convert daily_breakdown object to array sorted by date
    const entries = Object.entries(stats.daily_breakdown);
    
    return entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        day: data.day_name?.substring(0, 3) || date.substring(8, 10),
        dayName: data.day_name || date,
        fullDate: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        calories: Number(data.calories) || 0,
        mealCount: data.meal_count || 0,
      }));
  }, [stats]);

  const averageCalories = useMemo(() => {
    if (!stats) return 0;
    return Number(stats.average_daily_calories) || 0;
  }, [stats]);

  const maxCalories = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.calories), averageCalories);
    return Math.ceil(max / 500) * 500 + 500; // Round up to nearest 500 + buffer
  }, [chartData, averageCalories]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Calorie Trend</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Weekly Calorie Trend</h3>
        {stats && (
          <span className="text-sm text-gray-500">
            {new Date(stats.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' - '}
            {new Date(stats.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-900">
            {stats ? Number(stats.total_calories).toLocaleString() : '0'} kcal
          </p>
        </div>
        <div className="text-center p-2 bg-primary-50 rounded-lg">
          <p className="text-xs text-gray-500">Daily Avg</p>
          <p className="text-lg font-bold text-primary-600">
            {averageCalories.toLocaleString()} kcal
          </p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Meals</p>
          <p className="text-lg font-bold text-gray-900">
            {stats?.meal_count || 0}
          </p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              domain={[0, maxCalories]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={averageCalories} 
              stroke="#9ca3af" 
              strokeDasharray="5 5"
              label={{ 
                value: 'Avg', 
                position: 'right', 
                fill: '#9ca3af', 
                fontSize: 10 
              }}
            />
            <Line
              type="monotone"
              dataKey="calories"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
