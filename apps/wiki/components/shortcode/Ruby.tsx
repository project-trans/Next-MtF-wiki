import type { ShortCodeCompProps } from './types';

export default function Ruby({ attrs }: ShortCodeCompProps) {
  const text = attrs?.[0] || '';
  const pronunciation = attrs?.[1] || '';

  return (
    <ruby>
      {text}
      <rt>{pronunciation}</rt>
    </ruby>
  );
}
