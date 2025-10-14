import { ThemeProvider } from '@/components/ThemeProvider';
import {
  ProgressBar,
  ProgressProvider,
  SkeletonProvider,
} from '@/components/progress';
import type { Metadata } from 'next';
import './globals.css';

import { Provider as JotaiProvider } from 'jotai';

export const metadata: Metadata = {
  title: 'MtF.wiki',
  icons: {
    apple: {
      url: '/favicon/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    icon: [
      {
        url: '/favicon/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
  },
  manifest: '/favicon/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // biome-ignore lint/a11y/useHtmlLang:
    <html suppressHydrationWarning>
      <head>
        {/* 导入字体 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />

        {/* Google Fonts - Noto 系列 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&family=Noto+Sans+TC:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600;700&family=Noto+Serif+TC:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* 霞鹜文楷系列 */}
        <link
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.1.0/style.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.1.0/style.css"
          rel="stylesheet"
        />

        {/* 更纱黑体 */}
        <link
          href="https://cdn.jsdelivr.net/npm/sarasa-gothic@1.0.5/css/sarasa-gothic-sc-regular.css"
          rel="stylesheet"
        />

        {/* 得意黑 */}
        <link
          href="https://cdn.jsdelivr.net/npm/smiley-sans@1.1.1/smiley-sans.css"
          rel="stylesheet"
        />
      </head>
      <body className={'antialiased'}>
        <JotaiProvider>
          <ThemeProvider>
            <ProgressProvider>
              <SkeletonProvider>
                <ProgressBar className="fixed h-1 shadow-lg shadow-sky-500/20 bg-sky-500 top-0 z-50" />
                {children}
              </SkeletonProvider>
            </ProgressProvider>
          </ThemeProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
