import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { Meal, MicronutrientEntry } from '../../types';

interface MicronutrientsSectionProps {
  meal: Meal;
  className?: string;
}

function formatMicronutrientAmount(value: string | number, unit: string): string {
  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : value;

  if (Number.isNaN(numericValue)) {
    return `${value} ${unit}`;
  }

  const fractionDigits = numericValue >= 10 ? 1 : 2;
  return `${numericValue.toFixed(fractionDigits)} ${unit}`;
}

function NutrientPill({ nutrient }: { nutrient: MicronutrientEntry }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{nutrient.nutrient_name}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {formatMicronutrientAmount(nutrient.amount, nutrient.unit)}
      </p>
    </div>
  );
}

export function MicronutrientsSection({ meal, className = '' }: MicronutrientsSectionProps) {
  const { t } = useTranslation('meals');
  const [isOpen, setIsOpen] = useState(false);

  const mealMicronutrients = meal.micronutrients || [];
  const itemsWithMicronutrients = useMemo(
    () => (meal.food_items || []).filter((item) => item.micronutrients && item.micronutrients.length > 0),
    [meal.food_items]
  );

  const totalMicronutrientCount = mealMicronutrients.length + itemsWithMicronutrients.reduce((sum, item) => sum + (item.micronutrients?.length || 0), 0);

  if (totalMicronutrientCount === 0) {
    return null;
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-gray-50 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-semibold text-gray-900">{t('micronutrients.title')}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {t('micronutrients.summary', {
              count: totalMicronutrientCount,
              items: itemsWithMicronutrients.length,
            })}
          </p>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {isOpen && (
        <div className="space-y-4 border-t border-gray-200 px-4 py-4">
          {mealMicronutrients.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('micronutrients.mealLevel')}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {mealMicronutrients.map((nutrient) => (
                  <NutrientPill key={`meal-${nutrient.nutrient_code}-${nutrient.nutrient_name}`} nutrient={nutrient} />
                ))}
              </div>
            </div>
          )}

          {itemsWithMicronutrients.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('micronutrients.itemLevel')}
              </p>
              <div className="space-y-3">
                {itemsWithMicronutrients.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900">{item.name_in_english || item.name}</p>
                      {item.consumed_weight_grams != null && (
                        <span className="text-xs text-gray-500">
                          {t('mealCard.consumedWeight', { grams: Math.round(Number(item.consumed_weight_grams) || 0) })}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {(item.micronutrients || []).map((nutrient) => (
                        <NutrientPill key={`item-${item.id}-${nutrient.nutrient_code}-${nutrient.nutrient_name}`} nutrient={nutrient} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}