'use client';

import { useAtom } from 'jotai';
import { Check, Moon, Palette, Sun, SunMoon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { t } from '../lib/i18n/client';
import { getThemeOptions } from '../lib/site-config';
import { themeMenuOpenAtom, themePreferenceAtom } from '../lib/theme-atoms';

// 图标组件
const ThemeIcon = ({
  icon,
  className = 'w-5 h-5',
}: {
  icon: string;
  className?: string;
}) => {
  switch (icon) {
    case 'sun':
      return <Sun className={className} />;
    case 'moon':
      return <Moon className={className} />;
    case 'computer':
      return <SunMoon className={className} />;
    // 未来可以在这里添加更多图标，例如：
    // case 'contrast':
    // case 'eye':
    // case 'palette':
    default:
      return <Palette className={className} />;
  }
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [themePreference, setThemePreference] = useAtom(themePreferenceAtom);
  const params = useParams();

  // 获取当前语言
  const currentLanguage = (params?.language as string) || 'zh-cn';
  const themeOptions = getThemeOptions();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 同步主题偏好设置
    if (mounted && theme !== themePreference) {
      setTheme(themePreference);
    }
  }, [mounted, themePreference, theme, setTheme]);

  const handleThemeChange = (newTheme: string) => {
    setThemePreference(newTheme);
    setTheme(newTheme);
  };

  const getCurrentThemeOption = () => {
    return (
      themeOptions.find(
        (option) => option.value === (theme || themePreference),
      ) || themeOptions[0]
    );
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

  const currentOption = getCurrentThemeOption();

  return (
    <div className="dropdown dropdown-end">
      <div
        role="button"
        tabIndex={0}
        className="btn btn-ghost btn-circle"
        aria-label={t('themeSettings', currentLanguage)}
        title={`${t('currentTheme', currentLanguage)}: ${t(currentOption.labelKey as any, currentLanguage)}`}
      >
        <ThemeIcon icon={currentOption.icon} />
      </div>

      <div className="dropdown-content mt-2 w-52 bg-base-100 rounded-box shadow-lg border border-base-300 z-1 p-2">
        <ul className="menu w-full">
          <li className="menu-title">
            <span>{t('themeSettings', currentLanguage)}</span>
          </li>
          {themeOptions.map((option) => (
            <li key={option.key}>
              <button
                type="button"
                className={`flex items-center gap-3 ${
                  (theme || themePreference) === option.value ? 'active' : ''
                }`}
                onClick={() => {
                  handleThemeChange(option.value);
                  (document.activeElement as HTMLElement).blur();
                }}
              >
                <ThemeIcon icon={option.icon} className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">
                    {t(option.labelKey as any, currentLanguage)}
                  </span>
                  <span className="text-xs opacity-70">
                    {t(option.descriptionKey as any, currentLanguage)}
                  </span>
                </div>
                {(theme || themePreference) === option.value && (
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
