import type { ShortCodeCompProps } from './types';

export default function Wiki({ attrs }: ShortCodeCompProps) {
  const name = attrs[0] || '';
  const language = attrs[1] || 'zh';
  const item = name.replace(/ /g, '_');
  const locale = 'wiki'; // 可以根据实际需求修改为动态获取

  const href = `https://${language}.wikipedia.org/${locale}/${item}`;

  return (
    <a
      href={href}
      className="text-blue-600 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {name}
    </a>
  );
}
