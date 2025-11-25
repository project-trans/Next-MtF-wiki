'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { CupResult, HistoryRecord, MeasurementData } from './types';

// 测量数据 atom
export const measurementsAtom = atom<MeasurementData>({
  underBustRelaxed: null,
  underBustExhale: null,
  bustRelaxed: null,
  bustBend45: null,
  bustBend90: null,
});

// 计算结果 atom
export const resultAtom = atom<CupResult | null>(null);

// 历史记录 atom (存储在本地存储中)
export const historyAtom = atomWithStorage<HistoryRecord[]>(
  'cup-calculator-history',
  [],
);

// 显示历史面板的状态
export const showHistoryAtom = atom<boolean>(false);

// 添加历史记录的 atom
export const addHistoryRecordAtom = atom(
  null,
  (get, set, record: Omit<HistoryRecord, 'id' | 'timestamp'>) => {
    const history = get(historyAtom);
    const newRecord: HistoryRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    set(historyAtom, [newRecord, ...history.slice(0, 49)]); // 保留最近50条记录
  },
);

// 清除历史记录的 atom
export const clearHistoryAtom = atom(null, (_get, set) => {
  set(historyAtom, []);
});
