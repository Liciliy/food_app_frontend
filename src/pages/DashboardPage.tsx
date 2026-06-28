/**
 * Dashboard Page
 * Main application dashboard with voice recording and meal tracking
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, LogOut, UtensilsCrossed } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMealStore } from '../stores/mealStore';
import { Button } from '../components/common/Button';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { VoiceRecorder } from '../components/meals/VoiceRecorder';
import { DashboardStats } from '../components/meals/DashboardStats';
import { RecentMeals } from '../components/meals/RecentMeals';
import { DayTimeline } from '../components/meals/DayTimeline';
import { DailyNutritionChart, WeeklyCalorieTrend, MacroDistributionChart } from '../components/charts';

/**
 * Dashboard page component
 * Main hub for meal logging and statistics overview
 */
export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'auth']);
  const { user, logout, isLoading: authLoading } = useAuthStore();
  const { 
    dailyStats, 
    weeklyStats, 
    isLoading: statsLoading,
    fetchDailyStats,
    fetchWeeklyStats,
  } = useMealStore();

  // Fetch stats on mount
  useEffect(() => {
    fetchDailyStats();
    fetchWeeklyStats();
  }, [fetchDailyStats, fetchWeeklyStats]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h1 className="hidden truncate text-xl font-semibold text-gray-900 sm:block">
                {t('title')}
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher variant="buttons" className="shrink-0" />
              <Link to="/statistics">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 sm:px-3"
                  aria-label={t('statistics')}
                >
                  <BarChart3 className="w-4 h-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">{t('statistics')}</span>
                </Button>
              </Link>
              <span className="hidden text-sm text-gray-600 md:block">
                {user?.first_name || user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="px-2 sm:px-3"
                onClick={handleLogout}
                isLoading={authLoading}
                aria-label={t('auth:signOut')}
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">{t('auth:signOut')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-3 lg:px-8">
        {/* Voice Recorder */}
        <section className="lg:col-start-2 lg:row-start-4">
          <VoiceRecorder />
        </section>

        {/* Dashboard Stats */}
        <section className="lg:col-span-3 lg:row-start-1">
          <DashboardStats />
        </section>

        {/* Charts Section */}
        <section className="lg:col-span-3 lg:row-start-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Nutrition Chart (Calories, Protein, Carbs, Fat) */}
            <DailyNutritionChart stats={dailyStats} isLoading={statsLoading} />
            
            {/* Macro Distribution Pie Chart */}
            <MacroDistributionChart 
              macros={dailyStats?.macros} 
              isLoading={statsLoading} 
              title="Today's Macro Distribution"
            />
          </div>
        </section>

        {/* Weekly Trend */}
        <section className="lg:col-span-3 lg:row-start-3">
          <WeeklyCalorieTrend stats={weeklyStats} isLoading={statsLoading} />
        </section>

        {/* Day Timeline */}
        <section className="lg:col-start-1 lg:row-start-4">
          <DayTimeline 
            meals={dailyStats?.meals || []} 
            isLoading={statsLoading} 
          />
        </section>

        {/* Recent Meals */}
        <section className="lg:col-start-3 lg:row-start-4">
          <RecentMeals limit={5} />
        </section>
      </main>
    </div>
  );
}
