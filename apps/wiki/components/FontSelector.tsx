'use client';

import { useAtom } from 'jotai';
import { Check, Type } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FONTS_BASE_URL,
  type FontsMap,
  currentFontAtom,
  fontOptionsAtom,
  fontPreferenceAtom,
  fontsMapAtom,
  getFontData,
} from '../lib/font-atoms';
import { t } from '../lib/i18n/client';

export default function FontSelector() {
  const [mounted, setMounted] = useState(false);
  const [fontPreference, setFontPreference] = useAtom(fontPreferenceAtom);
  const [currentFont, setCurrentFont] = useAtom(currentFontAtom);
  const [fontsMap, setFontsMap] = useAtom(fontsMapAtom);
  const [fontOptions] = useAtom(fontOptionsAtom);
  const params = useParams();

  const currentLanguage = (params?.language as string) || 'zh-cn';

  // 获取字体列表
  useEffect(() => {
    async function fetchFonts() {
      try {
        const response = await fetch(`${FONTS_BASE_URL}path_map.json`);
        if (!response.ok) throw new Error('Failed to fetch fonts');
        const data: FontsMap = await response.json();
        setFontsMap(data);
      } catch (error) {
        console.error('Error fetching fonts:', error);
      }
    }
    fetchFonts();
  }, [setFontsMap]);

  useEffect(() => setMounted(true), []);

  // 应用字体设置，处理无默认字体情况
  useEffect(() => {
    if (!mounted || !fontsMap) return;

    let resolvedFont = fontPreference;

    // 没有选择字体或者 fontPreference 不存在于 fontsMap
    if (!fontPreference || !fontsMap[fontPreference]) {
      resolvedFont = '平方微软雅黑';
      setCurrentFont(resolvedFont);
    } else {
      setCurrentFont(resolvedFont);
    }

    const fontData = getFontData(fontsMap, fontPreference);
    const fontFamily = fontData ? fontData.fontFamily : resolvedFont;

    document.documentElement.style.setProperty('--font-family', fontFamily);
  }, [mounted, fontsMap, fontPreference, setCurrentFont]);

  // 切换字体
  const handleFontChange = (newFont: string) => {
    setFontPreference(newFont);
    const fontData = getFontData(fontsMap, newFont);
    const fontFamily = fontData ? fontData.fontFamily : '平方微软雅黑';
    document.documentElement.style.setProperty('--font-family', fontFamily);
    setCurrentFont(fontFamily);
  };

  // 避免 SSR mismatch
  if (!mounted || !fontsMap) {
    return (
      <div className="dropdown dropdown-end">
        <button type="button" className="btn btn-ghost btn-circle">
          <div className="w-5 h-5 animate-pulse bg-base-content/20 rounded" />
        </button>
      </div>
    );
  }

  const currentFontData = getFontData(fontsMap, currentFont);

  return (
    <>
      <div className="dropdown dropdown-end">
        <div
          role="button"
          tabIndex={0}
          className="btn btn-ghost btn-circle"
          aria-label={t('fontSettings', currentLanguage)}
          title={`${t('currentFont', currentLanguage)}: ${currentFont}`}
        >
          <Type className="w-5 h-5" />
        </div>

        <div className="dropdown-content mt-2 w-64 bg-base-100 rounded-box shadow-lg border border-base-300 z-[1] p-2">
          <ul className="menu w-full">
            <li className="menu-title">
              <span>{t('fontSettings', currentLanguage)}</span>
            </li>
            {fontOptions.map((option) => (
              <li key={option.key}>
                <button
                  type="button"
                  className={`flex items-center gap-3 ${
                    currentFont === option.value ? 'active' : ''
                  }`}
                  onClick={() => {
                    handleFontChange(option.value);
                    (document.activeElement as HTMLElement).blur();
                  }}
                  style={{ fontFamily: option.fontFamily }}
                >
                  <div className="flex flex-col items-start flex-1">
                    <span className="font-medium">{option.displayName}</span>
                  </div>
                  {currentFont === option.value && <Check className="w-4 h-4 ml-auto" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 动态加载字体 CSS */}
      {currentFontData?.paths.map((css) => (
        <link key={css} rel="stylesheet" href={`${FONTS_BASE_URL}${css}/result.css`} />
      ))}
    </>
  );
}
