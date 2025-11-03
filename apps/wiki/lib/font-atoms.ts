'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// 字体基础 URL
export const FONTS_BASE_URL = 'https://fonts.project-trans.org/';

// API 返回的字体数据类型
export type FontData = {
  paths: string[];
  fontFamily: string;
};

// 字体映射类型
export type FontsMap = Record<string, FontData>;

// 可用的字体选项（用于 UI 显示）
export type FontOption = {
  key: string;
  value: string;
  displayName: string;
  fontFamily: string;
};

// 字体偏好设置 atom (存储在本地存储中)
export const fontPreferenceAtom = atomWithStorage<string>(
  'activeFont',
  '默认字体',
);

// 当前实际应用的字体 atom
export const currentFontAtom = atom<string>('默认字体');

// 字体菜单展开状态
export const fontMenuOpenAtom = atom<boolean>(false);

// 字体数据 atom
export const fontsMapAtom = atom<FontsMap | null>(null);

// 字体选项 atom（从 fontsMap 派生）
export const fontOptionsAtom = atom<FontOption[]>((get) => {
  const fontsMap = get(fontsMapAtom);
  if (!fontsMap) return [];

  return Object.entries(fontsMap).map(([displayName, data]) => ({
    key: displayName,
    value: displayName,
    displayName,
    fontFamily: data.fontFamily,
  }));
});

// 获取字体数据
export function getFontData(
  fontsMap: FontsMap | null,
  fontName: string,
): FontData | null {
  if (!fontsMap || !fontsMap[fontName]) {
    return null;
  }
  return fontsMap[fontName];
}
