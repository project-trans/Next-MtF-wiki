'use client';

import { useAtom } from 'jotai';
import { ArrowUpDown, Calculator, Check, Copy, Info, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { type TranslationKey, t } from '@/lib/i18n/client';
import { addHistoryRecordAtom, conversionStateAtom } from '../lib/atoms';
import type { HormoneType } from '../lib/types';
import { formatValue, isIUStandard, performConversion } from '../lib/utils';
import { RangeIndicator } from './RangeIndicator';
import { UnitSelector } from './UnitSelector';

function isIUToMassConversion(fromUnit: string, toUnit: string): boolean {
  const fromIsIU = isIUStandard(fromUnit);
  const toIsIU = isIUStandard(toUnit);

  return fromIsIU !== toIsIU;
}

interface HormoneCardProps {
  hormone: HormoneType;
  language: string;
}

export function HormoneCard({ hormone, language }: HormoneCardProps) {
  const [state, setState] = useAtom(conversionStateAtom);
  const [, addHistoryRecord] = useAtom(addHistoryRecordAtom);
  const [isConverting, setIsConverting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = state.selectedHormone === hormone.id;

  const pendingResult = useRef<any>(null);

  useEffect(() => {
    if (isSelected && state.fromUnit && state.toUnit) {
      const fromUnitExists = hormone.units.some(
        (u) => u.symbol === state.fromUnit,
      );
      const toUnitExists = hormone.units.some((u) => u.symbol === state.toUnit);

      if (!fromUnitExists || !toUnitExists) {
        setState((prev) => ({
          ...prev,
          fromUnit: hormone.units[0].symbol,
          toUnit: hormone.units[1]?.symbol || hormone.units[0].symbol,
          result: null,
        }));
      }
    }
  }, [hormone, isSelected, state.fromUnit, state.toUnit, setState]);

  useEffect(() => {
    if (pendingResult.current) {
      clearTimeout(pendingResult.current);
      pendingResult.current = null;
    }

    if (!isSelected) return;

    const trimmedInput = state.inputValue.trim();

    function setErrorState() {
      setState((prev) => ({
        ...prev,
        result: {
          value: 0,
          unit: state.toUnit,
          isValid: false,
        },
      }));
      setIsConverting(false);
    }
    if (trimmedInput && !inputRef.current?.checkValidity()) {
      setErrorState();
    } else if (trimmedInput && !Number.isNaN(Number.parseFloat(trimmedInput))) {
      setIsConverting(true);

      pendingResult.current = setTimeout(() => {
        const result = performConversion(
          state.inputValue,
          state.fromUnit,
          state.toUnit,
          hormone.id,
        );
        setState((prev) => ({ ...prev, result }));
        setIsConverting(false);
        pendingResult.current = null;
      }, 200);
    } else if (trimmedInput) {
      setErrorState();
    } else {
      setState((prev) => ({ ...prev, result: null }));
      setIsConverting(false);
    }
  }, [
    hormone.id,
    state.fromUnit,
    state.toUnit,
    state.inputValue,
    isSelected,
    setState,
  ]);

  const handleInputChange = (value: string) => {
    setState((prev) => ({ ...prev, inputValue: value }));
  };

  const handleUnitChange = (type: 'from' | 'to', unit: string) => {
    setState((prev) => ({
      ...prev,
      [type === 'from' ? 'fromUnit' : 'toUnit']: unit,
    }));
  };

  const swapUnits = () => {
    const newFromUnit = state.toUnit;
    const newToUnit = state.fromUnit;
    const newInputValue = state.result?.isValid
      ? formatValue(state.result.value)
      : '';

    setState((prev) => ({
      ...prev,
      fromUnit: newFromUnit,
      toUnit: newToUnit,
      inputValue: newInputValue,
      result: null,
    }));

    if (newInputValue && !Number.isNaN(Number.parseFloat(newInputValue))) {
      setIsConverting(true);
      clearTimeout(pendingResult.current);
      pendingResult.current = setTimeout(() => {
        const result = performConversion(
          newInputValue,
          newFromUnit,
          newToUnit,
          hormone.id,
        );
        setState((prev) => ({ ...prev, result }));
        setIsConverting(false);
      }, 200);
    }
  };

  const copyResult = async () => {
    if (state.result?.isValid) {
      const resultText = `${formatValue(state.result.value)} ${state.toUnit}`;
      try {
        await navigator.clipboard.writeText(resultText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const saveToHistory = () => {
    if (
      state.result?.isValid &&
      state.inputValue.trim() &&
      Number.parseFloat(state.inputValue) > 0
    ) {
      addHistoryRecord({
        hormoneId: hormone.id,
        fromValue: Number.parseFloat(state.inputValue),
        fromUnit: state.fromUnit,
        toValue: state.result.value,
        toUnit: state.toUnit,
      });
    }
  };

  const clearInput = () => {
    setState((prev) => ({
      ...prev,
      inputValue: '',
      result: null,
    }));
  };

  if (!isSelected) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-base-100 rounded-xl border border-base-300/30 overflow-hidden shadow-sm"
    >
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 md:p-6 border-b border-base-300/30">
        <h3 className="text-xl font-semibold text-base-content">
          {t(hormone.name as TranslationKey, language)}
        </h3>
      </div>

      <div className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-3 md:space-y-4">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
            <label className="block text-sm font-medium text-base-content">
              {t('conv-input-value', language)}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  value={state.inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={t('conv-input-placeholder', language) as string}
                  className="input input-bordered w-full pr-10 text-base"
                  min="0"
                />
                {state.inputValue && (
                  <motion.button
                    onClick={clearInput}
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={t('conv-clear-input', language) as string}
                  >
                    <X className="w-3 h-3" />
                  </motion.button>
                )}
              </div>
              <UnitSelector
                value={state.fromUnit}
                onChange={(unit) => handleUnitChange('from', unit)}
                units={hormone.units}
                language={language}
                className="w-fit"
              />
            </div>
          </div>

          <div className="flex items-center justify-center mb-0">
            <motion.button
              onClick={swapUnits}
              className="btn btn-circle btn-ghost"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={t('conv-swap-units', language) as string}
            >
              <ArrowUpDown className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="space-y-4">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
            <label className="block text-sm font-medium text-base-content">
              {t('conv-result-label', language)}
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 p-4 bg-base-200/50 rounded-lg border border-base-300/30 min-h-[60px] flex items-center max-w-full">
                {isConverting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'linear',
                    }}
                    className="loading loading-spinner loading-md mx-auto"
                  />
                ) : (
                  <span className="font-mono text-2xl font-semibold text-base-content overflow-auto">
                    {state.result?.isValid
                      ? formatValue(state.result.value)
                      : '—'}
                  </span>
                )}
              </div>
              {state.result?.isValid && (
                <motion.button
                  onClick={copyResult}
                  className="btn btn-ghost btn-square"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={t('conv-copy-result', language) as string}
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </motion.button>
              )}
              <UnitSelector
                value={state.toUnit}
                onChange={(unit) => handleUnitChange('to', unit)}
                units={hormone.units}
                language={language}
                className="w-fit"
              />
            </div>

            {isIUToMassConversion(state.fromUnit, state.toUnit) && (
              <div className="alert alert-info alert-soft">
                <Info className="w-6 h-6" />
                <span className="text-sm">
                  {t('conv-iu-mass-warning', language)}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <motion.button
              disabled={!state.result?.isValid || isConverting}
              onClick={saveToHistory}
              className="btn btn-primary gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Calculator className="w-4 h-4" />
              {t('conv-convert', language)}
            </motion.button>
          </div>
        </div>

        <RangeIndicator
          ranges={state.result?.ranges}
          isVisible={state.result?.isValid === true}
          language={language}
        />
      </div>
    </motion.div>
  );
}
