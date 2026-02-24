import dynamic from 'next/dynamic';
import { default as DefaultShortcode } from './DefaultShortcode';
import type {
  ShortCodeCompInfo,
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
  figure: {
    type: dynamic(() => import('./Figure')),
    allowAttrType: 'original' as const,
  },
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

function isShortCodeCompInfo(
  comp: ShortCodeCompType | ShortCodeCompInfo | ShortCodeCompRecord,
): comp is ShortCodeCompInfo {
  return (
    typeof comp === 'object' &&
    comp !== null &&
    'type' in comp &&
    'allowAttrType' in comp
  );
}

export function ShortCodeComp({
  compName: rawCompName,
  attrs,
  children,
  mdContext,
}: ShortCodeProps) {
  const DefaultComp = (
    <DefaultShortcode compName={rawCompName} attrs={attrs}>
      {children}
    </DefaultShortcode>
  );

  // 解析shortcode名称，从compsMap中找到对应的组件
  const nameParts = rawCompName.split('/');
  let resolved:
    | ShortCodeCompType
    | ShortCodeCompInfo
    | ShortCodeCompRecord
    | undefined = compsMap;

  for (const part of nameParts) {
    if (
      resolved === undefined ||
      typeof resolved === 'function' ||
      isShortCodeCompInfo(resolved)
    ) {
      return DefaultComp;
    }
    const record = resolved as ShortCodeCompRecord;
    if (record[part] === undefined) {
      return DefaultComp;
    }
    resolved = record[part];
  }

  // 提取组件和属性类型
  let Component: ShortCodeCompType;
  let attrType: 'original' | 'positional' = 'positional';

  if (typeof resolved === 'function') {
    Component = resolved;
  } else if (isShortCodeCompInfo(resolved)) {
    Component = resolved.type;
    attrType = resolved.allowAttrType;
  } else {
    console.error(`Shortcode route error: ${rawCompName}`);
    return DefaultComp;
  }

  // 处理属性
  let realattrs = attrs;
  if (
    realattrs?.length >= 1 &&
    Array.isArray(realattrs[0]) &&
    realattrs[0].length >= 1
  ) {
    if (attrType === 'original') {
      // 保留原始 [key, value] 数组格式，直接透传给组件
    } else {
      // 位置参数
      realattrs = realattrs.map((attr) => {
        if (Array.isArray(attr) && attr.length >= 1) {
          return attr[1] || attr[0];
        }
        return attr;
      });
    }
  }

  // 渲染组件
  if ('$$typeof' in Component || 'prototype' in Component) {
    return (
      <Component attrs={realattrs} mdContext={mdContext}>
        {children}
      </Component>
    );
  }
  return (Component as (props: ShortCodeCompProps) => React.ReactNode)({
    attrs: realattrs,
    children,
    mdContext,
  });
}
