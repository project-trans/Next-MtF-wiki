'use client';

import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem={true}
      themes={['system', 'light', 'dark']}
      value={{ dark: 'sunset', light: 'cupcake' }}
    >
      <SyncThemeColor />
      {children}
    </NextThemeProvider>
  );
}

function getBgColor() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--background')
    .trim();
}

// 这个组件监听 next-themes 的 theme 变更，然后更新 meta 标签
function SyncThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    requestAnimationFrame(() => {
      if (!resolvedTheme) return;

      let tag = document.getElementById('theme-color') as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = 'theme-color';
        tag.id = 'theme-color';
        document.head.appendChild(tag);
      }
      tag.content = getBgColor();
    });
  }, [resolvedTheme]);

  return null;
}
