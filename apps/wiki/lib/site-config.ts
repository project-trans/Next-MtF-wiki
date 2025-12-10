export interface NavigationItem {
  key: string;
  href: string;
  translationKey: string;
  weight: number;
  locale?: string[]; // 指定在哪些语言显示，如果为空则在所有语言显示
}

export interface ThemeOption {
  key: string;
  labelKey: string; // 翻译键而非直接文本
  value: string;
  icon: string;
  descriptionKey: string; // 翻译键而非直接文本
}

export interface ThemeConfig {
  defaultTheme: string;
  themes: {
    light: string;
    dark: string;
  };
  options: ThemeOption[];
}

export interface LanguageConfig {
  code: string;
  subfolders: string[]; // 该语言支持的子目录
  noMarkdown?: string[] | null; // 该语言不使用markdown的页面，如果为null则使用所有页面
}

export interface SEOConfig {
  siteUrl: string;
  allowRobots: boolean;
  includeSitemap: boolean;
}

export interface SiteConfig {
  navigation: NavigationItem[];
  theme: ThemeConfig;
  languages: LanguageConfig[]; // 新增语言配置
}

function getGlobalNoMarkdown(): string[] {
  return ['converter', 'cup-calculator'];
}

// 站点配置
export const siteConfig: SiteConfig = {
  navigation: [
    {
      key: 'docs',
      href: '/docs',
      translationKey: 'docs',
      weight: 1,
    },
    {
      key: 'converter',
      href: '/converter',
      translationKey: 'converter',
      locale: ['zh-cn'],
      weight: 2,
    },
    {
      key: 'cup-calculator',
      href: '/cup-calculator',
      translationKey: 'cupCalculator',
      locale: ['zh-cn'],
      weight: 3,
    },
    {
      key: 'about',
      href: '/about',
      translationKey: 'about',
      weight: 4,
    },
  ],
  theme: {
    defaultTheme: 'system',
    themes: {
      light: 'cupcake',
      dark: 'sunset',
    },
    options: [
      {
        key: 'system',
        labelKey: 'themeSystem',
        value: 'system',
        icon: 'computer',
        descriptionKey: 'themeSystemDesc',
      },
      {
        key: 'light',
        labelKey: 'themeLight',
        value: 'light',
        icon: 'sun',
        descriptionKey: 'themeLightDesc',
      },
      {
        key: 'dark',
        labelKey: 'themeDark',
        value: 'dark',
        icon: 'moon',
        descriptionKey: 'themeDarkDesc',
      },
      // 未来可以在这里添加更多主题选项，例如：
      // {
      //   key: 'high-contrast',
      //   label: '高对比度',
      //   value: 'high-contrast',
      //   icon: 'contrast',
      //   description: '使用高对比度主题，提升可访问性',
      // },
      // {
      //   key: 'colorblind-friendly',
      //   label: '色盲友好',
      //   value: 'colorblind-friendly',
      //   icon: 'eye',
      //   description: '使用色盲友好的配色方案',
      // },
    ],
  },
  languages: [
    {
      code: 'zh-cn',
      subfolders: ['docs', 'converter', 'about'],
      noMarkdown: getGlobalNoMarkdown(),
    },
    {
      code: 'zh-hant',
      subfolders: ['docs', 'converter', 'about'],
      noMarkdown: getGlobalNoMarkdown(),
    },
    {
      code: 'ja',
      subfolders: ['docs', 'about'],
      noMarkdown: getGlobalNoMarkdown(),
    },
    {
      code: 'en',
      subfolders: ['docs', 'about'],
      noMarkdown: getGlobalNoMarkdown(),
    },
    {
      code: 'es',
      subfolders: ['docs', 'about'],
      noMarkdown: getGlobalNoMarkdown(),
    },
  ],
};

// 获取导航项配置
export function getNavigationItems(language: string): NavigationItem[] {
  return siteConfig.navigation
    .filter((item) => (item.locale ? item.locale.includes(language) : true))
    .sort((a, b) => a.weight - b.weight);
}

// 获取主题配置
export function getThemeConfig(): ThemeConfig {
  return siteConfig.theme;
}

// 获取主题选项
export function getThemeOptions(): ThemeOption[] {
  return siteConfig.theme.options;
}

// 获取语言配置
export function getLanguageConfigs(): LanguageConfig[] {
  return siteConfig.languages;
}

// 获取特定语言的配置
export function getLanguageConfig(
  languageCode: string,
): LanguageConfig | undefined {
  return siteConfig.languages.find((lang) => lang.code === languageCode);
}

// 获取SEO配置
export function getSEOConfig(): SEOConfig {
  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://mtf.wiki',
    allowRobots: process.env.NEXT_PUBLIC_ROBOTS_ALLOW === 'true',
    includeSitemap: process.env.NEXT_PUBLIC_INCLUDE_SITEMAP === 'true',
  };
}
