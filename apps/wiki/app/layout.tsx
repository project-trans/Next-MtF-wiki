import type { Metadata } from 'next';
import {
  ProgressBar,
  ProgressProvider,
  SkeletonProvider,
} from '@/components/progress';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';

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
    // biome-ignore lint/a11y/useHtmlLang: no reason
    <html suppressHydrationWarning>
      <head>
        {/* 字体服务器预连接 */}
        <link rel="preconnect" href="https://fonts.project-trans.org" />
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
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
