import dynamic from 'next/dynamic';
import { default as DefaultShortcode } from './DefaultShortcode';
import type {
  ShortCodeCompProps,
  ShortCodeCompRecord,
  ShortCodeCompType,
  ShortCodeProps,
} from './types';

const compsMap: ShortCodeCompRecord = {
  notice: dynamic(() => import('./Notice')),
  telephone: dynamic(() => import('./Telephone')),
  wiki: dynamic(() => import('./Wiki')),
  ref: dynamic(() => import('./Ref')),
  local: dynamic(() => import('./Local')),
  hiddenphoto: dynamic(() => import('./hiddenPhoto')),
  alert: dynamic(() => import('./Notice')),
  'mtf-wiki': dynamic(() => import('./MtfWiki')),
  ruby: dynamic(() => import('./Ruby')),
  gallery: dynamic(() => import('./Gallery')),
  watermark: dynamic(() => import('./Watermark')),
  currency: dynamic(() => import('./Currency')),
  'doctor-image': dynamic(() => import('./DoctorImage')),
  'current-year': dynamic(() => import('./CurrentYear')),
  figure: dynamic(() => import('./Figure')),
  expand: dynamic(() => import('./Expand')),
  lang: dynamic(() => import('./Lang')),
  'project-trans': dynamic(() => import('./ProjectTrans')),
  qrcode: dynamic(() => import('./QrCode')),
  github: {
    contributors: dynamic(() => import('./GithubContributors')),
  },
  shields: {
    qq: dynamic(() => import('./shields/QQ')),
    telegram: dynamic(() => import('./shields/Telegram')),
    'github-issue': dynamic(() => import('./shields/GithubIssue')),
    discord: dynamic(() => import('./shields/Discord')),
    twitter: dynamic(() => import('./shields/Twitter')),
    matrix: dynamic(() => import('./shields/Matrix')),
    wechat: dynamic(() => import('./shields/Wechat')),
    line: dynamic(() => import('./shields/Line')),
  },
  tag: {
    pos: dynamic(() => import('./tag/Pos')),
    neg: dynamic(() => import('./tag/Neg')),
  },
  meme: {
    'onimai-zh': dynamic(() => import('./meme/OnimaiZh')),
    'onimai-ja': dynamic(() => import('./meme/OnimaiZh')),
    'baidu-hrt': dynamic(() => import('./meme/BaiduHrt')),
    hybl: dynamic(() => import('./meme/Hybl')),
  },
};

export function ShortCodeComp({
  compName: rawCompName,
  attrs,
  children,
  mdContext,
}: ShortCodeProps) {
  // console.log("mdContext: ", JSON.stringify(mdContext, null, 2));
  const DefaultComp = (
    <DefaultShortcode compName={rawCompName} attrs={attrs}>
      {children}
    </DefaultShortcode>
  );

  // console.log("attrs: ", JSON.stringify(attrs, null, 2));
  let realattrs = attrs;

  if (
    realattrs?.length >= 1 &&
    Array.isArray(realattrs[0]) &&
    realattrs[0].length >= 1
  ) {
    realattrs = realattrs.map((attr) => {
      if (Array.isArray(attr) && attr.length >= 1) {
        return attr[1] || attr[0];
      }
      return attr;
    });
  }

  // 解析shortcode名称，从compsMap中找到对应的组件
  const nameParts = rawCompName.split('/');
  let comp: ShortCodeCompType | ShortCodeCompRecord | undefined = compsMap;

  for (const part of nameParts) {
    if (
      typeof comp === 'function' ||
      comp === undefined ||
      comp[part] === undefined
    ) {
      return DefaultComp;
    }
    comp = comp[part];
  }

  // 检查最终的comp是否是一个函数（ShortCodeCompFunction）
  if (typeof comp === 'function') {
    // 检查是否为 React 组件
    if ('$$typeof' in comp || 'prototype' in comp) {
      const Component = comp as React.ComponentType<ShortCodeCompProps>;
      return (
        <Component attrs={realattrs} mdContext={mdContext}>
          {children}
        </Component>
      );
    }
    // 普通函数调用
    return (comp as (props: ShortCodeCompProps) => React.ReactNode)({
      attrs: realattrs,
      children,
      mdContext,
    });
  }

  // 如果组件不存在或不是函数，则返回默认组件
  console.error(`Shortcode route error: ${rawCompName}`);
  return DefaultComp;
}
