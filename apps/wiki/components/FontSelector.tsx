'use client';

import { useAtom } from 'jotai';
import { Check, Type } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  currentFontAtom,
  fontOptions,
  fontPreferenceAtom,
  getFontOption,
} from '../lib/font-atoms';
import { t } from '../lib/i18n/client';

export default function FontSelector() {
  const [mounted, setMounted] = useState(false);
  const [fontPreference, setFontPreference] = useAtom(fontPreferenceAtom);
  const [currentFont, setCurrentFont] = useAtom(currentFontAtom);
  const params = useParams();

  // 获取当前语言
  const currentLanguage = (params?.language as string) || 'zh-cn';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // 应用字体到 body
      const fontOption = getFontOption(fontPreference);
      document.documentElement.style.setProperty(
        '--font-family',
        fontOption.fontFamily,
      );
      setCurrentFont(fontPreference);
    }
  }, [mounted, fontPreference, setCurrentFont]);

  const handleFontChange = (newFont: string) => {
    setFontPreference(newFont);
    const fontOption = getFontOption(newFont);
    document.documentElement.style.setProperty(
      '--font-family',
      fontOption.fontFamily,
    );
  };

  const getCurrentFontOption = () => {
    return getFontOption(currentFont || fontPreference);
  };

  // 避免服务端渲染不匹配
  if (!mounted) {
    return (
      <div className="dropdown dropdown-end">
        <button type="button" className="btn btn-ghost btn-circle">
          <div className="w-5 h-5 animate-pulse bg-base-content/20 rounded" />
        </button>
      </div>
    );
  }

  const currentOption = getCurrentFontOption();

  return (
    <div className="dropdown dropdown-end">
      <div
        role="button"
        tabIndex={0}
        className="btn btn-ghost btn-circle"
        aria-label={t('fontSettings', currentLanguage)}
        title={`${t('currentFont', currentLanguage)}: ${t(currentOption.labelKey as any, currentLanguage)}`}
      >
        <Type className="w-5 h-5" />
      </div>

      <div className="dropdown-content mt-2 w-64 bg-base-100 rounded-box shadow-lg border border-base-300 z-1 p-2">
        <ul className="menu w-full">
          <li className="menu-title">
            <span>{t('fontSettings', currentLanguage)}</span>
          </li>
          {fontOptions.map((option) => (
            <li key={option.key}>
              <button
                type="button"
                className={`flex items-center gap-3 ${
                  (currentFont || fontPreference) === option.value
                    ? 'active'
                    : ''
                }`}
                onClick={() => {
                  handleFontChange(option.value);
                  (document.activeElement as HTMLElement).blur();
                }}
                style={{ fontFamily: option.fontFamily }}
              >
                <div className="flex flex-col items-start flex-1">
                  <span className="font-medium">
                    {t(option.labelKey as any, currentLanguage)}
                  </span>
                  <span className="text-xs opacity-70">
                    {t(option.descriptionKey as any, currentLanguage)}
                  </span>
                </div>
                {(currentFont || fontPreference) === option.value && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
