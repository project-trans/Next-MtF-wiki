'use client';
import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { languageAtom } from './LanguageSwitcher';

export default function HomeRedirect({
  languageConfigs,
}: {
  languageConfigs: { code: string; name: string }[];
}) {
  const router = useRouter();

  const [language] = useAtom(languageAtom);

  useEffect(() => {
    const detectAndRedirect = async () => {
      try {
        if (language) {
          return router.replace(`/${language}`);
        }

        // 获取用户浏览器语言偏好
        const userLanguages = navigator.languages || [navigator.language];

        // 默认语言（如果没有匹配到任何语言）
        let targetLanguage = 'zh-cn';

        // 遍历用户的语言偏好，找到第一个匹配的语言
        for (const userLang of userLanguages) {
          // 标准化语言代码（处理 zh-CN, zh-TW 等格式）
          const normalizedLang = userLang.toLowerCase();

          // 直接匹配
          if (
            languageConfigs.some((config) => config.code === normalizedLang)
          ) {
            targetLanguage = normalizedLang;
            break;
          }

          // 处理特殊的语言映射
          if (normalizedLang.startsWith('zh')) {
            if (
              normalizedLang.includes('tw') ||
              normalizedLang.includes('hk') ||
              normalizedLang.includes('hant')
            ) {
              if (languageConfigs.some((config) => config.code === 'zh-hant')) {
                targetLanguage = 'zh-hant';
                break;
              }
            } else if (
              normalizedLang.includes('cn') ||
              normalizedLang.includes('hans')
            ) {
              if (languageConfigs.some((config) => config.code === 'zh-cn')) {
                targetLanguage = 'zh-cn';
                break;
              }
            }
          }

          // 处理主要语言代码（取前两位）
          const mainLang = normalizedLang.split('-')[0];
          if (languageConfigs.some((config) => config.code === mainLang)) {
            targetLanguage = mainLang;
            break;
          }
        }

        // 重定向到检测到的语言页面
        router.replace(`/${targetLanguage}`);
      } catch (error) {
        console.error('语言检测失败，重定向到默认语言:', error);
        // 发生错误时重定向到默认语言
        router.replace('/zh-cn');
      } finally {
        if (typeof window !== 'undefined') {
          if ((window as any).HomeRedirectWikiRedirectTimeout) {
            clearTimeout((window as any).HomeRedirectWikiRedirectTimeout);
            (window as any).HomeRedirectWikiRedirectTimeout = null;
          }
        }
      }
    };

    detectAndRedirect();
  });

  // 显示加载状态（模拟layout结构）
  return (
    <>
      {/* JavaScript 可用时显示的加载状态 */}
      <div className="flex flex-col absolute top-0 left-0 w-full h-full bg-gradient-to-br from-base-100 to-base-200 overflow-hidden">
        {/* 顶部导航栏骨架 */}
        <header className="lg:sticky lg:top-0 z-49 border-b bg-base-100/80 backdrop-blur-xl border-base-300/50 shadow-sm">
          <div className="container flex items-center justify-between px-6 py-4 mx-auto">
            <div className="flex items-center space-x-8">
              <div className="skeleton h-9 w-32" />
              <nav className="hidden space-x-8 md:flex">
                <div className="skeleton h-8 w-16" />
                <div className="skeleton h-8 w-20" />
                <div className="skeleton h-8 w-16" />
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="skeleton h-8 w-48 hidden xl:block" />
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="skeleton h-8 w-20" />
            </div>
          </div>

          {/* 移动端导航菜单骨架 */}
          <div className="border-t md:hidden border-base-300/50">
            <nav className="flex px-6 py-3 space-x-6 overflow-x-auto">
              <div className="skeleton h-8 w-16" />
              <div className="skeleton h-8 w-20" />
              <div className="skeleton h-8 w-16" />
            </nav>
          </div>
        </header>

        {/* 主要内容区域骨架 */}
        <main className="flex-1 container px-6 py-8 mx-auto">
          <div className="hero min-h-[70vh] bg-base-200 rounded-lg">
            <div className="text-center hero-content">
              <div className="max-w-md space-y-6">
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-4 w-3/4 mx-auto" />
                <div className="skeleton h-12 w-32 mx-auto rounded-btn" />
              </div>
            </div>
          </div>
        </main>

        {/* 页脚骨架 */}
        <footer className="border-t bg-gradient-to-r from-base-200 to-base-300 border-base-300">
          <div className="container px-6 py-8 mx-auto">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="space-y-4">
                <div className="skeleton h-8 w-24" />
                <div className="skeleton h-4 w-full" />
              </div>
              <div className="space-y-4">
                <div className="skeleton h-6 w-20" />
                <div className="space-y-2">
                  <div className="skeleton h-4 w-16" />
                  <div className="skeleton h-4 w-20" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="skeleton h-6 w-16" />
                <div className="skeleton h-4 w-full" />
              </div>
            </div>
            <div className="pt-6 mt-8 text-center border-t border-base-300">
              <div className="skeleton h-4 w-48 mx-auto" />
            </div>
          </div>
        </footer>
      </div>
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml:
        dangerouslySetInnerHTML={{
          __html: `
            window.HomeRedirectWikiRedirectTimeout = window.HomeRedirectWikiRedirectTimeout || window.setTimeout(() => {
              window.HomeRedirectWikiRedirectTimeout = null;
              window.location.href = '/zh-cn';
            }, 5000);
          `,
        }}
      />

      {/* JavaScript 不可用时显示的 fallback 页面 */}
      <noscript>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-base-100 to-base-200 absolute top-0 left-0 w-full h-full z-50">
          <div className="hero min-h-[70vh] bg-base-200 rounded-lg">
            <div className="text-center hero-content">
              <div className="max-w-2xl space-y-8">
                <h1 className="text-4xl font-bold text-base-content">
                  MtF Wiki
                </h1>
                <p className="text-lg text-base-content/70">
                  请选择您的语言 / Please select your language
                </p>

                {/* 语言选择链接 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl">
                  {languageConfigs.map((config) => (
                    <a
                      key={config.code}
                      href={`/${config.code}`}
                      className="btn btn-outline btn-lg"
                    >
                      {config.name}
                    </a>
                  ))}
                </div>

                <div className="text-sm text-base-content/50">
                  <p>
                    JavaScript 已被禁用。请启用 JavaScript 以获得更好的体验。
                  </p>
                  <p>
                    JavaScript is disabled. Please enable JavaScript for a
                    better experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </noscript>
    </>
  );
}
