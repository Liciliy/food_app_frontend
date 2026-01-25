/**
 * Dashboard Page
 * Main application dashboard with voice recording and meal tracking
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMealStore } from '../stores/mealStore';
import { Button } from '../components/common/Button';
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
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🍽️ Food Tracker
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link to="/statistics">
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistics
                </Button>
              </Link>
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.first_name || user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                isLoading={authLoading}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Stats */}
        <section className="mb-6">
          <DashboardStats />
        </section>

        {/* Charts Section */}
        <section className="mb-6">
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
        <section className="mb-6">
          <WeeklyCalorieTrend stats={weeklyStats} isLoading={statsLoading} />
        </section>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Day Timeline */}
          <section>
            <DayTimeline 
              meals={dailyStats?.meals || []} 
              isLoading={statsLoading} 
            />
          </section>

          {/* Voice Recorder */}
          <section>
            <VoiceRecorder />
          </section>

          {/* Recent Meals */}
          <section>
            <RecentMeals limit={5} />
          </section>
        </div>
      </main>
    </div>
  );
}
