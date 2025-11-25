import type { ReactNode } from 'react';

interface ShieldsBaseProps {
  label: string;
  logo: string;
  message: string;
  color: string;
  href?: string;
  alt?: string;
  children?: ReactNode;
}

export default function ShieldsBase({
  label,
  logo,
  message,
  color,
  href,
  alt,
  children,
}: ShieldsBaseProps) {
  const imgSrc = `https://img.shields.io/static/v1?label=${encodeURIComponent(label)}&logo=${encodeURIComponent(logo)}&message=${encodeURIComponent(message)}&color=${encodeURIComponent(color)}&style=flat-square`;

  const altText = alt || `${label} ${message}`;

  if (!href) {
    return (
      <span className="inline-flex items-center not-prose">
        <img
          loading="lazy"
          decoding="async"
          alt={altText}
          src={imgSrc}
          className="h-5"
        />
        {children}
      </span>
    );
  }

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
        alt={altText}
        src={imgSrc}
        className="h-5"
      />
      {children}
    </a>
  );
}
