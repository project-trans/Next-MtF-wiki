import type { ShortCodeCompProps } from '../types';

export default function Matrix({ attrs }: ShortCodeCompProps) {
  const name = attrs[0] || '';
  const fqdn = attrs[1] || '';
  const href = `https://matrix.to/#/#${name}:${fqdn}`;
  const imgSrc = `https://img.shields.io/matrix/${name}?server_fqdn=${fqdn}&style=flat-square&label=matrix`;

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
        alt={`Matrix #${name}:${fqdn}`}
        src={imgSrc}
        className="h-5"
      />
    </a>
  );
}
