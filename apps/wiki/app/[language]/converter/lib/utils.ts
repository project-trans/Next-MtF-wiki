import { format } from 'd3-format';
import { t } from '@/lib/i18n/client';
import { HORMONES } from './constants';
import type {
  ConversionResult,
  HormoneRange,
  HormoneType,
  HormoneUnit,
} from './types';
/**
 * 获取激素类型
 */
export function getHormoneById(id: string): HormoneType | undefined {
  return HORMONES.find((hormone) => hormone.id === id);
}

/**
 * 获取单位信息
 */
export function getUnitBySymbol(
  hormone: HormoneType,
  symbol: string,
): HormoneUnit | undefined {
  return hormone.units.find((unit) => unit.symbol === symbol);
}

/**
 * 执行单位转换
 */
export function convertHormoneValue(
  value: number,
  fromUnit: string,
  toUnit: string,
  hormone: HormoneType,
): number {
  const fromUnitInfo = getUnitBySymbol(hormone, fromUnit);
  const toUnitInfo = getUnitBySymbol(hormone, toUnit);

  if (!fromUnitInfo || !toUnitInfo) {
    throw new Error('Invalid unit');
  }

  // 转换为基础单位
  const baseValue = value * fromUnitInfo.multiplier;

  // 从基础单位转换为目标单位
  const result = baseValue / toUnitInfo.multiplier;

  return result;
}

/**
 * 检查数值是否在合理范围内，返回所有符合的范围
 */
export function checkValueRanges(
  value: number,
  unit: string,
  hormone: HormoneType,
): HormoneRange[] {
  // 将值转换为基础单位进行比较
  const unitInfo = getUnitBySymbol(hormone, unit);
  if (!unitInfo) return [];

  const baseValue = value * unitInfo.multiplier;
  const matchingRanges: HormoneRange[] = [];

  // 查找所有匹配的范围
  for (const range of hormone.ranges) {
    const rangeUnitInfo = getUnitBySymbol(hormone, range.unit);
    if (!rangeUnitInfo) continue;

    const rangeMinBase = range.min * rangeUnitInfo.multiplier;
    const rangeMaxBase = range.max * rangeUnitInfo.multiplier;

    if (baseValue >= rangeMinBase && baseValue <= rangeMaxBase) {
      matchingRanges.push(range);
    }
  }

  return matchingRanges;
}

/**
 * 执行完整的转换并返回结果
 */
export function performConversion(
  inputValue: string,
  fromUnit: string,
  toUnit: string,
  hormoneId: string,
): ConversionResult {
  const hormone = getHormoneById(hormoneId);
  if (!hormone) {
    return { value: 0, unit: toUnit, isValid: false };
  }

  const numValue = Number.parseFloat(inputValue);
  if (Number.isNaN(numValue) || numValue < 0) {
    return { value: 0, unit: toUnit, isValid: false };
  }

  try {
    const convertedValue = convertHormoneValue(
      numValue,
      fromUnit,
      toUnit,
      hormone,
    );
    const ranges = checkValueRanges(convertedValue, toUnit, hormone);

    return {
      value: convertedValue,
      unit: toUnit,
      isValid: true,
      ranges,
    };
  } catch (error) {
    return { value: 0, unit: toUnit, isValid: false };
  }
}

/**
 * 格式化数值显示
 */
export function formatValue(value: number): string {
  if (value === 0) return '0';

  return format('.4~r')(value);
}

/**
 * 判断单位是否为IU（国际单位）标准
 */
export function isIUStandard(unit: string): boolean {
  const iuUnits = ['mIU/mL', 'IU/L', 'mIU/L', 'μIU/mL', 'μIU/L'];
  return iuUnits.includes(unit);
}

/**
 * 检查两个单位是否等价（multiplier相同）
 */
export function areUnitsEquivalent(
  hormone: HormoneType,
  unit1: string,
  unit2: string,
): boolean {
  const unit1Info = getUnitBySymbol(hormone, unit1);
  const unit2Info = getUnitBySymbol(hormone, unit2);

  if (!unit1Info || !unit2Info) return false;

  // 比较multiplier值，考虑浮点数精度
  return Math.abs(unit1Info.multiplier - unit2Info.multiplier) < 1e-10;
}

/**
 * 将参考范围转换为指定单位
 */
export function convertRangeToUnit(
  range: HormoneRange,
  targetUnit: string,
  hormone: HormoneType,
): { min: number; max: number } | null {
  try {
    const convertedMin = convertHormoneValue(
      range.min,
      range.unit,
      targetUnit,
      hormone,
    );
    const convertedMax =
      range.max === Number.POSITIVE_INFINITY
        ? Number.POSITIVE_INFINITY
        : convertHormoneValue(range.max, range.unit, targetUnit, hormone);

    return { min: convertedMin, max: convertedMax };
  } catch (error) {
    return null;
  }
}

/**
 * 格式化范围数值显示
 */
export function formatRangeValue(value: number): string {
  if (value === Number.POSITIVE_INFINITY) return '∞';
  if (value === 0) return '0';

  return format('.4~r')(value);
}

/**
 * 格式化参考范围显示文本
 */
export function formatRangeText(
  min: number,
  max: number,
  hideMax?: boolean,
): string {
  if (max === Number.POSITIVE_INFINITY || hideMax === true) {
    return `> ${formatRangeValue(min)}`;
  } else {
    return `${formatRangeValue(min)} - ${formatRangeValue(max)}`;
  }
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
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return t('time-just-now', language) as string;
  } else if (diffMins < 60) {
    return (t('time-minutes-ago', language) as string).replace(
      '{n}',
      diffMins.toString(),
    );
  } else if (diffHours < 24) {
    return (t('time-hours-ago', language) as string).replace(
      '{n}',
      diffHours.toString(),
    );
  } else if (diffDays < 7) {
    return (t('time-days-ago', language) as string).replace(
      '{n}',
      diffDays.toString(),
    );
  } else {
    return date.toLocaleDateString(LOCALE_MAP[language] || 'en-US');
  }
}
