import { LocalImage } from '../LocalImage';
import HiddenPhotoClient from './HiddenPhotoClient';
import type { ShortCodeCompProps } from './types';
import { getLocalImagePathFromMdContext } from './utils';

/**
 * HiddenPhoto组件用于显示可点击显示的隐藏图片
 * 使用示例: {{< hiddenphoto "/path/to/image.jpg" "图片描述" >}}
 */
export default function hiddenPhoto({ attrs, mdContext }: ShortCodeCompProps) {
  const src = getLocalImagePathFromMdContext(attrs[0] || '', mdContext);
  const alt = attrs[1] || 'Hidden image';
  return (
    <HiddenPhotoClient>
      <LocalImage src={src} alt={alt} />
    </HiddenPhotoClient>
  );
}
