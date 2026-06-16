import type { CupSizeInfo } from './types';

export const CUP_SIZES: CupSizeInfo[] = [
  { threshold: 4.999999, size: 'AA-', messageKey: 'cup-msg-too-small' }, // < 5
  { threshold: 7.5, size: 'AA', messageKey: 'cup-msg-aa' },
  { threshold: 10, size: 'A', messageKey: '' },
  { threshold: 12.5, size: 'B', messageKey: '' },
  { threshold: 15, size: 'C', messageKey: '' },
  { threshold: 17.5, size: 'D', messageKey: '' },
  { threshold: 20, size: 'E', messageKey: '' },
  {
    threshold: Number.POSITIVE_INFINITY,
    size: 'E+',
    messageKey: 'cup-msg-too-large',
  },
];
