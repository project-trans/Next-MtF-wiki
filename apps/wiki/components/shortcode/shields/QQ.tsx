import type { ShortCodeCompProps } from '../types';
import ShieldsBase from './Base';

export default function QQ({ attrs }: ShortCodeCompProps) {
  const message = attrs[0] || '';
  const href = attrs[1] || undefined;

  return (
    <ShieldsBase
      label="QQ"
      logo="Tencent QQ"
      message={message}
      color="blue"
      href={href}
      alt={`QQ ${message}`}
    />
  );
}
