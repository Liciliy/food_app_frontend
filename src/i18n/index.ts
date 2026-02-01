/**
 * i18n Configuration
 * Sets up internationalization with react-i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enMeals from './locales/en/meals.json';
import enStats from './locales/en/stats.json';

import ukCommon from './locales/uk/common.json';
import ukAuth from './locales/uk/auth.json';
import ukDashboard from './locales/uk/dashboard.json';
import ukMeals from './locales/uk/meals.json';
import ukStats from './locales/uk/stats.json';

// Define available languages
export const languages = {
  en: { nativeName: 'English', flag: '🇬🇧' },
  uk: { nativeName: 'Українська', flag: '🇺🇦' },
} as const;

export type LanguageCode = keyof typeof languages;

// Define namespaces
export const defaultNS = 'common';
export const namespaces = ['common', 'auth', 'dashboard', 'meals', 'stats'] as const;

// Resources object
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    meals: enMeals,
    stats: enStats,
  },
  uk: {
    common: ukCommon,
    auth: ukAuth,
    dashboard: ukDashboard,
    meals: ukMeals,
    stats: ukStats,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS,
    ns: namespaces,

    // Language detection options
    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language preference
      caches: ['localStorage'],
      // LocalStorage key
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      // React already escapes values
      escapeValue: false,
    },

    // React options
    react: {
      // Wait for translations to load before rendering
      useSuspense: true,
    },
  });

export default i18n;
