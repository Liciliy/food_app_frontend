/**
 * Macro Distribution Chart Component
 * Displays macronutrient breakdown as a pie chart
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { Macros } from '../../types';

interface MacroDistributionChartProps {
  macros: Macros | null | undefined;
  isLoading?: boolean;
  title?: string;
}

/**
 * Color configuration for macros
 */
const MACRO_COLORS = {
  protein: '#3b82f6', // Blue
  carbs: '#eab308',   // Yellow
  fat: '#22c55e',     // Green
};

/**
 * Custom label for pie slices
 */
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null; // Don't show label for very small slices
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/**
 * Custom tooltip
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold" style={{ color: data.color }}>{data.name}</p>
      <p className="text-lg font-bold text-gray-900">{data.value.toFixed(1)}g</p>
      <p className="text-xs text-gray-500">{data.calories.toFixed(0)} kcal</p>
    </div>
  );
}

/**
 * Macro distribution pie chart
 * Shows protein, carbs, and fat as a donut chart
 */
export function MacroDistributionChart({ macros, isLoading, title }: MacroDistributionChartProps) {
  const { t } = useTranslation('stats');
  const displayTitle = title || t('charts.macroDistribution');
  
  const chartData = useMemo(() => {
    const protein = Number(macros?.protein) || 0;
    const carbs = Number(macros?.carbs) || 0;
    const fat = Number(macros?.fat) || 0;

    // Calculate calories from macros (protein: 4cal/g, carbs: 4cal/g, fat: 9cal/g)
    const proteinCals = protein * 4;
    const carbsCals = carbs * 4;
    const fatCals = fat * 9;

    return [
      { name: t('summary.protein'), value: protein, calories: proteinCals, color: MACRO_COLORS.protein },
      { name: t('summary.carbs'), value: carbs, calories: carbsCals, color: MACRO_COLORS.carbs },
      { name: t('summary.fat'), value: fat, calories: fatCals, color: MACRO_COLORS.fat },
    ];
  }, [macros, t]);

  const totalGrams = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const totalCalories = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.calories, 0);
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{displayTitle}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">{t('charts.loadingChart')}</div>
        </div>
      </div>
    );
  }

  const hasData = totalGrams > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{displayTitle}</h3>

      {!hasData ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-gray-400">{t('charts.noMacroData')}</p>
        </div>
      ) : (
        <>
          {/* Pie Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend / Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {chartData.map((item) => (
              <div 
                key={item.name}
                className="text-center p-2 rounded-lg"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
                <p className="text-sm font-bold" style={{ color: item.color }}>
                  {item.value.toFixed(0)}g
                </p>
                <p className="text-xs text-gray-500">
                  {item.calories.toFixed(0)} kcal
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="text-center mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{t('charts.total')}</p>
            <p className="text-lg font-bold text-gray-900">{totalCalories.toFixed(0)} {t('summary.kcal')}</p>
          </div>
        </>
      )}
    </div>
  );
}
