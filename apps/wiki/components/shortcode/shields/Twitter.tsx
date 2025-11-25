import type { ShortCodeCompProps } from '../types';
import ShieldsBase from './Base';

export default function Twitter({ attrs }: ShortCodeCompProps) {
  const message = attrs[0] || '';
  const href = `https://twitter.com/${message}`;

  return (
    <ShieldsBase
      label="Twitter"
      logo="Twitter"
      message={message}
      color="blue"
      href={href}
      alt={`Twitter @${message}`}
    />
  );
}
