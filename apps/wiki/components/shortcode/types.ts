import type { ComponentType } from 'react';

export interface MdContextType {
  currentLanguage: string | null;
  currentSlug: string | null;
  realCurrentSlug: string | null;
  isCurrentSlugIndex: boolean;
}

export interface ShortCodeProps {
  compName: string;
  // biome-ignore lint/suspicious/noExplicitAny: attrs can be array of strings or array of arrays
  attrs: any[];
  children?: React.ReactNode;
  mdContext?: MdContextType;
}

export type ShortCodeCompProps = Pick<
  ShortCodeProps,
  'attrs' | 'children' | 'mdContext'
>;

export type ShortCodeCompType = ComponentType<ShortCodeCompProps>;

export interface ShortCodeCompRecord {
  [key: string]: ShortCodeCompType | ShortCodeCompRecord;
}
