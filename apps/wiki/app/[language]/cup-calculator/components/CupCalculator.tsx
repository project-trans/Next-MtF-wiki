'use client';

import { useAtom } from 'jotai';
import { Calculator, Clock, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
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

export function CupCalculator() {
  const [measurements, setMeasurements] = useAtom(measurementsAtom);
  const [result, setResult] = useAtom(resultAtom);
  const [, addHistoryRecord] = useAtom(addHistoryRecordAtom);
  const [, setShowHistory] = useAtom(showHistoryAtom);
  const [history] = useAtom(historyAtom);
  const [isCalculating, setIsCalculating] = useState(false);

  // 当所有测量完成时自动计算结果
  useEffect(() => {
    if (isAllMeasurementsComplete(measurements)) {
      setIsCalculating(true);

      // 添加计算动画延迟
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
    if (confirm('确定要重新开始测量吗？当前数据将被清除。')) {
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

  const handleSaveToHistory = () => {
    if (result && measurements) {
      addHistoryRecord({
        measurements,
        result,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* 说明文字 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-base-100/50 rounded-xl p-6 border border-base-300/30 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-5 h-5 text-pink-500" />
          <h2 className="text-lg font-semibold">测量说明</h2>
        </div>
        <p className="text-base-content/80 mb-4">
          <strong>运算都在您的本地完成，不收集任何数据</strong>
        </p>
        <p className="text-sm text-base-content/70">
          请准备一根软尺并面对镜子，看得到胸部。按照下面的步骤依次测量并填入数值。
        </p>
      </motion.div>

      {/* 测量步骤列表 */}
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
                请直立，放松，用软尺贴合乳房下缘
                <span
                  className="mx-1 text-pink-500 font-bold underline"
                  aria-hidden="true"
                >
                  ⊙⊙
                </span>
                ，水平绕身体一圈：
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
              <span className="text-base-content">请呼气：</span>
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
                请直立，放松，用软尺经过乳头
                <span
                  className="mx-1 text-pink-500 font-bold line-through"
                  aria-hidden="true"
                >
                  ⊙⊙
                </span>
                ，绕身体一圈：
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
              <span className="text-base-content">请俯身 45 度：</span>
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
              <span className="text-base-content">请鞠躬 90 度：</span>
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

        {/* 计算按钮 */}
        <div className="mt-4 md:mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleCalculate}
            className="btn btn-primary gap-2"
            disabled={!isAllMeasurementsComplete(measurements)}
          >
            <Calculator className="w-4 h-4" />
            计算罩杯尺寸
          </button>
        </div>
      </motion.div>

      {/* 结果显示 */}
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
            <h3 className="text-xl font-semibold mb-3 md:mb-4">计算结果</h3>
            <div
              className={`text-2xl font-bold ${
                result.isValid
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}
            >
              {result.message}
            </div>

            {result.isValid && result.fullSize && (
              <div className="mt-4 text-sm text-base-content/70">
                胸下围：{result.underBust?.toFixed(1)} cm | 罩杯差值：
                {result.cupDifference?.toFixed(1)} cm | 罩杯：{result.cupSize}
              </div>
            )}

            {/* 欧洲尺码标准 */}
            {result.isValid &&
              result.underBust &&
              result.cupDifference &&
              (() => {
                const internationalSizes = calculateInternationalSizes(
                  result.underBust,
                  result.cupDifference,
                );
                return (
                  internationalSizes && (
                    <div className="mt-6 pt-4 border-t border-base-300/30">
                      <h4 className="text-sm font-medium text-base-content/80 mb-3 text-center">
                        欧洲尺码标准
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

      {/* 功能按钮 */}
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
          查看历史记录
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
          重新开始
        </button>
      </motion.div>

      {/* 历史记录面板 */}
      <HistoryPanel />
    </div>
  );
}
