/**
 * Weekday Comparison Chart Component
 * Compares calorie intake across different days of the week
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { WeeklyStats } from '../../types';

interface WeekdayComparisonProps {
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
      <p className="text-lg font-bold text-primary-600">
        {data.calories.toLocaleString()} kcal
      </p>
    </div>
  );
}

/**
 * Weekday comparison radar chart
 */
export function WeekdayComparison({ weeklyStats, isLoading }: WeekdayComparisonProps) {
  const { t } = useTranslation('stats');
  
  const chartData = useMemo(() => {
    if (!weeklyStats?.daily_breakdown) {
      return [];
    }

    return Object.entries(weeklyStats.daily_breakdown)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        day: data.day_name?.substring(0, 3) || date.substring(8, 10),
        fullDay: data.day_name || date,
        calories: Number(data.calories) || 0,
      }));
  }, [weeklyStats]);

  const avgCalories = useMemo(() => {
    if (!weeklyStats) return 0;
    return Number(weeklyStats.average_daily_calories) || 0;
  }, [weeklyStats]);

  const maxCalories = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.calories), avgCalories);
    return Math.ceil(max / 500) * 500 + 500;
  }, [chartData, avgCalories]);

  // Calculate weekday vs weekend averages
  const weekdayVsWeekend = useMemo(() => {
    if (chartData.length === 0) return { weekday: 0, weekend: 0 };
    
    // Assuming Mon-Fri are first 5, Sat-Sun are last 2
    const weekdayDays = chartData.slice(0, 5);
    const weekendDays = chartData.slice(5, 7);
    
    const weekdayTotal = weekdayDays.reduce((sum, d) => sum + d.calories, 0);
    const weekendTotal = weekendDays.reduce((sum, d) => sum + d.calories, 0);
    
    return {
      weekday: weekdayDays.length > 0 ? weekdayTotal / weekdayDays.length : 0,
      weekend: weekendDays.length > 0 ? weekendTotal / weekendDays.length : 0,
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('charts.weekdayComparison')}</h3>
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">{t('charts.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('charts.weekdayComparison')}</h3>
      
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          {t('charts.noData')}
        </div>
      ) : (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, maxCalories]}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                />
                <Tooltip content={<CustomTooltip />} />
                <Radar
                  name="Calories"
                  dataKey="calories"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekday vs Weekend Comparison */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Weekday Avg</p>
              <p className="text-lg font-bold text-gray-900">
                {Math.round(weekdayVsWeekend.weekday).toLocaleString()}
                <span className="text-sm font-normal text-gray-500 ml-1">kcal</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Weekend Avg</p>
              <p className="text-lg font-bold text-gray-900">
                {Math.round(weekdayVsWeekend.weekend).toLocaleString()}
                <span className="text-sm font-normal text-gray-500 ml-1">kcal</span>
              </p>
            </div>
          </div>

          {weekdayVsWeekend.weekend > weekdayVsWeekend.weekday * 1.1 && (
            <p className="text-xs text-center text-yellow-600 mt-2">
              ⚠️ You tend to eat more on weekends
            </p>
          )}
        </>
      )}
    </div>
  );
}
