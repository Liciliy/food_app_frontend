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
  FileText,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock3,
} from 'lucide-react';
import { useMealStore } from '../stores/mealStore';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { MealService } from '../services/mealService';
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
import type {
  GeneratedNutritionReportDetail,
  GeneratedNutritionReportSummary,
  NutritionReportData,
  NutritionReportFlag,
  NutrientTotal,
} from '../types';

type TimePeriod = 'day' | 'week' | 'month';
type StatsView = 'analytics' | 'reports';

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
  const [view, setView] = useState<StatsView>('analytics');
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reportData, setReportData] = useState<NutritionReportData | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [generatedReports, setGeneratedReports] = useState<GeneratedNutritionReportSummary[]>([]);
  const [generatedReportsCount, setGeneratedReportsCount] = useState(0);
  const [generatedReportsLoading, setGeneratedReportsLoading] = useState(false);
  const [unreadReportsCount, setUnreadReportsCount] = useState(0);
  const [selectedGeneratedReport, setSelectedGeneratedReport] = useState<GeneratedNutritionReportDetail | null>(null);
  const [selectedGeneratedReportId, setSelectedGeneratedReportId] = useState<number | null>(null);
  const [generatedReportLoading, setGeneratedReportLoading] = useState(false);
  const [generatedReportError, setGeneratedReportError] = useState<string | null>(null);

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
    if (view !== 'analytics') return;

    if (period === 'day') {
      fetchDailyStats(dateString);
    } else if (period === 'week') {
      fetchWeeklyStats(weekString);
      fetchDailyStats(dateString); // Also fetch daily for detailed view
    } else {
      fetchMonthlyStats(monthString);
      fetchWeeklyStats(weekString);
    }
  }, [view, period, dateString, weekString, monthString, fetchDailyStats, fetchWeeklyStats, fetchMonthlyStats]);

  useEffect(() => {
    let isMounted = true;

    const loadUnreadCount = async () => {
      try {
        const response = await MealService.getGeneratedReports({ unread_only: true, page_size: 10 });
        if (isMounted) {
          setUnreadReportsCount(response.count);
        }
      } catch {
        // Leave badge unchanged on polling errors.
      }
    };

    loadUnreadCount();

    const intervalId = window.setInterval(loadUnreadCount, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (view !== 'reports') return;

    let isMounted = true;

    const loadReport = async () => {
      setReportsLoading(true);
      setReportsError(null);

      try {
        const response = period === 'day'
          ? await MealService.getDailyReport(dateString)
          : period === 'week'
          ? await MealService.getWeeklyReport(weekString)
          : await MealService.getMonthlyReport(monthString);

        if (isMounted) {
          setReportData(response);
        }
      } catch (error) {
        if (isMounted) {
          setReportsError((error as { detail?: string }).detail || t('reports.errors.loadCurrent'));
        }
      } finally {
        if (isMounted) {
          setReportsLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [view, period, dateString, weekString, monthString, t]);

  useEffect(() => {
    if (view !== 'reports') return;

    let isMounted = true;

    const loadGeneratedReports = async () => {
      setGeneratedReportsLoading(true);

      try {
        const response = await MealService.getGeneratedReports({ page_size: 10 });
        if (isMounted) {
          setGeneratedReports(response.results);
          setGeneratedReportsCount(response.count);
          setUnreadReportsCount((current) => Math.max(current, response.results.filter((report) => !report.is_read).length));
        }
      } catch (error) {
        if (isMounted) {
          setGeneratedReportError((error as { detail?: string }).detail || t('reports.errors.loadGenerated'));
        }
      } finally {
        if (isMounted) {
          setGeneratedReportsLoading(false);
        }
      }
    };

    loadGeneratedReports();

    return () => {
      isMounted = false;
    };
  }, [view, t]);

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

  const openGeneratedReport = async (reportId: number, isUnread?: boolean) => {
    setGeneratedReportLoading(true);
    setGeneratedReportError(null);
    setSelectedGeneratedReportId(reportId);

    try {
      const detail = await MealService.getGeneratedReportDetail(reportId);
      setSelectedGeneratedReport(detail);

      if (isUnread) {
        await MealService.markGeneratedReportRead(reportId);
        setGeneratedReports((current) => current.map((report) => (
          report.id === reportId ? { ...report, is_read: true } : report
        )));
        setSelectedGeneratedReport((current) => current ? { ...current, is_read: true } : current);
        setUnreadReportsCount((current) => Math.max(0, current - 1));
      }
    } catch (error) {
      setGeneratedReportError((error as { detail?: string }).detail || t('reports.errors.loadDetail'));
    } finally {
      setGeneratedReportLoading(false);
    }
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
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['analytics', 'reports'] as StatsView[]).map((entry) => (
                <button
                  key={entry}
                  onClick={() => setView(entry)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === entry
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {entry === 'analytics' ? t('navigation.analytics') : t('navigation.reports')}
                  {entry === 'reports' && unreadReportsCount > 0 && (
                    <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {unreadReportsCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

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

        {view === 'analytics' && isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : view === 'analytics' ? (
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
        ) : (
          <div className="space-y-6">
            <CurrentReportPanel
              reportData={reportData}
              isLoading={reportsLoading}
              error={reportsError}
              period={period}
            />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <GeneratedReportsList
                reports={generatedReports}
                count={generatedReportsCount}
                isLoading={generatedReportsLoading}
                selectedReportId={selectedGeneratedReportId}
                onOpen={openGeneratedReport}
                error={generatedReportError}
              />
              <GeneratedReportDetailPanel
                report={selectedGeneratedReport}
                isLoading={generatedReportLoading}
                error={generatedReportError}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CurrentReportPanel({
  reportData,
  isLoading,
  error,
  period,
}: {
  reportData: NutritionReportData | null;
  isLoading: boolean;
  error: string | null;
  period: TimePeriod;
}) {
  const { t } = useTranslation('stats');

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('reports.currentTitle')}</h2>
          <p className="text-sm text-gray-500">{t(`reports.periodDescriptions.${period}`)}</p>
        </div>
        <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
          <FileText className="h-5 w-5" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : !reportData ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">{t('reports.empty')}</div>
      ) : reportData.report_available === false ? (
        <ReportPlaceholderCard reportData={reportData} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <ReportMetric label={t('reports.summary.calories')} value={`${Math.round(Number(reportData.total_calories) || 0)}`} />
            <ReportMetric label={t('reports.summary.meals')} value={`${reportData.meal_count || 0}`} />
            <ReportMetric label={t('reports.summary.protein')} value={formatReportMacro(reportData.macros?.protein)} />
            <ReportMetric label={t('reports.summary.context')} value={reportData.health_context ? t('reports.summary.applied') : t('reports.summary.none')} />
          </div>

          <LoggingCoverageNotice reportData={reportData} />

          <ReportFlagList flags={reportData.report?.flags || []} />
          <ReportNarrativeCard reportData={reportData} />

          <div className="grid gap-6 lg:grid-cols-2">
            <NutrientTotalsCard nutrientTotals={reportData.nutrient_totals || null} />
            <HealthContextCard reportData={reportData} />
          </div>
        </div>
      )}
    </section>
  );
}

function GeneratedReportsList({
  reports,
  count,
  isLoading,
  selectedReportId,
  onOpen,
  error,
}: {
  reports: GeneratedNutritionReportSummary[];
  count: number;
  isLoading: boolean;
  selectedReportId: number | null;
  onOpen: (reportId: number, isUnread?: boolean) => Promise<void>;
  error: string | null;
}) {
  const { t } = useTranslation('stats');

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('reports.generatedTitle')}</h2>
          <p className="text-sm text-gray-500">{t('reports.generatedCount', { count })}</p>
        </div>
        <BellRing className="h-5 w-5 text-gray-400" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : reports.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">{t('reports.generatedEmpty')}</div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => onOpen(report.id, !report.is_read)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                selectedReportId === report.id
                  ? 'border-primary-300 bg-primary-50'
                  : report.is_read
                  ? 'border-gray-200 bg-white hover:bg-gray-50'
                  : 'border-amber-200 bg-amber-50 hover:bg-amber-100/70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{report.title || t('reports.generatedFallbackTitle')}</p>
                  <p className="mt-1 text-xs text-gray-500">{report.period_label || report.report_type || t('reports.generatedUnknownPeriod')}</p>
                </div>
                {!report.is_read && (
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                    {t('reports.unread')}
                  </span>
                )}
              </div>
              {report.report_preview && (
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">{report.report_preview}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function GeneratedReportDetailPanel({
  report,
  isLoading,
  error,
}: {
  report: GeneratedNutritionReportDetail | null;
  isLoading: boolean;
  error: string | null;
}) {
  const { t } = useTranslation('stats');

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('reports.detailTitle')}</h2>
          <p className="text-sm text-gray-500">{report?.title || t('reports.detailPlaceholder')}</p>
        </div>
        {report?.is_read && <CheckCircle2 className="h-5 w-5 text-green-600" />}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : !report?.report_payload ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">{t('reports.detailEmpty')}</div>
      ) : (
        <div className="space-y-6">
          <LoggingCoverageNotice reportData={report.report_payload} />
          <ReportFlagList flags={report.report_payload.report?.flags || []} />
          <ReportNarrativeCard reportData={report.report_payload} />
          <div className="grid gap-6 lg:grid-cols-2">
            <NutrientTotalsCard nutrientTotals={report.report_payload.nutrient_totals || null} />
            <HealthContextCard reportData={report.report_payload} />
          </div>
        </div>
      )}
    </section>
  );
}

function ReportPlaceholderCard({ reportData }: { reportData: NutritionReportData }) {
  const { t } = useTranslation('stats');
  const reason = reportData.placeholder?.reason;
  const isNoMeals = reason === 'no_logged_meals';

  return (
    <div className={`rounded-xl border px-5 py-6 ${isNoMeals ? 'border-gray-200 bg-gray-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start gap-3">
        {isNoMeals ? <Info className="mt-0.5 h-5 w-5 text-gray-500" /> : <Clock3 className="mt-0.5 h-5 w-5 text-amber-600" />}
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {isNoMeals ? t('reports.placeholder.noMealsTitle') : t('reports.placeholder.waitingTitle')}
          </h3>
          <p className="mt-2 text-sm text-gray-700">
            {reportData.placeholder?.message || (isNoMeals ? t('reports.placeholder.noMealsMessage') : t('reports.placeholder.waitingMessage'))}
          </p>
          {(reportData.period_start || reportData.period_end) && (
            <p className="mt-2 text-xs text-gray-500">
              {t('reports.placeholder.period', {
                start: reportData.period_start || '-',
                end: reportData.period_end || '-',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LoggingCoverageNotice({ reportData }: { reportData: NutritionReportData }) {
  const { t } = useTranslation('stats');
  const missingDaysCount = reportData.logging_coverage?.missing_days_count || 0;
  const missingWeekKeys = reportData.logging_coverage?.missing_week_keys || [];

  if (missingDaysCount <= 0 && missingWeekKeys.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div className="space-y-1">
          {missingDaysCount > 0 && (
            <p>{t('reports.loggingCoverage.missingDays', { count: missingDaysCount })}</p>
          )}
          {missingWeekKeys.length > 0 && (
            <p>{t('reports.loggingCoverage.missingWeeks', { count: missingWeekKeys.length, weeks: missingWeekKeys.join(', ') })}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function ReportFlagList({ flags }: { flags: NutritionReportFlag[] }) {
  const { t } = useTranslation('stats');

  if (flags.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
        {t('reports.noFlags')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900">{t('reports.flagsTitle')}</h3>
      {flags.map((flag, index) => {
        const severity = flag.severity || 'low';
        const severityClasses = severity === 'high'
          ? 'border-red-200 bg-red-50 text-red-800'
          : severity === 'medium'
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-sky-200 bg-sky-50 text-sky-800';

        return (
          <div key={`${flag.type}-${flag.nutrient_code || index}`} className={`rounded-xl border px-4 py-3 ${severityClasses}`}>
            <div className="flex items-start gap-3">
              {severity === 'high' ? <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" /> : <Info className="mt-0.5 h-5 w-5 flex-shrink-0" />}
              <div>
                <p className="font-medium">{flag.message}</p>
                {flag.recommendation && <p className="mt-1 text-sm">{flag.recommendation}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReportNarrativeCard({ reportData }: { reportData: NutritionReportData }) {
  const { t } = useTranslation('stats');
  const summary = reportData.report?.llm_summary;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
      <h3 className="text-base font-semibold text-gray-900">{t('reports.narrativeTitle')}</h3>
      <p className="mt-2 text-sm text-gray-700">{summary?.summary || t('reports.narrativeEmpty')}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <NarrativeList title={t('reports.risks')} items={summary?.risks || []} />
        <NarrativeList title={t('reports.recommendations')} items={summary?.recommendations || []} />
        <NarrativeList title={t('reports.followUp')} items={summary?.follow_up || []} />
      </div>
      {reportData.report?.disclaimer && (
        <p className="mt-4 text-xs text-gray-500">{reportData.report.disclaimer}</p>
      )}
    </div>
  );
}

function NarrativeList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">-</p>
      ) : (
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <p key={item} className="text-sm text-gray-600">{item}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function NutrientTotalsCard({ nutrientTotals }: { nutrientTotals: Record<string, NutrientTotal> | null }) {
  const { t } = useTranslation('stats');
  const entries = nutrientTotals ? Object.entries(nutrientTotals) : [];

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900">{t('reports.nutrientTotalsTitle')}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{t('reports.nutrientTotalsEmpty')}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.slice(0, 8).map(([code, nutrient]) => (
            <div key={code} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-700">{nutrient.name}</span>
              <span className="font-medium text-gray-900">{formatNutrientAmount(nutrient.amount, nutrient.unit)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HealthContextCard({ reportData }: { reportData: NutritionReportData }) {
  const { t } = useTranslation('stats');

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900">{t('reports.healthContextTitle')}</h3>
      {reportData.health_context ? (
        <>
          <p className="mt-3 text-sm text-gray-700">{reportData.health_context}</p>
          {reportData.health_context_applied_at && (
            <p className="mt-2 text-xs text-gray-500">{t('reports.healthContextAppliedAt', { date: reportData.health_context_applied_at })}</p>
          )}
          {reportData.health_context_structured?.profile_summary && (
            <div className="mt-4 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-700">
              {reportData.health_context_structured.profile_summary}
            </div>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-gray-500">{t('reports.healthContextEmpty')}</p>
      )}
    </div>
  );
}

function formatReportMacro(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `${Number(value).toFixed(1)}g`;
}

function formatNutrientAmount(amount: number, unit: string): string {
  return `${amount.toFixed(1)} ${unit}`;
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
