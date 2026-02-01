/**
 * Language Switcher Component
 * Allows users to switch between available languages
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { languages, type LanguageCode } from '../../i18n';
import { cn } from '../../utils';

interface LanguageSwitcherProps {
  /** Display variant */
  variant?: 'dropdown' | 'buttons';
  /** Additional className */
  className?: string;
}

/**
 * Language switcher component
 * Provides UI to switch between available languages
 */
export function LanguageSwitcher({ variant = 'dropdown', className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = i18n.language as LanguageCode;
  const currentLangData = languages[currentLanguage] || languages.en;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle language change
  const changeLanguage = (langCode: LanguageCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Button variant - shows all languages as buttons
  if (variant === 'buttons') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {(Object.keys(languages) as LanguageCode[]).map((langCode) => (
          <button
            key={langCode}
            onClick={() => changeLanguage(langCode)}
            className={cn(
              'px-2 py-1 text-sm rounded-md transition-colors',
              currentLanguage === langCode
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
            title={languages[langCode].nativeName}
          >
            {languages[langCode].flag}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg',
          'bg-white border border-gray-200 hover:bg-gray-50',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('selectLanguage')}
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="hidden sm:inline">{currentLangData.flag}</span>
        <span className="hidden md:inline">{currentLangData.nativeName}</span>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-1 py-1 w-48 bg-white rounded-lg shadow-lg',
            'border border-gray-200 z-50'
          )}
          role="listbox"
          aria-label={t('selectLanguage')}
        >
          {(Object.keys(languages) as LanguageCode[]).map((langCode) => (
            <button
              key={langCode}
              onClick={() => changeLanguage(langCode)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-2 text-sm',
                'hover:bg-gray-50 transition-colors',
                currentLanguage === langCode && 'bg-primary-50'
              )}
              role="option"
              aria-selected={currentLanguage === langCode}
            >
              <div className="flex items-center gap-2">
                <span>{languages[langCode].flag}</span>
                <span>{languages[langCode].nativeName}</span>
              </div>
              {currentLanguage === langCode && (
                <Check className="w-4 h-4 text-primary-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
