'use client';

import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { ChevronDown, Languages } from 'lucide-react';
import DropdownLink from './DropdownLink';
import { languageAlternateAtom } from './LanguageAlternate';

interface LanguageOption {
  code: string;
  name: string;
}

interface LanguageSwitcherProps {
  currentLanguage: string;
  availableLanguages: LanguageOption[];
}

export default function LanguageSwitcher({
  currentLanguage,
  availableLanguages,
}: LanguageSwitcherProps) {
  const [globalLanguageAlternate, setGlobalLanguageAlternate] = useAtom(
    languageAlternateAtom,
  );

  const [language, setLanguage] = useAtom(languageAtom);

  // 判断语言是否在可用的替代语言中
  const isLanguageAvailable = (langCode: string) => {
    if (!globalLanguageAlternate) return true; // 如果为null，所有语言都可用
    return globalLanguageAlternate.has(langCode);
  };

  // 获取语言的链接地址
  const getLanguageHref = (langCode: string) => {
    if (!globalLanguageAlternate || !globalLanguageAlternate.has(langCode)) {
      // 如果globalLanguageAlternate为null或不包含该语言，导航到首页
      return `/${langCode}`;
    }
    // 如果包含该语言，导航到对应的路径
    return `/${langCode}/${globalLanguageAlternate.get(langCode)}`;
  };

  // 获取语言项的样式类名
  const getLanguageClassName = (lang: LanguageOption) => {
    const baseClassName = 'w-full text-left px-4 py-2 text-sm inline-flex';
    const isAvailable = isLanguageAvailable(lang.code);

    if (lang.code === currentLanguage) {
      return `${baseClassName} bg-primary text-primary-content`;
    }

    const baseClassNameForNonCurrentLanguage = `${baseClassName} hover:bg-base-200`;

    if (!isAvailable) {
      return `${baseClassNameForNonCurrentLanguage} text-base-content/50`; // 灰色显示不可用的语言
    }

    return baseClassNameForNonCurrentLanguage;
  };

  return (
    <div className="dropdown dropdown-end">
      <div
        role="button"
        tabIndex={0}
        className="flex items-center gap-1 btn btn-ghost btn-sm group"
        aria-label="Language Switcher"
      >
        <Languages className="w-5 h-5" />
        <ChevronDown className="w-4 h-4 transition-transform group-focus:rotate-180" />
      </div>
      <div className="dropdown-content right-0 z-1 w-48 mt-2 rounded-md shadow-lg bg-base-100">
        <ul className="py-1">
          {availableLanguages.map((lang) => (
            <li key={lang.code}>
              <DropdownLink
                href={getLanguageHref(lang.code)}
                className={getLanguageClassName(lang)}
                onClick={() => {
                  setLanguage(lang.code);
                }}
              >
                {lang.name}
              </DropdownLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const languageAtom = atomWithStorage<string | null>('language', null);
