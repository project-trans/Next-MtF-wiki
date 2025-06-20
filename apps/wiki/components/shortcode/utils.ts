import { getLocalImagePath } from '@/service/path-utils';
import type { MdContextType } from './types';

export function getLocalImagePathFromMdContext(
  src: string | undefined,
  mdContext?: MdContextType,
): string {
  if (mdContext && src) {
    return (
      getLocalImagePath(
        mdContext.currentLanguage,
        mdContext.realCurrentSlug,
        src,
        mdContext.isCurrentSlugIndex,
      ) || src
    );
  }
  return src || '';
}
