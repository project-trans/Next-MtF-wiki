import { sT } from '@/lib/i18n/server';
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
  const language = mdContext?.currentLanguage || 'en';
  return (
    <HiddenPhotoClient
      clickToShowImageText={sT('hidden-photo-click-to-show-image', language)}
      showImageBtnText={sT('hidden-photo-show-image-btn-text', language)}
      hideImageBtnText={sT('hidden-photo-hide-image-btn-text', language)}
    >
      <LocalImage src={src} alt={alt} />
    </HiddenPhotoClient>
  );
}
