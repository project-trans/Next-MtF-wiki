import { LocalImage } from '../LocalImage';
import styles from './css/Gallery.module.css';
import { type GalleryImage, getGalleryImages } from './galleryUtils';
import type { ShortCodeCompProps } from './types';

interface GalleryProps extends ShortCodeCompProps {
  pattern?: string;
}

export default function Gallery({ attrs, mdContext }: GalleryProps) {
  const pattern = attrs?.[0] || '';
  const { currentLanguage, currentSlug } = mdContext || {};

  // 在SSG时获取匹配的图片
  const images = getGalleryImages(currentLanguage!, currentSlug!, pattern);

  if (images.length === 0) {
    return (
      <section className={styles.gallery}>
        <div className={styles.galleryPlaceholder}>
          <p>Gallery: {pattern}</p>
          <p>未找到匹配的图片</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.gallery}>
      {images.map((image: GalleryImage) => (
        <LocalImage
          key={image.name}
          src={image.path}
          alt={image.alt || `Gallery image ${image.name}`}
          width={image.width}
          height={image.height}
          language={currentLanguage || undefined}
        />
      ))}
    </section>
  );
}
