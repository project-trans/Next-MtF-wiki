'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { getThemeConfig } from './site-config';

// 主题偏好设置 atom (存储在本地存储中)
// 数据仅存储在浏览器本地，不会上传到服务器
export const themePreferenceAtom = atomWithStorage<string>(
  'mtf-wiki-theme-preference',
  getThemeConfig().defaultTheme,
);

// 当前实际应用的主题 atom (用于显示状态)
export const currentThemeAtom = atom<string>('system');

// 主题菜单展开状态
export const themeMenuOpenAtom = atom<boolean>(false);
