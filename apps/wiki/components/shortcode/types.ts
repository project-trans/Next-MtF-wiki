import type { ComponentType } from 'react';

export interface MdContextType {
  currentLanguage: string | null;
  currentSlug: string | null;
  realCurrentSlug: string | null;
  isCurrentSlugIndex: boolean;
}

export interface ShortCodeProps {
  compName: string;
  attrs: string[];
  children?: React.ReactNode;
  mdContext?: MdContextType;
}

export type ShortCodeCompProps = Pick<
  ShortCodeProps,
  'attrs' | 'children' | 'mdContext'
>;

export interface ShortCodeCompInfo {
  type: ComponentType<ShortCodeCompProps>;
  allowAttrType: 'original' | 'positional';
}

export type ShortCodeCompType = ComponentType<ShortCodeCompProps>;

export interface ShortCodeCompRecord {
  [key: string]: ShortCodeCompType | ShortCodeCompInfo | ShortCodeCompRecord;
}
