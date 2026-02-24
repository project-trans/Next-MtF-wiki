import { LocalImage } from '../LocalImage';
import type { ShortCodeCompProps } from './types';
import { getLocalImagePathFromMdContext } from './utils';

interface FigureProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  loading?: string;
  class?: string;
  link?: string;
  target?: string;
  rel?: string;
  title?: string;
  caption?: string;
  attr?: string;
  attrlink?: string;
}

export default function Figure({ attrs, mdContext }: ShortCodeCompProps) {
  // 解析属性：attrs 格式为 [key | null, value][] 数组
  const parseAttrs = (attrs: unknown[]): FigureProps => {
    const props: FigureProps = {};

    if (!attrs || attrs.length === 0) return props;

    // 位置参数：第一个元素是 [null, value]
    const first = attrs[0];
    if (Array.isArray(first) && first[0] === null) {
      props.src = first[1] || '';
      return props;
    }

    // 命名参数：每个元素是 [key, value]
    for (const attr of attrs) {
      if (!Array.isArray(attr) || attr.length < 2) continue;
      const key = attr[0] as string;
      const value = (attr[1] || '') as string;

      switch (key) {
        case 'src':
          props.src = value;
          break;
        case 'alt':
          props.alt = value;
          break;
        case 'width':
          props.width = value;
          break;
        case 'height':
          props.height = value;
          break;
        case 'loading':
          props.loading = value;
          break;
        case 'class':
          props.class = value;
          break;
        case 'link':
          props.link = value;
          break;
        case 'target':
          props.target = value;
          break;
        case 'rel':
          props.rel = value;
          break;
        case 'title':
          props.title = value;
          break;
        case 'caption':
          props.caption = value;
          break;
        case 'attr':
          props.attr = value;
          break;
        case 'attrlink':
          props.attrlink = value;
          break;
      }
    }

    return props;
  };

  const figureProps = parseAttrs(attrs || []);

  // width 和 height 同时为纯数字时，size 传给 LocalImage
  // 否则都走 CSS style
  const isNumeric = (v?: string) => v != null && /^\d+$/.test(v);
  const bothNumeric =
    isNumeric(figureProps.width) && isNumeric(figureProps.height);

  const figureStyle: React.CSSProperties = {};
  if (!bothNumeric) {
    if (figureProps.width) figureStyle.width = figureProps.width;
    if (figureProps.height) figureStyle.height = figureProps.height;
  }

  const imageElement = (
    <LocalImage
      src={getLocalImagePathFromMdContext(figureProps.src, mdContext)}
      alt={figureProps.alt || figureProps.caption}
      width={bothNumeric ? Number(figureProps.width) : undefined}
      height={bothNumeric ? Number(figureProps.height) : undefined}
      loading={figureProps.loading as 'eager' | 'lazy' | undefined}
      language={mdContext?.currentLanguage || undefined}
    />
  );

  return (
    <figure
      className={`my-4 text-center ${figureProps.class || ''}`}
      style={Object.keys(figureStyle).length > 0 ? figureStyle : undefined}
    >
      {figureProps.link ? (
        <a
          href={figureProps.link}
          target={figureProps.target}
          rel={figureProps.rel}
        >
          {imageElement}
        </a>
      ) : (
        imageElement
      )}
      {(figureProps.title || figureProps.caption || figureProps.attr) && (
        <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          {figureProps.title && (
            <h4 className="my-0 mb-1 text-base font-semibold">
              {figureProps.title}
            </h4>
          )}
          {(figureProps.caption || figureProps.attr) && (
            <p className="m-0">
              {figureProps.caption}
              {figureProps.attr && (
                <>
                  {figureProps.caption && ' '}
                  {figureProps.attrlink ? (
                    <a
                      href={figureProps.attrlink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {figureProps.attr}
                    </a>
                  ) : (
                    figureProps.attr
                  )}
                </>
              )}
            </p>
          )}
        </figcaption>
      )}
    </figure>
  );
}
