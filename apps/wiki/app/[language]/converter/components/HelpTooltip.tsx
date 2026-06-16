'use client';

import { HelpCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { t } from '@/lib/i18n/client';

interface HelpTooltipProps {
  language: string;
}

export function HelpTooltip({ language }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-circle btn-ghost btn-sm"
        title={t('conv-help', language) as string}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-base-100 rounded-lg shadow-xl border border-base-300 p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base-content">
                {t('conv-help', language)}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-base-content/80">
              <div>
                <h4 className="font-medium text-base-content mb-1">
                  {t('conv-help-basic', language)}
                </h4>
                <ul className="space-y-1 text-xs">
                  <li>• {t('conv-help-step1', language)}</li>
                  <li>• {t('conv-help-step2', language)}</li>
                  <li>• {t('conv-help-step3', language)}</li>
                  <li>• {t('conv-help-step4', language)}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-base-content mb-1">
                  {t('conv-help-ranges-title', language)}
                </h4>
                <p className="text-xs">
                  {t('conv-help-ranges-text', language)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
