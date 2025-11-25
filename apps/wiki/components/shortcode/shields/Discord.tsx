import type { ShortCodeCompProps } from '../types';

export default function Discord({ attrs }: ShortCodeCompProps) {
  const id = attrs[0] || '';
  const message = attrs[1] || '';
  const href = attrs[2] || '';
  const imgSrc = `https://img.shields.io/discord/${id}?style=flat-square`;

  return (
    <a
      className="inline-flex items-center no-underline not-prose"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        loading="lazy"
        decoding="async"
        alt={`Discord ${message}`}
        src={imgSrc}
        className="h-5"
      />
    </a>
  );
}
