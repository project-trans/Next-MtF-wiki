'use client';

import { CircleX } from 'lucide-react';
import { useState } from 'react';

interface LocalImageClientProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  loadFailedText: string | null;
  loadingText: string | null;
}

export default function LocalImageClient({
  src,
  alt,
  width,
  height,
  loading,
  decoding,
  className = '',
  loadFailedText,
  loadingText,
  ...props
}: LocalImageClientProps) {
  const [loadingState, setLoadingState] = useState<
    'loading' | 'loaded' | 'error'
  >('loading');

  const largeEnough =
    width &&
    height &&
    typeof width === 'number' &&
    typeof height === 'number' &&
    width >= 100 &&
    height >= 100;

  return (
    <span className="relative block max-w-fit">
      {/* 骨架屏占位 - 在加载时显示 */}
      {loadingState === 'loading' && (
        <span
          className={'skeleton absolute inset-0 h-full block -z-1'}
          aria-label={loadingText || ''}
        />
      )}

      {/* 错误状态 - 在加载失败时显示 */}
      {loadingState === 'error' && largeEnough && (
        <span
          className={
            'absolute inset-0 flex items-center justify-center bg-base-200 border border-base-300 rounded h-full -z-1'
          }
        >
          <span className="text-center text-base-content block">
            <CircleX className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{loadFailedText || ''}</p>
          </span>
        </span>
      )}

      {/* 实际图片 - 始终在DOM中 */}
      <img
        src={src || ''}
        // src="aaa"
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        onLoad={() => setLoadingState('loaded')}
        onError={() => setLoadingState('error')}
        className={className}
        {...props}
      />
    </span>
  );
}
