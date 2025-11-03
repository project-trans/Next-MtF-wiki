import BottomBanner from '@/components/BottomBanner';
import BrowserUpgradeBanner from '@/components/BrowserUpgradeBanner';
import DropdownLink from '@/components/DropdownLink';
import FontSelector from '@/components/FontSelector';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ObservedHeader } from '@/components/ObservedHeader';
import ThemeToggle from '@/components/ThemeToggle';
import SearchBox from '@/components/searchbox/SearchBox';
import { getLanguageName, t } from '@/lib/i18n/client';
import { sT, sTryT } from '@/lib/i18n/server';
import { getNavigationItems } from '@/lib/site-config';
import { getAvailableLanguages } from '@/service/directory-service';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Link } from '../../components/progress';

export default async function LanguageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;

  // 获取所有可用语言
  const availableLanguages = await getAvailableLanguages();

  // 构建语言选项
  const languageOptions = availableLanguages.map((langCode) => ({
    code: langCode,
    name: getLanguageName(langCode),
  }));

  // 获取导航项配置
  const navigationItems = getNavigationItems(language);

  return (
    <div className="flex flex-col min-h-screen" lang={language}>
      {/* 浏览器升级横幅 - 只在不支持 :where() 的浏览器中显示 */}
      <BrowserUpgradeBanner />

      {/* 顶部导航栏 */}
      <ObservedHeader className="lg:sticky lg:top-0 z-49 border-b bg-base-100/80 backdrop-blur-xl border-base-300/50 shadow-sm">
        <div className="container flex items-center justify-between px-4 py-3 md:px-6 md:py-4 mx-auto">
          <div className="flex items-center space-x-8">
            <Link href={`/${language}`} className="flex items-center group">
              <Image
                src="/hugo-static/new/mtf-wiki-long.svg"
                alt="Logo"
                width={140}
                height={35}
                className="w-auto h-9 transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            <nav className="hidden space-x-4 lg:space-x-8 md:flex">
              {navigationItems.map((item) => (
                <Link
                  key={item.key}
                  href={`/${language}${item.href}`}
                  className="relative px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg text-base-content hover:text-primary hover:bg-primary/10 before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:bg-primary before:scale-x-0 before:transition-transform before:duration-200 hover:before:scale-x-100"
                >
                  {t(item.translationKey as any, language)}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="h-6 border-l border-base-300" />
            {/* 搜索框 */}
            <div className="hidden xl:block">
              <SearchBox
                language={language}
                placeholder={sT('search-documents-placeholder', language)}
              />
            </div>
            <div className="xl:hidden">
              <SearchBox
                language={language}
                placeholder={sT('search-documents-placeholder', language)}
                compact={true}
              />
            </div>

            <FontSelector />
            <ThemeToggle />
            <LanguageSwitcher
              currentLanguage={language}
              availableLanguages={languageOptions}
            />
          </div>
        </div>

        {/* 移动端导航菜单 */}
        {/* 小屏幕下拉菜单 (< xs) */}
        <div className="border-t xs:hidden border-base-300/50">
          <div className="dropdown dropdown-end w-full">
            <div
              role="button"
              tabIndex={0}
              className="btn btn-ghost w-full justify-between px-4 py-2 rounded-md group"
            >
              <span className="text-sm font-medium">
                {sT('header-navigation', language)}
              </span>
              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-focus:rotate-180" />
            </div>
            <ul className="dropdown-content menu bg-base-100 rounded-md z-1 w-full p-2 shadow-lg border border-base-300/50">
              {navigationItems.map((item) => (
                <li key={item.key}>
                  <DropdownLink
                    href={`/${language}${item.href}`}
                    className="px-4 py-3 text-sm font-medium transition-colors hover:text-primary hover:bg-primary/10"
                  >
                    {t(item.translationKey as any, language)}
                  </DropdownLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 中等屏幕水平滚动菜单 (xs - md) */}
        <div className="border-t hidden xs:block md:hidden border-base-300/50 relative">
          <nav className="flex px-3 py-2 space-x-2 overflow-x-auto">
            <div className="px-3" />
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                href={`/${language}${item.href}`}
                className="px-3 py-2 text-sm font-medium transition-colors rounded-lg text-base-content hover:text-primary hover:bg-primary/10 whitespace-nowrap flex-shrink-0"
              >
                {t(item.translationKey as any, language)}
              </Link>
            ))}
          </nav>
          {/* 右侧渐变遮罩，提示可以滚动 */}
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-base-100 to-transparent pointer-events-none" />
        </div>
      </ObservedHeader>

      {/* 主要内容区域 */}
      <main className="flex-1">{children}</main>
      <footer className="bg-base-300 text-base-content flex flex-col items-center">
        {/* 页脚 */}
        <div className="container footer sm:footer-horizontal px-10 pt-10 pb-2">
          <aside>
            <Image
              src="/hugo-static/new/mtf-wiki-long.svg"
              alt="MtF Wiki Logo"
              width={120}
              height={30}
              className="h-8 w-auto"
            />
            <blockquote className="text-sm border-l-4 border-primary/30 pl-4 pr-4 italic text-base-content/70 bg-base-100/50 py-2 rounded-r">
              {sT('footer-quote', language)}
            </blockquote>
          </aside>

          <nav>
            <h6 className="footer-title">{sT('project', language)}</h6>
            <Link
              href="https://github.com/project-trans/MtF-wiki"
              className="link link-hover"
              target="_blank"
              rel="noreferrer"
            >
              {sT('content-source', language)}
            </Link>
            <Link
              href="https://github.com/project-trans/Next-MtF-wiki"
              className="link link-hover"
              target="_blank"
              rel="noreferrer"
            >
              {sT('website-source', language)}
            </Link>
            <Link
              href="https://2345.lgbt"
              className="link link-hover"
              target="_blank"
              rel="noreferrer"
            >
              {sT('navigation-site', language)}
            </Link>
          </nav>

          <nav>
            <h6 className="footer-title">{sT('updates', language)}</h6>
            <Link
              href="https://x.com/MtFwiki"
              className="link link-hover"
              target="_blank"
              rel="noreferrer"
            >
              {sT('twitter', language)}
            </Link>
            <Link
              href="https://t.me/MtFwiki"
              className="link link-hover"
              target="_blank"
              rel="noreferrer"
            >
              {sT('telegram-channel', language)}
            </Link>
          </nav>

          <nav>
            <h6 className="footer-title">{sT('contact', language)}</h6>
            {language.startsWith('zh') && (
              <Link
                href={`/${language}/docs/contributor-guide/`}
                className="link link-hover"
              >
                {sT('contributor-guide', language)}
              </Link>
            )}
            <Link
              href="https://github.com/project-trans"
              className="link link-hover"
              target="_blank"
              rel="noreferrer"
            >
              {sT('github', language)}
            </Link>
            <Link
              href="mailto:mtfwiki@project-trans.org"
              className="link link-hover"
            >
              {sT('email', language)}
            </Link>
          </nav>
        </div>

        <div className="container footer border-base-300 border-t px-10 py-4">
          <aside className="grid-flow-col items-center">
            <p className="text-sm">
              © 2020-{new Date().getFullYear()}
              <Link href="https://MtF.wiki" className="link link-hover ml-1">
                MtF.wiki
              </Link>
              <span className="ml-1">
                {sT('all-rights-reserved', language)}
              </span>
              <Link
                href="https://project-trans.org/"
                target="_blank"
                rel="noreferrer"
                className="link link-hover ml-1"
              >
                <Image
                  src="/hugo-static/new/project-trans-inline.svg"
                  alt="Project Trans"
                  width={80}
                  height={15}
                  className="h-3 w-auto inline"
                />
              </Link>
            </p>
          </aside>
        </div>
      </footer>
      <BottomBanner
        text={sT(
          (process.env.NEXT_PUBLIC_BANNER_TEXT as any) ||
            'banner-text-disclaimer',
          language,
        )}
        buttonText={sT(
          (process.env.NEXT_PUBLIC_BANNER_BUTTON_TEXT as any) ||
            'banner-button-text-disclaimer',
          language,
        )}
        buttonLink={
          sTryT(
            (process.env.NEXT_PUBLIC_BANNER_BUTTON_LINK as any) ||
              'banner-button-link-disclaimer',
            language,
          ) || null
        }
        closeButtonText={sT(
          (process.env.NEXT_PUBLIC_BANNER_CLOSE_BUTTON_TEXT as any) ||
            'banner-button-text-close',
          language,
        )}
        language={language}
      />
    </div>
  );
}
