import type { ShortCodeCompProps } from '../types';

export default function GithubIssue({ attrs }: ShortCodeCompProps) {
  const repo = attrs[0] || '';
  const href = `https://github.com/${repo}/issues/new/choose`;
  const imgSrc = `https://img.shields.io/github/issues/${repo}?style=flat-square`;

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
        alt={`${repo} issues`}
        src={imgSrc}
        className="h-5"
      />
    </a>
  );
}
