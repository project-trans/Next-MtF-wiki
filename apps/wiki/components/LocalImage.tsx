import fs from 'node:fs/promises';
import path from 'node:path';
import { sT } from '@/lib/i18n/server';
import sizeOf from 'image-size';
import LocalImageClient from './LocalImageClient';
interface ImageDimensions {
  width: number;
  height: number;
}

async function getImageDimensions(
  imagePath: string,
): Promise<ImageDimensions | null> {
  try {
    // 处理不同类型的图片路径
    let fullPath: string;

    if (
      imagePath.startsWith('http://') ||
      imagePath.startsWith('https://') ||
      imagePath.startsWith('//')
    ) {
      // 外部链接，无法获取尺寸
      return null;
    }

    if (imagePath.startsWith('/')) {
      // 绝对路径
      fullPath = path.join(process.cwd(), 'public', imagePath);
    } else {
      // 相对路径，无法处理
      return null;
    }

    try {
      await fs.access(fullPath);
    } catch {
      return null;
    }

    // 读取文件并获取图片尺寸
    const buffer = await fs.readFile(fullPath);
    const dimensions = sizeOf(buffer);

    return {
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    console.warn('获取图片尺寸失败:', imagePath, error);
    return null;
  }
}

interface LocalImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  language?: string;
}

export async function LocalImage({
  src,
  alt,
  width,
  height,
  className,
  loading,
  decoding,
  language,
  ...props
}: LocalImageProps) {
  // 获取图片尺寸
  const dimensions =
    width && height
      ? { width, height }
      : typeof src === 'string'
        ? await getImageDimensions(src)
        : null;
  // console.log('src', src, 'dimensions', dimensions);

  return dimensions ? (
    <LocalImageClient
      src={src}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      loadFailedText={
        language ? sT('local-image-load-failed-text', language) : null
      }
      loadingText={language ? sT('local-image-loading-text', language) : null}
      loading={loading || 'lazy'}
      decoding={decoding || 'async'}
      {...props}
    />
  ) : (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading || 'lazy'}
      decoding={decoding || 'async'}
      {...props}
    />
  );
}
