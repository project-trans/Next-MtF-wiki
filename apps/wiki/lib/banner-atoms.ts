'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Banner 关闭状态和时间戳的存储
export interface BannerCloseData {
  closedAt: number; // 时间戳
}

// Banner 关闭状态 atom (存储在本地存储中)
export const bannerCloseAtom = atomWithStorage<BannerCloseData>(
  'mtf-wiki-banner-close',
  { closedAt: 0 },
);

// 计算 banner 是否应该显示的 derived atom
export const bannerVisibilityAtom = atom<boolean>((get) => {
  const closeData = get(bannerCloseAtom);

  // 检查是否已经过了一个月 (30天)
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (now - closeData.closedAt > oneMonthMs) {
    // 超过一个月，重置状态
    return true;
  }

  return false;
});

// Banner 高度 atom，用于其他组件调整位置
export const bannerHeightAtom = atom<number>(0);

// 关闭 banner 的 action atom
export const closeBannerAtom = atom(null, (get, set) => {
  set(bannerCloseAtom, {
    closedAt: Date.now(),
  });
});
