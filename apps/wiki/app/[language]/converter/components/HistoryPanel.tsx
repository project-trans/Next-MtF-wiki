'use client';

import { useAtom } from 'jotai';
import { Clock, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type TranslationKey, t } from '@/lib/i18n/client';
import { clearHistoryAtom, historyAtom, showHistoryAtom } from '../lib/atoms';
import { formatTimestamp, formatValue, getHormoneById } from '../lib/utils';

interface HistoryPanelProps {
  language: string;
}

export function HistoryPanel({ language }: HistoryPanelProps) {
  const [history] = useAtom(historyAtom);
  const [, clearHistory] = useAtom(clearHistoryAtom);
  const [showHistory, setShowHistory] = useAtom(showHistoryAtom);

  if (!showHistory) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowHistory(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-base-100 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-base-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                {t('conv-history-title', language)}
              </h2>
              <span className="badge badge-primary">{history.length}</span>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearHistory()}
                  className="btn btn-ghost btn-sm text-error"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('conv-clear', language)}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="btn btn-ghost btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-base-content/60 mt-2">
            {t('conv-history-storage', language)}
          </p>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          <AnimatePresence>
            {history.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center text-base-content/60"
              >
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('conv-history-empty', language)}</p>
              </motion.div>
            ) : (
              <div className="p-4 space-y-3">
                {history.map((record, index) => {
                  const hormone = getHormoneById(record.hormoneId);
                  return (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-base-200/50 rounded-lg p-4 hover:bg-base-200/80 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-primary">
                          {hormone
                            ? t(hormone.name as TranslationKey, language)
                            : t('conv-unknown-hormone', language)}
                        </span>
                        <span className="text-xs text-base-content/60">
                          {formatTimestamp(record.timestamp, language)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-mono">
                          {formatValue(record.fromValue)} {record.fromUnit}
                        </span>
                        <span className="mx-2 text-base-content/60">→</span>
                        <span className="font-mono">
                          {formatValue(record.toValue)} {record.toUnit}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
