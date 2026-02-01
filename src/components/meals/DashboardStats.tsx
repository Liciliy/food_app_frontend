/**
 * Dashboard Stats Component
 * Displays quick overview stats for today, this week, and this month
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Calendar, TrendingUp, UtensilsCrossed } from 'lucide-react';
import { useMealStore } from '../../stores/mealStore';
import { formatCalories } from '../../utils';

/**
 * Stat card component
 */
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs opacity-70 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard stats component
 */
export function DashboardStats() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { dashboardData, isLoading, fetchDashboard } = useMealStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading && !dashboardData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <p className="text-gray-500">{t('common:unableToLoad')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title={t('stats.todayCalories')}
        value={formatCalories(dashboardData.today.calories)}
        subtitle={t('stats.mealsLogged', { count: dashboardData.today.meal_count })}
        icon={<Flame className="w-6 h-6" />}
        color="orange"
      />
      
      <StatCard
        title={t('stats.todayMeals')}
        value={dashboardData.today.meal_count}
        subtitle={dashboardData.today.date}
        icon={<UtensilsCrossed className="w-6 h-6" />}
        color="blue"
      />
      
      <StatCard
        title={t('common:thisWeek')}
        value={formatCalories(dashboardData.this_week.calories)}
        subtitle={`${formatCalories(dashboardData.this_week.average_daily_calories)} ${t('stats.perDay')}`}
        icon={<Calendar className="w-6 h-6" />}
        color="green"
      />
      
      <StatCard
        title={t('common:thisMonth')}
        value={formatCalories(dashboardData.this_month.calories)}
        subtitle={t('stats.totalMeals', { count: dashboardData.this_month.meal_count })}
        icon={<TrendingUp className="w-6 h-6" />}
        color="purple"
      />
    </div>
  );
}