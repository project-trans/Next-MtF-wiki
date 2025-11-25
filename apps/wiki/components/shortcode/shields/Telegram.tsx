import type { ShortCodeCompProps } from '../types';
import ShieldsBase from './Base';

export default function Telegram({ attrs }: ShortCodeCompProps) {
  const message = attrs[0] || '';
  const href = `https://t.me/${message}`;

  return (
    <ShieldsBase
      label="Telegram"
      logo="Telegram"
      message={message}
      color="blue"
      href={href}
      alt={`Telegram ${message}`}
    />
  );
}
