/**
 * Daily Nutrition Chart Component
 * Displays today's calories and macros as a bar chart
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
import type { DailyStats } from '../../types';

interface DailyNutritionChartProps {
  stats: DailyStats | null;
  isLoading?: boolean;
}

/**
 * Color configuration for nutrition bars
 */
const NUTRITION_COLORS = {
  calories: '#ef4444', // Red
  protein: '#3b82f6',  // Blue
  carbs: '#eab308',    // Yellow
  fat: '#22c55e',      // Green
};

/**
 * Recommended daily values for reference
 */
const DAILY_TARGETS = {
  calories: 2000,
  protein: 50,
  carbs: 300,
  fat: 65,
};

/**
 * Custom tooltip for the chart
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const percentage = ((data.value / data.target) * 100).toFixed(0);

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-gray-900">{data.name}</p>
      <p className="text-sm text-gray-600">
        {data.value.toFixed(1)} {data.unit}
      </p>
      <p className="text-xs text-gray-500">
        {percentage}% of daily target ({data.target} {data.unit})
      </p>
    </div>
  );
}

/**
 * Daily nutrition bar chart
 * Shows calories, protein, carbs, and fat with progress toward daily targets
 */
export function DailyNutritionChart({ stats, isLoading }: DailyNutritionChartProps) {
  const chartData = useMemo(() => {
    if (!stats) {
      return [
        { name: 'Calories', value: 0, target: DAILY_TARGETS.calories, unit: 'kcal', color: NUTRITION_COLORS.calories },
        { name: 'Protein', value: 0, target: DAILY_TARGETS.protein, unit: 'g', color: NUTRITION_COLORS.protein },
        { name: 'Carbs', value: 0, target: DAILY_TARGETS.carbs, unit: 'g', color: NUTRITION_COLORS.carbs },
        { name: 'Fat', value: 0, target: DAILY_TARGETS.fat, unit: 'g', color: NUTRITION_COLORS.fat },
      ];
    }

    // Parse values as numbers (API returns strings)
    const calories = Number(stats.total_calories) || 0;
    const protein = Number(stats.macros?.protein) || 0;
    const carbs = Number(stats.macros?.carbs) || 0;
    const fat = Number(stats.macros?.fat) || 0;

    return [
      { name: 'Calories', value: calories, target: DAILY_TARGETS.calories, unit: 'kcal', color: NUTRITION_COLORS.calories },
      { name: 'Protein', value: protein, target: DAILY_TARGETS.protein, unit: 'g', color: NUTRITION_COLORS.protein },
      { name: 'Carbs', value: carbs, target: DAILY_TARGETS.carbs, unit: 'g', color: NUTRITION_COLORS.carbs },
      { name: 'Fat', value: fat, target: DAILY_TARGETS.fat, unit: 'g', color: NUTRITION_COLORS.fat },
    ];
  }, [stats]);

  // Calculate percentages for display
  const percentageData = useMemo(() => {
    return chartData.map(item => ({
      ...item,
      percentage: Math.min((item.value / item.target) * 100, 150), // Cap at 150% for display
    }));
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Nutrition</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Today's Nutrition</h3>
        <span className="text-sm text-gray-500">
          {stats?.date ? new Date(stats.date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }) : 'Today'}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {chartData.map((item) => (
          <div 
            key={item.name}
            className="text-center p-2 rounded-lg"
            style={{ backgroundColor: `${item.color}15` }}
          >
            <p className="text-xs text-gray-600">{item.name}</p>
            <p className="text-lg font-bold" style={{ color: item.color }}>
              {item.value.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">{item.unit}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={percentageData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              domain={[0, 150]} 
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="percentage" 
              radius={[0, 4, 4, 0]}
              maxBarSize={30}
            >
              {percentageData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
        <span>Target line at 100%</span>
      </div>
    </div>
  );
}
