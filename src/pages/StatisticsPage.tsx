/**
 * Statistics Page
 * Comprehensive analytics for understanding eating patterns
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronLeft, 
  ChevronRight,
  Flame,
  Utensils,
  Target,
  BarChart3,
  CalendarDays,
} from 'lucide-react';
import { useMealStore } from '../stores/mealStore';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { 
  DailyNutritionChart, 
  WeeklyCalorieTrend, 
  MacroDistributionChart,
  MealPatternChart,
  CalorieGoalProgress,
  MealTypeBreakdown,
  WeekdayComparison,
} from '../components/charts';
import { MealHistoryList } from '../components/stats/MealHistoryList';
import { formatDate } from '../utils';

type TimePeriod = 'day' | 'week' | 'month';

/**
 * Get week string in YYYY-WNN format
 */
function getWeekString(date: Date): string {
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Get month string in YYYY-MM format
 */
function getMonthString(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

/**
 * Statistics page component
 */
export function StatisticsPage() {
  const { t } = useTranslation('stats');
  const {
    dailyStats,
    weeklyStats,
    monthlyStats,
    isLoading,
    fetchDailyStats,
    fetchWeeklyStats,
    fetchMonthlyStats,
  } = useMealStore();

  // State for period selection
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calculate period strings
  const dateString = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const weekString = useMemo(() => {
    return getWeekString(selectedDate);
  }, [selectedDate]);

  const monthString = useMemo(() => {
    return getMonthString(selectedDate);
  }, [selectedDate]);

  // Fetch data based on period
  useEffect(() => {
    if (period === 'day') {
      fetchDailyStats(dateString);
    } else if (period === 'week') {
      fetchWeeklyStats(weekString);
      fetchDailyStats(dateString); // Also fetch daily for detailed view
    } else {
      fetchMonthlyStats(monthString);
      fetchWeeklyStats(weekString);
    }
  }, [period, dateString, weekString, monthString, fetchDailyStats, fetchWeeklyStats, fetchMonthlyStats]);

  // Navigation handlers
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    const delta = direction === 'prev' ? -1 : 1;

    if (period === 'day') {
      newDate.setDate(newDate.getDate() + delta);
    } else if (period === 'week') {
      newDate.setDate(newDate.getDate() + (delta * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + delta);
    }

    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Period display text
  const periodDisplayText = useMemo(() => {
    if (period === 'day') {
      return formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } else if (period === 'week') {
      if (weeklyStats) {
        return `${formatDate(weeklyStats.week_start, { month: 'short', day: 'numeric' })} - ${formatDate(weeklyStats.week_end, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      return weekString;
    } else {
      if (monthlyStats) {
        return `${monthlyStats.month_name} ${monthlyStats.year}`;
      }
      return monthString;
    }
  }, [period, selectedDate, weekString, monthString, weeklyStats, monthlyStats]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (period === 'day' && dailyStats) {
      return {
        totalCalories: Number(dailyStats.total_calories) || 0,
        mealCount: dailyStats.meal_count || 0,
        avgCaloriesPerMeal: dailyStats.meal_count > 0 
          ? (Number(dailyStats.total_calories) || 0) / dailyStats.meal_count 
          : 0,
        protein: Number(dailyStats.macros?.protein) || 0,
        carbs: Number(dailyStats.macros?.carbs) || 0,
        fat: Number(dailyStats.macros?.fat) || 0,
      };
    } else if (period === 'week' && weeklyStats) {
      return {
        totalCalories: Number(weeklyStats.total_calories) || 0,
        mealCount: weeklyStats.meal_count || 0,
        avgCaloriesPerDay: Number(weeklyStats.average_daily_calories) || 0,
        avgCaloriesPerMeal: weeklyStats.meal_count > 0 
          ? (Number(weeklyStats.total_calories) || 0) / weeklyStats.meal_count 
          : 0,
      };
    } else if (period === 'month' && monthlyStats) {
      return {
        totalCalories: Number(monthlyStats.total_calories) || 0,
        mealCount: monthlyStats.meal_count || 0,
        avgCaloriesPerDay: Number(monthlyStats.average_daily_calories) || 0,
        daysInMonth: monthlyStats.days_in_month || 30,
      };
    }
    return null;
  }, [period, dailyStats, weeklyStats, monthlyStats]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-primary-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                {t('title')}
              </h1>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              {t('backToDashboard')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Period Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Period Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['day', 'week', 'month'] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t(`period.${p === 'day' ? 'daily' : p === 'week' ? 'weekly' : 'monthly'}`)}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigatePeriod('prev')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Previous period"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="min-w-[200px] text-center">
                <span className="font-medium text-gray-900">{periodDisplayText}</span>
              </div>
              
              <button
                onClick={() => navigatePeriod('next')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Next period"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="ml-2"
              >
                {t('period.today')}
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <SummaryCard
                icon={<Flame className="w-5 h-5" />}
                label={t('summary.totalCalories')}
                value={summaryStats?.totalCalories?.toLocaleString() || '0'}
                unit={t('summary.kcal')}
                color="red"
              />
              <SummaryCard
                icon={<Utensils className="w-5 h-5" />}
                label={t('summary.mealsLogged')}
                value={summaryStats?.mealCount?.toString() || '0'}
                unit={t('summary.meals')}
                color="blue"
              />
              <SummaryCard
                icon={<Target className="w-5 h-5" />}
                label={period === 'day' ? t('summary.calPerMeal') : t('summary.dailyAverage')}
                value={
                  period === 'day'
                    ? Math.round(summaryStats?.avgCaloriesPerMeal || 0).toLocaleString()
                    : Math.round(summaryStats?.avgCaloriesPerDay || summaryStats?.avgCaloriesPerMeal || 0).toLocaleString()
                }
                unit={t('summary.kcal')}
                color="green"
              />
              <SummaryCard
                icon={<CalendarDays className="w-5 h-5" />}
                label={period === 'month' ? t('summary.daysInMonth') : t('summary.tracking')}
                value={
                  period === 'month' 
                    ? summaryStats?.daysInMonth?.toString() || '30'
                    : period === 'week' ? '7' : '1'
                }
                unit={t('summary.days')}
                color="purple"
              />
            </div>

            {/* Charts Section */}
            {period === 'day' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <DailyNutritionChart stats={dailyStats} />
                <MacroDistributionChart 
                  macros={dailyStats?.macros} 
                  title="Today's Macros"
                />
              </div>
            )}

            {period === 'week' && (
              <>
                <div className="mb-6">
                  <WeeklyCalorieTrend stats={weeklyStats} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <MealPatternChart weeklyStats={weeklyStats} />
                  <WeekdayComparison weeklyStats={weeklyStats} />
                </div>
              </>
            )}

            {period === 'month' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <CalorieGoalProgress 
                  monthlyStats={monthlyStats}
                  dailyGoal={2000}
                />
                <MealTypeBreakdown dailyStats={dailyStats} />
              </div>
            )}

            {/* Meal History */}
            {period === 'day' && dailyStats?.meals && (
              <MealHistoryList 
                meals={dailyStats.meals} 
                title={`Meals on ${formatDate(selectedDate, { month: 'short', day: 'numeric' })}`}
              />
            )}

            {/* Insights Section */}
            <InsightsPanel 
              period={period}
              dailyStats={dailyStats}
              weeklyStats={weeklyStats}
              monthlyStats={monthlyStats}
            />
          </>
        )}
      </main>
    </div>
  );
}

/**
 * Summary card component
 */
interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: 'red' | 'blue' | 'green' | 'purple' | 'yellow';
}

function SummaryCard({ icon, label, value, unit, color }: SummaryCardProps) {
  const colorClasses = {
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">
            {value}
            <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Insights panel with actionable recommendations
 */
interface InsightsPanelProps {
  period: TimePeriod;
  dailyStats: any;
  weeklyStats: any;
  monthlyStats: any;
}

function InsightsPanel({ period, dailyStats, weeklyStats, monthlyStats }: InsightsPanelProps) {
  const { t } = useTranslation('stats');
  
  const insights = useMemo(() => {
    const items: { type: 'positive' | 'negative' | 'neutral'; text: string }[] = [];

    if (period === 'day' && dailyStats) {
      const calories = Number(dailyStats.total_calories) || 0;
      const protein = Number(dailyStats.macros?.protein) || 0;
      const mealCount = dailyStats.meal_count || 0;

      if (calories < 1500) {
        items.push({ type: 'negative', text: t('insights.lowCalories') });
      } else if (calories > 2500) {
        items.push({ type: 'neutral', text: t('insights.highCalories') });
      } else {
        items.push({ type: 'positive', text: t('insights.goodBalance') });
      }

      if (protein < 40) {
        items.push({ type: 'negative', text: t('insights.lowProtein') });
      } else if (protein >= 50) {
        items.push({ type: 'positive', text: t('insights.goodProtein') });
      }

      if (mealCount < 3) {
        items.push({ type: 'neutral', text: t('insights.fewMeals', { count: mealCount }) });
      }
    }

    if (period === 'week' && weeklyStats) {
      const avgCalories = Number(weeklyStats.average_daily_calories) || 0;
      const mealCount = weeklyStats.meal_count || 0;

      if (avgCalories >= 1800 && avgCalories <= 2200) {
        items.push({ type: 'positive', text: t('insights.consistentWeek') });
      }

      if (mealCount >= 18) {
        items.push({ type: 'positive', text: t('insights.greatLogging') });
      } else if (mealCount < 14) {
        items.push({ type: 'neutral', text: t('insights.logMore') });
      }
    }

    if (period === 'month' && monthlyStats) {
      const avgCalories = Number(monthlyStats.average_daily_calories) || 0;
      
      if (avgCalories >= 1800 && avgCalories <= 2200) {
        items.push({ type: 'positive', text: t('insights.steadyMonth') });
      }
    }

    if (items.length === 0) {
      items.push({ type: 'neutral', text: t('insights.keepLogging') });
    }

    return items;
  }, [period, dailyStats, weeklyStats, monthlyStats, t]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
        {t('insights.title')}
      </h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`flex items-start space-x-3 p-3 rounded-lg ${
              insight.type === 'positive' ? 'bg-green-50' :
              insight.type === 'negative' ? 'bg-red-50' : 'bg-gray-50'
            }`}
          >
            {insight.type === 'positive' ? (
              <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : insight.type === 'negative' ? (
              <TrendingDown className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Minus className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${
              insight.type === 'positive' ? 'text-green-800' :
              insight.type === 'negative' ? 'text-red-800' : 'text-gray-700'
            }`}>
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
