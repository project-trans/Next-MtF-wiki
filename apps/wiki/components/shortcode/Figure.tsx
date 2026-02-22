import { LocalImage } from '../LocalImage';
import type { ShortCodeCompProps } from './types';
import { getLocalImagePathFromMdContext } from './utils';

interface FigureProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
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
  // 解析命名参数
  const parseAttrs = (attrs: unknown[]): FigureProps => {
    const props: FigureProps = {};

    if (!attrs) return props;

    // 如果是位置参数，第一个参数通常是src（ShortCodeComp 将 [["src","x"],["width","400"]] 转为 ["x","400","319"]）
    if (typeof attrs[0] === 'string' && !attrs[0].includes('=')) {
      props.src = attrs[0];
      if (attrs[1] !== undefined)
        props.width = Number.parseInt(String(attrs[1]));
      if (attrs[2] !== undefined)
        props.height = Number.parseInt(String(attrs[2]));
      return props;
    }

    // 解析命名参数
    for (const attr of attrs) {
      if (typeof attr === 'string' && attr.includes('=')) {
        const [key, value] = attr.split('=', 2);
        const cleanKey = key.trim();
        const cleanValue = value.replace(/['"]/g, '').trim();

        switch (cleanKey) {
          case 'src':
            props.src = cleanValue;
            break;
          case 'alt':
            props.alt = cleanValue;
            break;
          case 'width':
            props.width = Number.parseInt(cleanValue);
            break;
          case 'height':
            props.height = Number.parseInt(cleanValue);
            break;
          case 'loading':
            props.loading = cleanValue as 'eager' | 'lazy';
            break;
          case 'class':
            props.class = cleanValue;
            break;
          case 'link':
            props.link = cleanValue;
            break;
          case 'target':
            props.target = cleanValue;
            break;
          case 'rel':
            props.rel = cleanValue;
            break;
          case 'title':
            props.title = cleanValue;
            break;
          case 'caption':
            props.caption = cleanValue;
            break;
          case 'attr':
            props.attr = cleanValue;
            break;
          case 'attrlink':
            props.attrlink = cleanValue;
            break;
        }
      }
    }

    return props;
  };

  const figureProps = parseAttrs(attrs || []);

  const imageElement = (
    <LocalImage
      src={getLocalImagePathFromMdContext(figureProps.src, mdContext)}
      alt={figureProps.alt || figureProps.caption}
      width={figureProps.width}
      height={figureProps.height}
      loading={figureProps.loading as 'eager' | 'lazy' | undefined}
      language={mdContext?.currentLanguage || undefined}
    />
  );

  return (
    <figure className={`my-4 text-center ${figureProps.class || ''}`}>
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
