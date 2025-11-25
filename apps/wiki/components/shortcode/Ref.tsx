import { Link } from '../progress';
import type { ShortCodeCompProps } from './types';

/**
 * Ref组件用于内部链接引用
 * 使用示例: {{< ref "abbreviation#cd" >}}
 */
export default function Ref({ attrs }: ShortCodeCompProps) {
  const path = attrs[0] || '';

  // 处理路径，确保以/开头
  const href = path.startsWith('/') ? path : `/${path}`;

  return (
    <Link href={href} className="text-blue-600 hover:underline">
      {path}
    </Link>
  );
}
