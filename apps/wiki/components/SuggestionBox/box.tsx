'use client';
import { useTheme } from 'next-themes';
import '@project-trans/suggestion-box/aio';
import type { SuggestionBoxProps } from './types';

export default function SuggestionBoxInner(props: SuggestionBoxProps) {
  const { resolvedTheme } = useTheme();

  return (
    <suggestion-box
      {...props}
      className={resolvedTheme === 'dark' ? 'dark' : ''}
      style={{
        '--c-action-bg-light': 'var(--color-base-200)',
        '--c-textarea-bg-light': 'var(--color-base-100)',
        '--c-contact-bg-light': 'var(--color-base-100)',
      }}
      targetUrl="https://suggestion-box.project-trans.org/api/v1/suggestion"
    />
  );
}
