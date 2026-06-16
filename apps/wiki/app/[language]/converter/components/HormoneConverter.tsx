'use client';

import { useAtom } from 'jotai';
import { Beaker, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type TranslationKey, t } from '@/lib/i18n/client';
import {
  historyAtom,
  selectedHormoneAtom,
  showHistoryAtom,
} from '../lib/atoms';
import { HORMONES } from '../lib/constants';
import { HistoryPanel } from './HistoryPanel';
import { HormoneCard } from './HormoneCard';
import { ReferenceRanges } from './ReferenceRanges';

interface HormoneConverterProps {
  language: string;
}

export function HormoneConverter({ language }: HormoneConverterProps) {
  const [selectedHormone, setSelectedHormone] = useAtom(selectedHormoneAtom);
  const [, setShowHistory] = useAtom(showHistoryAtom);
  const [history] = useAtom(historyAtom);

  const selectedHormoneData = HORMONES.find((h) => h.id === selectedHormone);

  const unitsCountText = (t('conv-units-count', language) as string).replace(
    '{count}',
    '0',
  );

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-base-100/50 rounded-xl p-6 border border-base-300/30 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Beaker className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {t('conv-select-hormone', language)}
          </h2>
        </div>

        <div className="block md:hidden mb-4">
          <select
            value={selectedHormone}
            onChange={(e) => setSelectedHormone(e.target.value)}
            className="select select-bordered w-full"
          >
            {HORMONES.map((hormone) => (
              <option key={hormone.id} value={hormone.id}>
                {t(hormone.name as TranslationKey, language)}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
          {HORMONES.map((hormone) => (
            <motion.button
              key={hormone.id}
              onClick={() => setSelectedHormone(hormone.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left relative ${
                selectedHormone === hormone.id
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-base-300 hover:border-primary/50 hover:bg-base-200/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-medium text-base-content text-sm">
                {t(hormone.name as TranslationKey, language)}
              </div>
              <div className="text-xs text-base-content/60 mt-1">
                {(t('conv-units-count', language) as string).replace(
                  '{count}',
                  hormone.units.length.toString(),
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 md:gap-8">
        <div className="lg:col-span-4 space-y-4 md:space-y-8">
          <AnimatePresence>
            {selectedHormoneData && (
              <HormoneCard
                key={selectedHormone}
                hormone={selectedHormoneData}
                language={language}
              />
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-3 md:gap-4"
          >
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="btn btn-outline gap-2"
            >
              <Clock className="w-4 h-4" />
              {t('conv-view-history', language)}
              {history.length > 0 && (
                <span className="badge badge-primary badge-sm">
                  {history.length}
                </span>
              )}
            </button>
          </motion.div>
        </div>

        <div className="lg:col-span-3">
          <AnimatePresence>
            {selectedHormoneData && (
              <ReferenceRanges
                key={selectedHormone}
                hormone={selectedHormoneData}
                language={language}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <HistoryPanel language={language} />
    </div>
  );
}
