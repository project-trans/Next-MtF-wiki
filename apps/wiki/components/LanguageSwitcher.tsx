'use client';

import { ChevronDown, Languages } from 'lucide-react';
import DropdownLink from './DropdownLink';

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
                // todo: 检查目标语言是否有对应的路径
                // todo: 如果路径存在，导航到该路径；否则导航到目标语言的首页
                href={`/${lang.code}`}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-base-200 inline-flex ${
                  lang.code === currentLanguage
                    ? 'bg-primary text-primary-content'
                    : ''
                }`}
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
