import { CUP_SIZES } from './constants';
import type { CupResult, InternationalBraSize, MeasurementData } from './types';

export function calculateCupSize(measurements: MeasurementData): CupResult {
  const {
    underBustRelaxed,
    underBustExhale,
    bustRelaxed,
    bustBend45,
    bustBend90,
  } = measurements;

  if (
    underBustRelaxed === null ||
    underBustExhale === null ||
    bustRelaxed === null ||
    bustBend45 === null ||
    bustBend90 === null
  ) {
    return {
      isValid: false,
      underBust: null,
      cupDifference: null,
      cupSize: null,
      bandSize: null,
      fullSize: null,
      messageKey: 'cup-msg-incomplete',
    };
  }

  if (
    Number.isNaN(underBustRelaxed) ||
    Number.isNaN(underBustExhale) ||
    Number.isNaN(bustRelaxed) ||
    Number.isNaN(bustBend45) ||
    Number.isNaN(bustBend90) ||
    underBustRelaxed <= 0 ||
    underBustExhale <= 0 ||
    bustRelaxed <= 0 ||
    bustBend45 <= 0 ||
    bustBend90 <= 0
  ) {
    return {
      isValid: false,
      underBust: null,
      cupDifference: null,
      cupSize: null,
      bandSize: null,
      fullSize: null,
      messageKey: 'cup-msg-invalid',
    };
  }

  const underBust = (underBustRelaxed + underBustExhale) / 2;
  const cupDifference = (bustRelaxed + bustBend45 + bustBend90) / 3 - underBust;

  if (cupDifference < 0) {
    return {
      isValid: false,
      underBust: underBust,
      cupDifference: cupDifference,
      cupSize: null,
      bandSize: null,
      fullSize: null,
      messageKey: 'cup-msg-recheck',
    };
  }

  let cupInfo = null;

  for (let i = 0; i < CUP_SIZES.length; i++) {
    if (cupDifference <= CUP_SIZES[i].threshold) {
      cupInfo = CUP_SIZES[i];
      break;
    }
  }

  if (!cupInfo) {
    return {
      isValid: false,
      underBust,
      cupDifference,
      cupSize: null,
      bandSize: null,
      fullSize: null,
      messageKey: 'cup-msg-out-of-range',
    };
  }

  const bandSize = Math.ceil(underBust / 5) * 5;
  const fullSize = `${bandSize}${cupInfo.size}`;

  if (cupInfo.messageKey) {
    return {
      isValid: true,
      underBust,
      cupDifference,
      cupSize: cupInfo.size,
      bandSize,
      fullSize,
      messageKey: cupInfo.messageKey,
    };
  }

  return {
    isValid: true,
    underBust,
    cupDifference,
    cupSize: cupInfo.size,
    bandSize,
    fullSize,
    messageKey: 'cup-msg-result',
  };
}

export function formatValue(value: number | null): string {
  if (value === null) return '—';
  return value.toFixed(1);
}

export function validateInput(value: string): {
  isValid: boolean;
  numValue: number | null;
} {
  if (!value.trim()) {
    return { isValid: false, numValue: null };
  }

  const numValue = Number.parseFloat(value);
  if (Number.isNaN(numValue) || numValue <= 0 || numValue > 200) {
    return { isValid: false, numValue: null };
  }

  return { isValid: true, numValue };
}

export function isAllMeasurementsComplete(
  measurements: MeasurementData,
): boolean {
  return Object.values(measurements).every(
    (value) => value !== null && !Number.isNaN(value),
  );
}

const LOCALE_MAP: Record<string, string> = {
  'zh-cn': 'zh-CN',
  'zh-hant': 'zh-TW',
  ja: 'ja-JP',
  en: 'en-US',
  es: 'es-ES',
};

export function formatTimestamp(timestamp: number, language = 'zh-cn'): string {
  const date = new Date(timestamp);
  return date.toLocaleString(LOCALE_MAP[language] || 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateInternationalSizes(
  underBust: number,
  cupDifference: number,
  belowAALabel = 'AA-',
): InternationalBraSize | null {
  if (!underBust || !cupDifference || underBust <= 0 || cupDifference <= 0) {
    return null;
  }

  let europeCupLetter: string;
  if (cupDifference < 10) europeCupLetter = belowAALabel;
  else if (cupDifference <= 12) europeCupLetter = 'AA';
  else if (cupDifference <= 14) europeCupLetter = 'A';
  else if (cupDifference <= 16) europeCupLetter = 'B';
  else if (cupDifference <= 18) europeCupLetter = 'C';
  else if (cupDifference <= 20) europeCupLetter = 'D';
  else if (cupDifference <= 22) europeCupLetter = 'E';
  else if (cupDifference <= 24) europeCupLetter = 'F';
  else if (cupDifference <= 26) europeCupLetter = 'G';
  else if (cupDifference <= 28) europeCupLetter = 'H';
  else europeCupLetter = 'I+';

  const europeBand = Math.ceil(underBust / 5) * 5;

  return {
    europe: `${europeBand}${europeCupLetter}`,
  };
}
