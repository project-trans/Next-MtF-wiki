'use client';

import { useParams } from 'next/navigation';
import type { ShortCodeCompProps } from './types';

/**
 * Local组件用于根据当前语言环境显示内容
 * 使用示例: {{< local "zh-cn" >}}仅在中文简体环境显示的内容{{< /local >}}
 */
export default function Local({ attrs, children }: ShortCodeCompProps) {
  const params = useParams();
  const targetLocale = attrs[0] || '';
  const currentLocale = (params.language as string) || 'zh-cn';

  // 如果当前语言环境与目标语言环境匹配，则显示内容
  if (currentLocale === targetLocale) {
    return <>{children}</>;
  }

  // 否则不显示任何内容
  return null;
}
