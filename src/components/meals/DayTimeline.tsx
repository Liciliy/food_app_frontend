/**
 * Day Timeline Component
 * Displays a vertical ruler showing today's meals at their corresponding times
 * with visual distinction between day/night periods
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Coffee, Sunrise, Sun, Sunset, Moon, X, Trash2, Loader2, Utensils, Flame } from 'lucide-react';
import type { Meal } from '../../types';
import { useMealStore } from '../../stores/mealStore';
import { formatTime, formatCalories, formatMacros } from '../../utils';
import { cn } from '../../utils';

/** Delete window in seconds (3 hours) */
const DELETE_WINDOW_SECONDS = 3 * 60 * 60;

interface DayTimelineProps {
  meals: Meal[];
  isLoading?: boolean;
}

interface TimelinePeriod {
  nameKey: string;
  start: number;
  end: number;
  icon: typeof Sun;
  bgColor: string;
  textColor: string;
}

// Softer color scheme for time periods
const TIME_PERIODS: TimelinePeriod[] = [
  {
    nameKey: 'timePeriods.night',
    start: 0,
    end: 6,
    icon: Moon,
    bgColor: 'bg-slate-200/50',
    textColor: 'text-slate-500',
  },
  {
    nameKey: 'timePeriods.morning',
    start: 6,
    end: 12,
    icon: Sunrise,
    bgColor: 'bg-amber-100/50',
    textColor: 'text-amber-700',
  },
  {
    nameKey: 'timePeriods.afternoon',
    start: 12,
    end: 18,
    icon: Sun,
    bgColor: 'bg-sky-100/50',
    textColor: 'text-sky-700',
  },
  {
    nameKey: 'timePeriods.evening',
    start: 18,
    end: 21,
    icon: Sunset,
    bgColor: 'bg-orange-100/50',
    textColor: 'text-orange-700',
  },
  {
    nameKey: 'timePeriods.night',
    start: 21,
    end: 24,
    icon: Moon,
    bgColor: 'bg-slate-200/50',
    textColor: 'text-slate-500',
  },
];

/**
 * Get the time period for a given hour
 */
function getTimePeriod(hour: number): TimelinePeriod {
  return TIME_PERIODS.find(period => hour >= period.start && hour < period.end) || TIME_PERIODS[0];
}

/**
 * Get meal type color
 */
function getMealTypeColor(mealType: string): string {
  const colors: Record<string, string> = {
    breakfast: 'bg-amber-500',
    lunch: 'bg-orange-500',
    dinner: 'bg-purple-500',
    snack: 'bg-green-500',
    unknown: 'bg-gray-500',
  };
  return colors[mealType] || 'bg-gray-500';
}

/**
 * Get meal type style for badge
 */
function getMealTypeStyle(mealType: string): { bgColor: string; textColor: string; icon: string; translationKey: string } {
  switch (mealType) {
    case 'breakfast':
      return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', icon: '🌅', translationKey: 'mealTypes.breakfast' };
    case 'lunch':
      return { bgColor: 'bg-orange-100', textColor: 'text-orange-700', icon: '☀️', translationKey: 'mealTypes.lunch' };
    case 'dinner':
      return { bgColor: 'bg-purple-100', textColor: 'text-purple-700', icon: '🌙', translationKey: 'mealTypes.dinner' };
    case 'snack':
      return { bgColor: 'bg-green-100', textColor: 'text-green-700', icon: '🍎', translationKey: 'mealTypes.snack' };
    default:
      return { bgColor: 'bg-gray-100', textColor: 'text-gray-700', icon: '🍽️', translationKey: 'mealTypes.unknown' };
  }
}

/**
 * Check if a meal can be deleted (within 3 hours of creation)
 * Uses consumed_at as a proxy for creation time since meals are logged close to consumption
 */
function canDeleteMeal(meal: Meal): boolean {
  if (!meal.consumed_at) return false;
  const consumedAt = new Date(meal.consumed_at).getTime();
  const elapsed = (Date.now() - consumedAt) / 1000;
  return elapsed < DELETE_WINDOW_SECONDS;
}

interface MealPosition {
  meal: Meal;
  hour: number;
  minute: number;
  position: number;
  period: TimelinePeriod;
  offsetLevel: number;
}

