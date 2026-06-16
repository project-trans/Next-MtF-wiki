'use client';

import { useAtom } from 'jotai';
import { Calculator } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from '@/components/progress';
import { type TranslationKey, t } from '@/lib/i18n/client';
import { conversionStateAtom } from '../lib/atoms';
import type { HormoneType } from '../lib/types';
import {
  areUnitsEquivalent,
  convertRangeToUnit,
  formatRangeText,
  isIUStandard,
} from '../lib/utils';
import { ConversionTooltip } from './ConversionTooltip';

interface ReferenceRangesProps {
  hormone: HormoneType;
  language: string;
}

function shouldSkipUnitConversion(
  rangeUnit: string,
  fromUnit: string,
  toUnit: string,
): boolean {
  const rangeIsIU = isIUStandard(rangeUnit);
  const fromIsIU = isIUStandard(fromUnit);
  const toIsIU = isIUStandard(toUnit);

  if (rangeIsIU === fromIsIU && rangeIsIU === toIsIU) {
    return false;
  }

  return true;
}

function shouldShowConversionTooltip(
  rangeUnit: string,
  displayUnit: string,
  hormone: HormoneType,
): boolean {
  if (rangeUnit === displayUnit) {
    return false;
  }

  if (areUnitsEquivalent(hormone, rangeUnit, displayUnit)) {
    return false;
  }

  return true;
}

export function ReferenceRanges({ hormone, language }: ReferenceRangesProps) {
  const [state] = useAtom(conversionStateAtom);

  const fromUnit = state.fromUnit;
  const toUnit = state.toUnit;

  const unitsAreEquivalent = areUnitsEquivalent(hormone, fromUnit, toUnit);

  const visibleRanges = hormone.ranges.filter(
    (range) => range.isVisible !== false,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-base-100/30 rounded-xl p-6 border border-base-300/30 h-fit overflow-x-clip shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-info" />
        <h3 className="text-lg font-semibold">
          {t('conv-reference-ranges', language)}
        </h3>
      </div>
      {visibleRanges.length > 0 ? (
        <div className="space-y-4">
          {visibleRanges.map((range, index) => {
            const fromUnitRange = convertRangeToUnit(range, fromUnit, hormone);
            const toUnitRange = convertRangeToUnit(range, toUnit, hormone);

            return (
              <motion.div
                key={`${range.label}-${range.unit}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + 0.1 * index, duration: 0.3 }}
                className={`p-4 rounded-lg border-l-4 ${
                  range.color === 'success'
                    ? 'border-success bg-success/10'
                    : range.color === 'warning'
                      ? 'border-warning bg-warning/10'
                      : range.color === 'error'
                        ? 'border-error bg-error/10'
                        : 'border-info bg-info/10'
                }`}
              >
                <div className="font-medium text-base-content">
                  {t(range.label as TranslationKey, language)}
                </div>
                <div className="text-sm text-base-content/70 mt-1">
                  {!fromUnitRange ||
                  !toUnitRange ||
                  shouldSkipUnitConversion(range.unit, fromUnit, toUnit) ? (
                    <>
                      {formatRangeText(range.min, range.max, range.hideMax)}{' '}
                      {range.unit}
                    </>
                  ) : unitsAreEquivalent ? (
                    <>
                      {formatRangeText(
                        fromUnitRange.min,
                        fromUnitRange.max,
                        range.hideMax,
                      )}{' '}
                      {fromUnit}
                      <ConversionTooltip
                        originalRange={range}
                        isVisible={shouldShowConversionTooltip(
                          range.unit,
                          fromUnit,
                          hormone,
                        )}
                        language={language}
                      />
                    </>
                  ) : (
                    <>
                      {formatRangeText(
                        fromUnitRange.min,
                        fromUnitRange.max,
                        range.hideMax,
                      )}{' '}
                      {fromUnit}
                      <ConversionTooltip
                        originalRange={range}
                        isVisible={shouldShowConversionTooltip(
                          range.unit,
                          fromUnit,
                          hormone,
                        )}
                        language={language}
                      />
                      <span className="text-base-content/50 mx-2">|</span>
                      {formatRangeText(
                        toUnitRange.min,
                        toUnitRange.max,
                        range.hideMax,
                      )}{' '}
                      {toUnit}
                      <ConversionTooltip
                        originalRange={range}
                        isVisible={shouldShowConversionTooltip(
                          range.unit,
                          toUnit,
                          hormone,
                        )}
                        language={language}
                      />
                    </>
                  )}
                </div>
                {range.description && (
                  <div className="text-xs text-base-content/60 mt-1">
                    {t(range.description as TranslationKey, language)}
                  </div>
                )}
                {range.source && (
                  <div className="text-xs text-base-content/50 mt-1 italic">
                    {t('conv-data-source', language)}：
                    <Link
                      href={range.source.url.replace(
                        '/zh-cn/',
                        `/${language}/`,
                      )}
                      className="link link-primary hover:link-accent transition-colors"
                      rel="noopener noreferrer"
                    >
                      {t(range.source.name as TranslationKey, language)}
                    </Link>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-base-content/60">
          {t('conv-no-ranges', language)}
        </div>
      )}
    </motion.div>
  );
}
