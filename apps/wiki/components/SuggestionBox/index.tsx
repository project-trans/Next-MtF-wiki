'use client';
import { useIsClient } from 'foxact/use-is-client';
import { type FC, Suspense, lazy, memo } from 'react';
import type { SuggestionBoxProps } from './types';

const SuggestionBoxSkeleton = () => (
  <div className="skeleton h-45 text-center flex items-center justify-center">
    <noscript>
      <p>提问箱需要运行 JavaScript 以加载。</p>
      <p>Suggestion Box requires JavaScript to load.</p>
    </noscript>
  </div>
);

const SuggestionBoxInner = lazy(() => import('./box'));

const SuggestionBox_: FC<SuggestionBoxProps> = (props) => {
  const isClient = useIsClient();

  if (!isClient) {
    return <SuggestionBoxSkeleton />;
  }

  return (
    <Suspense fallback={<SuggestionBoxSkeleton />}>
      <SuggestionBoxInner {...props} />
    </Suspense>
  );
};
const SuggestionBox = memo(SuggestionBox_);

export default SuggestionBox;