export function DayTimeline({ meals, isLoading }: DayTimelineProps) {
  const { t } = useTranslation('meals');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [hoveredMealId, setHoveredMealId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const selectedCardRef = useRef<HTMLDivElement>(null);
  
  const { deleteMeal } = useMealStore();

  // Close details when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedCardRef.current && !selectedCardRef.current.contains(event.target as Node)) {
        setSelectedMeal(null);
        setShowDeleteConfirm(false);
      }
    };

    if (selectedMeal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedMeal]);

  // Calculate visible hour range based on meals
  const { startHour, endHour } = useMemo(() => {
    if (meals.length === 0) {
      return { startHour: 8, endHour: 22 }; // Default: 8 AM to 10 PM
    }

    const mealHours = meals
      .filter(meal => meal.consumed_at)
      .map(meal => new Date(meal.consumed_at).getHours());

    if (mealHours.length === 0) {
      return { startHour: 8, endHour: 22 };
    }

    const minHour = Math.min(...mealHours);
    const maxHour = Math.max(...mealHours);

    // Always show at least 1 hour before earliest and 1 hour after latest meal
    let start = Math.max(0, minHour - 1);
    let end = Math.min(24, maxHour + 2); // +2 because we want 1 hour AFTER the meal hour

    // If start would be 7 or later, default to 8 AM for cleaner look
    if (start >= 7) {
      start = 8;
    }
    
    // Make sure we still have 1 hour buffer before earliest meal
    if (minHour - start < 1) {
      start = Math.max(0, minHour - 1);
    }

    // If end would be before 10 PM and no late meals, cap at 22
    if (end <= 22 && maxHour < 21) {
      end = 22;
    }

    return { startHour: start, endHour: end };
  }, [meals]);

  const totalHours = endHour - startHour;

  // Convert hour to percentage position on visible timeline
  const hourToPercentage = (hour: number, minute: number): number => {
    const totalMinutes = (hour - startHour) * 60 + minute;
    const visibleMinutes = totalHours * 60;
    return (totalMinutes / visibleMinutes) * 100;
  };

  // Parse meals, extract time info, and handle collisions
  const mealPositions = useMemo((): MealPosition[] => {
    const positions = meals
      .filter(meal => meal.consumed_at)
      .map(meal => {
        const date = new Date(meal.consumed_at);
        const hour = date.getHours();
        const minute = date.getMinutes();
        const position = hourToPercentage(hour, minute);

        return {
          meal,
          hour,
          minute,
          position,
          period: getTimePeriod(hour),
          offsetLevel: 0,
        };
      })
      .sort((a, b) => a.position - b.position);

    // Collision detection - offset meals that are too close
    const minGap = 100 / totalHours * 0.6; // ~0.6 hours gap minimum
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      
      if (curr.position - prev.position < minGap) {
        // Latest meal gets offset more to the right
        curr.offsetLevel = (prev.offsetLevel + 1) % 4; // Allow up to 4 offset levels
      }
    }

    return positions;
  }, [meals, startHour, totalHours]);

  // Generate hour markers
  const hourMarkers = useMemo(() => {
    const markers = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      const position = ((hour - startHour) / totalHours) * 100;
      const label = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
      const period = getTimePeriod(hour);
      
      markers.push({ hour, position, label, period });
    }
    return markers;
  }, [startHour, endHour, totalHours]);

  // Get visible time periods
  const visiblePeriods = useMemo(() => {
    return TIME_PERIODS.filter(period => {
      return period.end > startHour && period.start < endHour;
    }).map(period => {
      const clampedStart = Math.max(period.start, startHour);
      const clampedEnd = Math.min(period.end, endHour);
      const startPercent = ((clampedStart - startHour) / totalHours) * 100;
      const endPercent = ((clampedEnd - startHour) / totalHours) * 100;
      return {
        ...period,
        startPercent,
        height: endPercent - startPercent,
      };
    });
  }, [startHour, endHour, totalHours]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">{t('dayTimeline.title')}</h2>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">{t('dayTimeline.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">{t('dayTimeline.title')}</h2>
        <span className="text-sm text-gray-500 ml-auto">
          {meals.length} {meals.length === 1 ? t('dayTimeline.meal') : t('dayTimeline.meals')}
        </span>
      </div>

      {/* Timeline Container - taller */}
      <div className="relative rounded-lg" style={{ height: '700px' }}>
        {/* Background periods */}
        {visiblePeriods.map((period, idx) => (
          <div
            key={idx}
            className={`absolute left-0 right-0 ${period.bgColor}`}
            style={{
              top: `${period.startPercent}%`,
              height: `${period.height}%`,
            }}
          />
        ))}

        {/* Timeline ruler line */}
        <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-gray-300" />

        {/* Hour markers */}
        {hourMarkers.map(marker => (
          <div
            key={marker.hour}
            className="absolute left-0 flex items-center"
            style={{ top: `${marker.position}%`, transform: 'translateY(-50%)' }}
          >
            {/* Time label */}
            <div className={`text-[10px] font-medium w-11 text-right pr-1 ${marker.period.textColor}`}>
              {marker.label}
            </div>
            {/* Tick mark */}
            <div className="w-2 h-px bg-gray-400" />
          </div>
        ))}

        {/* Meal markers */}
        {mealPositions.map((mealPos) => {
          const offsetX = mealPos.offsetLevel * 12;
          const isSelected = selectedMeal?.id === mealPos.meal.id;
          const isHovered = hoveredMealId === mealPos.meal.id;
          
          return (
            <div
              key={mealPos.meal.id}
              ref={isSelected ? selectedCardRef : undefined}
              className="absolute flex items-center transition-all duration-200"
              onMouseEnter={() => setHoveredMealId(mealPos.meal.id)}
              onMouseLeave={() => setHoveredMealId(null)}
              style={{
                top: `${mealPos.position}%`,
                transform: 'translateY(-50%)',
                left: `${56 + offsetX}px`,
                right: '4px',
                zIndex: isSelected ? 50 : isHovered ? 40 : 10 + mealPos.offsetLevel,
              }}
            >
              {/* Connector dot */}
              <div className={`w-2 h-2 rounded-full ${getMealTypeColor(mealPos.meal.meal_type)} flex-shrink-0`} />
              
              {/* Connector line */}
              <div className="w-2 h-0.5 bg-gray-300 flex-shrink-0" />
              
              {/* Meal card */}
              <div className="relative flex-1">
                <div 
                  onClick={() => {
                    setSelectedMeal(isSelected ? null : mealPos.meal);
                    setShowDeleteConfirm(false);
                  }}
                  className={`bg-white/95 backdrop-blur-sm border rounded shadow-sm hover:shadow-md transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-indigo-500 shadow-lg' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                {/* Compact view */}
                {!isSelected && (
                  <div className="px-2 py-0.5">
                    <div className="flex items-center gap-3 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${getMealTypeColor(mealPos.meal.meal_type)}`} />
                        <span className="font-semibold text-gray-800">
                          {t(getMealTypeStyle(mealPos.meal.meal_type).translationKey)}
                        </span>
                      </div>
                      
                      {mealPos.meal.total_calories && (
                        <span className="font-bold text-gray-700 flex-shrink-0">
                          {typeof mealPos.meal.total_calories === 'string'
                            ? parseFloat(mealPos.meal.total_calories).toFixed(0)
                            : mealPos.meal.total_calories.toFixed(0)}
                          <span className="font-normal text-gray-400 ml-0.5">{t('common:calories_short')}</span>
                        </span>
                      )}
                      
                      {mealPos.meal.macros && (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-[10px] text-blue-600 font-medium">P{mealPos.meal.macros.protein.toFixed(0)}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[20px]">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min((mealPos.meal.macros.protein / 40) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-[10px] text-amber-600 font-medium">C{mealPos.meal.macros.carbs.toFixed(0)}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[20px]">
                              <div 
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${Math.min((mealPos.meal.macros.carbs / 80) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-[10px] text-rose-600 font-medium">F{mealPos.meal.macros.fat.toFixed(0)}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[20px]">
                              <div 
                                className="h-full bg-rose-500 rounded-full"
                                style={{ width: `${Math.min((mealPos.meal.macros.fat / 40) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded view - MealCard style */}
                {isSelected && (() => {
                  const meal = mealPos.meal;
                  const mealStyle = getMealTypeStyle(meal.meal_type || 'unknown');
                  const consumedTime = meal.consumed_at ? formatTime(meal.consumed_at) : '--:--';
                  const showDeleteButton = canDeleteMeal(meal);
                  
                  const handleDeleteClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  };
                  
                  const handleConfirmDelete = async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setIsDeleting(true);
                    const success = await deleteMeal(meal.id);
                    setIsDeleting(false);
                    setShowDeleteConfirm(false);
                    if (success) {
                      setSelectedMeal(null);
                    }
                  };
                  
                  const handleCancelDelete = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  };
                  
                  return (
                    <div className="p-4 max-h-64 overflow-y-auto">
                      {/* Header with delete button */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            mealStyle.bgColor,
                            mealStyle.textColor
                          )}>
                            {mealStyle.icon} {t(mealStyle.translationKey)}
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {consumedTime}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {/* Delete button - only show if within delete window */}
                          {showDeleteButton && !showDeleteConfirm && (
                            <button 
                              onClick={handleDeleteClick}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title={t('dayTimeline.deleteMeal')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMeal(null);
                              setShowDeleteConfirm(false);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Delete confirmation */}
                      {showDeleteConfirm && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-700 mb-2">{t('dayTimeline.deleteConfirm')} {t('dayTimeline.deleteWarning')}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={handleConfirmDelete}
                              disabled={isDeleting}
                              className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded disabled:opacity-50 flex items-center justify-center"
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  {t('dayTimeline.deleting')}
                                </>
                              ) : (
                                t('common:delete')
                              )}
                            </button>
                            <button
                              onClick={handleCancelDelete}
                              disabled={isDeleting}
                              className="flex-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded disabled:opacity-50"
                            >
                              {t('common:cancel')}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Calories */}
                      <div className="flex items-center text-primary-600 font-semibold mb-3">
                        <Flame className="w-4 h-4 mr-1" />
                        {formatCalories(meal.total_calories)} {t('common:calories_short')}
                      </div>

                      {/* Description */}
                      {meal.description && (
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {meal.description}
                        </p>
                      )}

                      {/* Food Items */}
                      {meal.food_items && meal.food_items.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center text-xs text-gray-500 mb-1">
                            <Utensils className="w-3 h-3 mr-1" />
                            {t('mealCard.itemsCount', { count: meal.food_items.length })}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {meal.food_items.slice(0, 5).map((item) => (
                              <span
                                key={item.id}
                                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {item.name_in_english || item.name}
                                <span className="ml-1 text-gray-500">
                                  ({formatCalories(item.calories_total)})
                                </span>
                              </span>
                            ))}
                            {meal.food_items.length > 5 && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                {t('mealCard.moreItems', { count: meal.food_items.length - 5 })}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Macros */}
                      {meal.macros && (
                        <div className="flex items-center space-x-4 pt-2 border-t border-gray-100">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">{t('macros.protein')}</span>
                              <span className="font-medium text-blue-600">
                                {formatMacros(meal.macros.protein ?? 0)}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(((meal.macros.protein ?? 0) / 50) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">{t('macros.carbs')}</span>
                              <span className="font-medium text-yellow-600">
                                {formatMacros(meal.macros.carbs ?? 0)}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                              <div 
                                className="h-full bg-yellow-500 rounded-full"
                                style={{ width: `${Math.min(((meal.macros.carbs ?? 0) / 100) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">{t('macros.fat')}</span>
                              <span className="font-medium text-red-600">
                                {formatMacros(meal.macros.fat ?? 0)}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                              <div 
                                className="h-full bg-red-500 rounded-full"
                                style={{ width: `${Math.min(((meal.macros.fat ?? 0) / 50) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                </div>
                
                {/* Hover tooltip with description */}
                {isHovered && !isSelected && mealPos.meal.description && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[100] pointer-events-none whitespace-nowrap">
                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[200px] whitespace-normal relative">
                      {mealPos.meal.description}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Current time indicator */}
        {(() => {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          if (currentHour < startHour || currentHour > endHour) {
            return null;
          }
          
          const currentPosition = hourToPercentage(currentHour, currentMinute);

          return (
            <div
              className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
              style={{ top: `${currentPosition}%` }}
            >
              <div className="w-11" />
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse -ml-1" />
              <div className="flex-1 border-t-2 border-red-500 border-dashed opacity-60" />
              <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mr-1">
                NOW
              </div>
            </div>
          );
        })()}

        {/* Empty state */}
        {mealPositions.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Coffee className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('dayTimeline.noMeals')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
