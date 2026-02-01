/**
 * Meal Type Breakdown Component
 * Shows distribution of calories across meal types
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

interface MealTypeBreakdownProps {
  dailyStats: DailyStats | null;
  isLoading?: boolean;
}

/**
 * Meal type colors and icons
 */
const MEAL_TYPE_CONFIG = {
  breakfast: { color: '#f59e0b', icon: '🌅', labelKey: 'meals:mealTypes.breakfast' },
  lunch: { color: '#f97316', icon: '☀️', labelKey: 'meals:mealTypes.lunch' },
  dinner: { color: '#8b5cf6', icon: '🌙', labelKey: 'meals:mealTypes.dinner' },
  snack: { color: '#22c55e', icon: '🍎', labelKey: 'meals:mealTypes.snack' },
  unknown: { color: '#6b7280', icon: '🍽️', labelKey: 'meals:mealTypes.unknown' },
};

/**
 * Custom tooltip
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-gray-900">
        {data.icon} {data.label}
      </p>
      <p className="text-lg font-bold" style={{ color: data.color }}>
        {data.calories.toLocaleString()} kcal
      </p>
      <p className="text-xs text-gray-500">
        {data.count} meal{data.count !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

/**
 * Meal type breakdown chart
 */
export function MealTypeBreakdown({ dailyStats, isLoading }: MealTypeBreakdownProps) {
  const { t } = useTranslation('stats');
  
  const chartData = useMemo(() => {
    if (!dailyStats?.meal_breakdown) {
      return Object.entries(MEAL_TYPE_CONFIG).map(([type, config]) => ({
        type,
        ...config,
        label: t(config.labelKey),
        calories: 0,
        count: 0,
      }));
    }

    return Object.entries(MEAL_TYPE_CONFIG).map(([type, config]) => {
      const breakdown = dailyStats.meal_breakdown[type as keyof typeof dailyStats.meal_breakdown];
      return {
        type,
        ...config,
        label: t(config.labelKey),
        calories: Number(breakdown?.calories) || 0,
        count: breakdown?.count || 0,
      };
    }).filter(item => item.calories > 0 || item.count > 0);
  }, [dailyStats, t]);

  const totalCalories = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.calories, 0);
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('charts.mealTypeBreakdown')}</h3>
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">{t('charts.loading')}</div>
        </div>
      </div>
    );
  }

  const hasData = chartData.some(d => d.calories > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('charts.mealTypeBreakdown')}</h3>
      
      {!hasData ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          {t('charts.noData')}
        </div>
      ) : (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                />
                <YAxis 
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  width={65}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="calories" 
                  radius={[0, 4, 4, 0]}
                  maxBarSize={25}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100">
            {chartData.filter(d => d.calories > 0).map((item) => (
              <div key={item.type} className="text-center">
                <span className="text-lg">{item.icon}</span>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-sm font-bold" style={{ color: item.color }}>
                  {Math.round((item.calories / totalCalories) * 100)}%
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
