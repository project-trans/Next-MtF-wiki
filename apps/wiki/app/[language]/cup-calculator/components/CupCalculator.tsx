'use client';

import { useAtom } from 'jotai';
import { Calculator, Clock, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { t } from '@/lib/i18n/client';
import {
  addHistoryRecordAtom,
  historyAtom,
  measurementsAtom,
  resultAtom,
  showHistoryAtom,
} from '../lib/atoms';
import {
  calculateCupSize,
  calculateInternationalSizes,
  isAllMeasurementsComplete,
  validateInput,
} from '../lib/utils';
import { HistoryPanel } from './HistoryPanel';

interface CupCalculatorProps {
  language: string;
}

export function CupCalculator({ language }: CupCalculatorProps) {
  const [measurements, setMeasurements] = useAtom(measurementsAtom);
  const [result, setResult] = useAtom(resultAtom);
  const [, addHistoryRecord] = useAtom(addHistoryRecordAtom);
  const [, setShowHistory] = useAtom(showHistoryAtom);
  const [history] = useAtom(historyAtom);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (isAllMeasurementsComplete(measurements)) {
      setIsCalculating(true);

      setTimeout(() => {
        const calculatedResult = calculateCupSize(measurements);
        setResult(calculatedResult);
        setIsCalculating(false);
      }, 300);
    } else {
      setResult(null);
    }
  }, [measurements, setResult]);

  const handleMeasurementChange = (
    stepId: keyof typeof measurements,
    value: string,
  ) => {
    const validation = validateInput(value);
    setMeasurements({
      ...measurements,
      [stepId]: validation.isValid ? validation.numValue : null,
    });
  };

  const handleReset = () => {
    if (confirm(t('cup-restart-confirm', language))) {
      setMeasurements({
        underBustRelaxed: null,
        underBustExhale: null,
        bustRelaxed: null,
        bustBend45: null,
        bustBend90: null,
      });
      setResult(null);
    }
  };

  const handleCalculate = () => {
    const calculatedResult = calculateCupSize(measurements);
    setResult(calculatedResult);

    if (calculatedResult.isValid) {
      addHistoryRecord({
        measurements,
        result: calculatedResult,
      });
    }
  };

  const formatMessage = (res: ReturnType<typeof calculateCupSize>): string => {
    const raw = t(res.messageKey as never, language) as string;
    if (res.messageKey === 'cup-msg-result' && res.fullSize) {
      return raw.replace('{size}', res.fullSize);
    }
    return raw;
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-base-100/50 rounded-xl p-6 border border-base-300/30 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-5 h-5 text-pink-500" />
          <h2 className="text-lg font-semibold">
            {t('cup-instructions-title', language)}
          </h2>
        </div>
        <p className="text-base-content/80 mb-4">
          <strong>{t('cup-local-only', language)}</strong>
        </p>
        <p className="text-sm text-base-content/70">
          {t('cup-prepare', language)}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-base-100 rounded-xl shadow-sm border border-base-300/30 p-4 md:p-6"
      >
        <ol className="space-y-3 md:space-y-4">
          <li className="flex items-center gap-4">
            <span className="text-lg font-semibold text-base-content/60">
              1.
            </span>
            <div className="flex-1">
              <span className="text-base-content">
                {t('cup-step1', language)}
                <span
                  className="mx-1 text-pink-500 font-bold underline"
                  aria-hidden="true"
                >
                  ⊙⊙
                </span>
                {t('cup-step1-suffix', language)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={measurements.underBustRelaxed?.toString() || ''}
                onChange={(e) =>
                  handleMeasurementChange('underBustRelaxed', e.target.value)
                }
                className="input input-bordered w-20 text-center"
                placeholder="0"
                min="0"
                max="200"
                step="0.1"
              />
              <span className="text-sm text-base-content/60">cm</span>
            </div>
          </li>

          <li className="flex items-center gap-4">
            <span className="text-lg font-semibold text-base-content/60">
              2.
            </span>
            <div className="flex-1">
              <span className="text-base-content">
                {t('cup-step2', language)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={measurements.underBustExhale?.toString() || ''}
                onChange={(e) =>
                  handleMeasurementChange('underBustExhale', e.target.value)
                }
                className="input input-bordered w-20 text-center"
                placeholder="0"
                min="0"
                max="200"
                step="0.1"
              />
              <span className="text-sm text-base-content/60">cm</span>
            </div>
          </li>

          <li className="flex items-center gap-4">
            <span className="text-lg font-semibold text-base-content/60">
              3.
            </span>
            <div className="flex-1">
              <span className="text-base-content">
                {t('cup-step3', language)}
                <span
                  className="mx-1 text-pink-500 font-bold line-through"
                  aria-hidden="true"
                >
                  ⊙⊙
                </span>
                {t('cup-step3-suffix', language)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={measurements.bustRelaxed?.toString() || ''}
                onChange={(e) =>
                  handleMeasurementChange('bustRelaxed', e.target.value)
                }
                className="input input-bordered w-20 text-center"
                placeholder="0"
                min="0"
                max="200"
                step="0.1"
              />
              <span className="text-sm text-base-content/60">cm</span>
            </div>
          </li>

          <li className="flex items-center gap-4">
            <span className="text-lg font-semibold text-base-content/60">
              4.
            </span>
            <div className="flex-1">
              <span className="text-base-content">
                {t('cup-step4', language)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={measurements.bustBend45?.toString() || ''}
                onChange={(e) =>
                  handleMeasurementChange('bustBend45', e.target.value)
                }
                className="input input-bordered w-20 text-center"
                placeholder="0"
                min="0"
                max="200"
                step="0.1"
              />
              <span className="text-sm text-base-content/60">cm</span>
            </div>
          </li>

          <li className="flex items-center gap-4">
            <span className="text-lg font-semibold text-base-content/60">
              5.
            </span>
            <div className="flex-1">
              <span className="text-base-content">
                {t('cup-step5', language)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={measurements.bustBend90?.toString() || ''}
                onChange={(e) =>
                  handleMeasurementChange('bustBend90', e.target.value)
                }
                className="input input-bordered w-20 text-center"
                placeholder="0"
                min="0"
                max="200"
                step="0.1"
              />
              <span className="text-sm text-base-content/60">cm</span>
            </div>
          </li>
        </ol>

        <div className="mt-4 md:mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleCalculate}
            className="btn btn-primary gap-2"
            disabled={!isAllMeasurementsComplete(measurements)}
          >
            <Calculator className="w-4 h-4" />
            {t('cup-calculate', language)}
          </button>
        </div>
      </motion.div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 md:p-6 border ${
            result.isValid
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200/30 dark:border-green-800/30'
              : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200/30 dark:border-yellow-800/30'
          }`}
        >
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-3 md:mb-4">
              {t('cup-result-title', language)}
            </h3>
            <div
              className={`text-2xl font-bold ${
                result.isValid
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}
            >
              {formatMessage(result)}
            </div>

            {result.isValid && result.fullSize && (
              <div className="mt-4 text-sm text-base-content/70">
                {t('cup-result-underbust', language)}：
                {result.underBust?.toFixed(1)} cm |{' '}
                {t('cup-result-cup-difference', language)}：
                {result.cupDifference?.toFixed(1)} cm |{' '}
                {t('cup-result-cup', language)}：{result.cupSize}
              </div>
            )}

            {result.isValid &&
              result.underBust &&
              result.cupDifference &&
              (() => {
                const internationalSizes = calculateInternationalSizes(
                  result.underBust,
                  result.cupDifference,
                  t('cup-eu-below-aa', language) as string,
                );
                return (
                  internationalSizes && (
                    <div className="mt-6 pt-4 border-t border-base-300/30">
                      <h4 className="text-sm font-medium text-base-content/80 mb-3 text-center">
                        {t('cup-eu-standard', language)}
                      </h4>
                      <div className="text-center text-sm text-base-content/70">
                        <span className="font-mono text-base font-semibold">
                          {internationalSizes.europe}
                        </span>
                      </div>
                    </div>
                  )
                );
              })()}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center"
      >
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="btn btn-outline gap-2"
        >
          <Clock className="w-4 h-4" />
          {t('cup-history', language)}
          {history.length > 0 && (
            <span className="badge badge-primary badge-sm">
              {history.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-outline gap-2 text-warning hover:bg-warning/10"
        >
          <RotateCcw className="w-4 h-4" />
          {t('cup-restart', language)}
        </button>
      </motion.div>

      <HistoryPanel language={language} />
    </div>
  );
}
