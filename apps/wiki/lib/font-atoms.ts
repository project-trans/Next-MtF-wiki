'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// 可用的字体选项
export type FontOption = {
  key: string;
  value: string;
  labelKey: string;
  descriptionKey: string;
  fontFamily: string;
};

// 默认字体选项
export const fontOptions: FontOption[] = [
  {
    key: 'system',
    value: 'system',
    labelKey: 'fontSystem',
    descriptionKey: 'fontSystemDesc',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  {
    key: 'songti',
    value: 'songti',
    labelKey: 'fontSongti',
    descriptionKey: 'fontSongtiDesc',
    fontFamily: '"Noto Serif SC", "Noto Serif TC", SimSun, "宋体", serif',
  },
  {
    key: 'heiti',
    value: 'heiti',
    labelKey: 'fontHeiti',
    descriptionKey: 'fontHeitiDesc',
    fontFamily: '"Noto Sans SC", "Noto Sans TC", SimHei, "黑体", sans-serif',
  },
  {
    key: 'source-han-serif',
    value: 'source-han-serif',
    labelKey: 'fontSourceHanSerif',
    descriptionKey: 'fontSourceHanSerifDesc',
    fontFamily:
      '"Source Han Serif SC", "Source Han Serif TC", "Noto Serif SC", serif',
  },
  {
    key: 'sarasa-gothic',
    value: 'sarasa-gothic',
    labelKey: 'fontSarasaGothic',
    descriptionKey: 'fontSarasaGothicDesc',
    fontFamily: '"Sarasa Gothic SC", "Sarasa Gothic TC", sans-serif',
  },
  {
    key: 'lxgw-bright',
    value: 'lxgw-bright',
    labelKey: 'fontLxgwBright',
    descriptionKey: 'fontLxgwBrightDesc',
    fontFamily: '"LXGW Bright", "霞鹜新晰黑", sans-serif',
  },
  {
    key: 'lxgw-wenkai-mono',
    value: 'lxgw-wenkai-mono',
    labelKey: 'fontLxgwWenkaiMono',
    descriptionKey: 'fontLxgwWenkaiMonoDesc',
    fontFamily: '"LXGW WenKai Mono", "霞鹜文楷 Mono", monospace',
  },
  {
    key: 'lxgw-wenkai',
    value: 'lxgw-wenkai',
    labelKey: 'fontLxgwWenkai',
    descriptionKey: 'fontLxgwWenkaiDesc',
    fontFamily: '"LXGW WenKai", "霞鹜文楷", sans-serif',
  },
  {
    key: 'lxgw-bright-code',
    value: 'lxgw-bright-code',
    labelKey: 'fontLxgwBrightCode',
    descriptionKey: 'fontLxgwBrightCodeDesc',
    fontFamily: '"LXGW Bright Code", "新晰黑 Code", monospace',
  },
  {
    key: 'smiley-sans',
    value: 'smiley-sans',
    labelKey: 'fontSmileySans',
    descriptionKey: 'fontSmileySansDesc',
    fontFamily: '"Smiley Sans", "得意黑", sans-serif',
  },
];

// 字体偏好设置 atom (存储在本地存储中)
export const fontPreferenceAtom = atomWithStorage<string>(
  'mtf-wiki-font-preference',
  'system',
);

// 当前实际应用的字体 atom
export const currentFontAtom = atom<string>('system');

// 字体菜单展开状态
export const fontMenuOpenAtom = atom<boolean>(false);

// 获取字体选项
export function getFontOption(value: string): FontOption {
  return fontOptions.find((option) => option.value === value) || fontOptions[0];
}
