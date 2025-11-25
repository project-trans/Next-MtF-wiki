import type { ShortCodeCompProps } from './types';

export default function Lang({ attrs, children }: ShortCodeCompProps) {
  const lang = attrs[0] || '';
  return <span lang={lang}>{children}</span>;
}
