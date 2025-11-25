import type { ShortCodeCompProps } from '../types';
import ShieldsBase from './Base';

export default function Line({ attrs }: ShortCodeCompProps) {
  const message = attrs[0] || '';
  const href = `https://page.line.me/${message}`;

  return (
    <ShieldsBase
      label="LINE"
      logo="LINE"
      message={message}
      color="00C300"
      href={href}
      alt={`LINE ${message}`}
    />
  );
}
