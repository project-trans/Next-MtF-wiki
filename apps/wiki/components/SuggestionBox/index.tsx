'use client';
import { t } from '@/lib/i18n/client';
import { useIsClient } from 'foxact/use-is-client';
import { type FC, Suspense, lazy, memo } from 'react';
import type { SuggestionBoxProps } from './types';

const SuggestionBoxSkeleton = ({ language }: { language: string }) => (
  <div className="skeleton h-45 text-center flex items-center justify-center">
    <noscript>
      <p>{t('suggestionBoxRequiresJavaScript', language)}</p>
    </noscript>
  </div>
);

const SuggestionBoxInner = lazy(() => import('./box'));

const SuggestionBox_: FC<SuggestionBoxProps & { language: string }> = ({
  language,
  ...props
}) => {
  const isClient = useIsClient();

  if (!isClient) {
    return <SuggestionBoxSkeleton language={language} />;
  }

  return (
    <Suspense fallback={<SuggestionBoxSkeleton language={language} />}>
      <SuggestionBoxInner {...props} />
    </Suspense>
  );
};
const SuggestionBox = memo(SuggestionBox_);

export default SuggestionBox;
