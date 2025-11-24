import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ControlledElement,
  ControlledLink,
} from '@/components/ControlledElement';
import { LanguageAlternate } from '@/components/LanguageAlternate';
import { LocalImage } from '@/components/LocalImage';
import { Link } from '@/components/progress';
import { ShortCodeComp } from '@/components/shortcode';
import { cache } from '@/lib/cache';
import { t } from '@/lib/i18n/client';
import { sT } from '@/lib/i18n/server';
import { getLanguageConfigs } from '@/lib/site-config';
import {
  type DocItem,
  checkSubFolderExists,
  generateAllStaticParams,
  getDocItemByNavigationMap,
  getDocsNavigationMap,
} from '@/service/directory-service';
import { getFileLastModifiedTime } from '@/service/path-utils';
import { ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { type MDXComponents, MDXRemote } from 'next-mdx-remote-client/rsc';
import { getFrontmatter } from 'next-mdx-remote-client/utils';
import type { DetailedHTMLProps, ImgHTMLAttributes } from 'react';
import remarkGfm from 'remark-gfm';
import remarkHeadingId from 'remark-heading-id';
import remarkMath from 'remark-math';
import RedirectClient from '../components/RedirectClient';
import SingleChildRedirect from '../components/SingleChildRedirect';
import remarkCsvToTable from './remarkCsvToTable';
import remarkHtmlContent from './remarkHtmlContent';
import { remarkHugoShortcode } from './remarkHugoShortcode';
import remarkQrCode from './remarkHugoShortcode';
import type { Frontmatter } from './types';
import {
  getAvailableLanguages,
  getContentDir,
  getContentGitRootDir,
} from './utils';

interface DocParams {
  language: string;
  slug: string[];
}

export async function generateStaticParams() {
  // 获取语言配置
  const languageConfigs = getLanguageConfigs();

  // 生成所有语言和子目录的参数
  const paramPromises = languageConfigs.flatMap((langConfig) =>
    langConfig.subfolders.map((subfolder) =>
      generateAllStaticParams(langConfig.code, subfolder),
    ),
  );

  const allParamsArrays = await Promise.all(paramPromises);

  // 去重
  const uniqueParamsSet = new Set<string>();
  const uniqueParams: DocParams[] = [];

  // 预先获取所有语言的 noMarkdown 配置，避免重复查询
  const noMarkdownMap = new Map<string, Set<string>>();
  for (const langConfig of languageConfigs) {
    noMarkdownMap.set(langConfig.code, new Set(langConfig.noMarkdown || []));
  }

  for (const paramsArray of allParamsArrays) {
    for (const param of paramsArray) {
      const slugPath = param.slug?.join('/') || '';
      const key = `${param.language}\r${slugPath}`;

      // 跳过已存在的参数
      if (uniqueParamsSet.has(key)) {
        continue;
      }

      // 跳过 noMarkdown 页面
      const noMarkdownSet = noMarkdownMap.get(param.language);
      if (noMarkdownSet?.has(slugPath)) {
        continue;
      }

      uniqueParamsSet.add(key);
      uniqueParams.push({
        language: param.language,
        slug: param.slug || [],
      });
    }
  }

  // 处理aliases - 为每个语言和子文件夹添加redirectMap中的路径
  const redirectParamPromises = languageConfigs.flatMap((langConfig) =>
    langConfig.subfolders.map(async (subfolder) => {
      try {
        const { redirectMap } = await getDocsNavigationMap(
          langConfig.code,
          subfolder,
        );
        const redirectParams: DocParams[] = [];

        // 遍历 redirectMap
        for (const [displayPath, redirectItem] of redirectMap.entries()) {
          const slugParts = displayPath
            .split('/')
            .filter((part) => part !== '');
          const key = `${langConfig.code}\r${displayPath}`;

          const noMarkdownSet = noMarkdownMap.get(langConfig.code);
          if (noMarkdownSet?.has(displayPath)) {
            continue;
          }

          // 避免重复添加
          if (!uniqueParamsSet.has(key)) {
            uniqueParamsSet.add(key);
            redirectParams.push({
              language: langConfig.code,
              slug: slugParts,
            });
            // console.log('redirectParams: ', redirectParams);
          }
        }

        return redirectParams;
      } catch (error) {
        console.warn(
          `Failed to get redirectMap for ${langConfig.code}/${subfolder}:`,
          error,
        );
        return [];
      }
    }),
  );

  const redirectParamsArrays = await Promise.all(redirectParamPromises);

  // 将redirect参数添加到uniqueParams中
  for (const redirectParams of redirectParamsArrays) {
    uniqueParams.push(...redirectParams);
  }

  // console.log("uniqueParams: ", uniqueParams);
  return uniqueParams;
}

interface LanguageAlternateDocItemInfo {
  language: string;
  docItem: DocItem;
}

const getLanguageAlternateDocItem = cache(
  async (
    language: string,
    slug: string[],
  ): Promise<LanguageAlternateDocItemInfo[]> => {
    const languages = await getAvailableLanguages();
    const languageAlternateDocItem: LanguageAlternateDocItemInfo[] = [];
    for (const lang of languages) {
      if (lang !== language && slug.length > 0) {
        const subfolderExists = await checkSubFolderExists(lang, slug[0]);
        if (!subfolderExists) {
          continue;
        }
        const { root: navigationItemRoot, map: navigationItemMap } =
          await getDocsNavigationMap(lang, slug[0]);

        const navItem = getDocItemByNavigationMap(
          navigationItemMap,
          slug.join('/'),
        );

        if (navItem) {
          languageAlternateDocItem.push({
            language: lang,
            docItem: navItem,
          });
        }
      }
    }
    return languageAlternateDocItem;
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<DocParams>;
}) {
  const { language, slug } = await params;

  const slugArray = slug || [];
  const slugPath = slugArray.join('/');

  const { root: navigationItemRoot, map: navigationItemMap } =
    await getDocsNavigationMap(language, slugArray[0]);

  const navItem = getDocItemByNavigationMap(navigationItemMap, slugPath);

  if (!navItem) {
    return null;
  }

  const ogBaseUrl = process.env.NEXT_PUBLIC_OG_BASE_URL || 'https://mtf.wiki/';

  const languageAlternateDocItem = await getLanguageAlternateDocItem(
    language,
    slug,
  );

  return {
    title: `${navItem.metadata.title} - ${t('mtfwiki', language)}`,
    description: navItem.metadata.description || null,
    alternates: {
      languages: Object.fromEntries(
        languageAlternateDocItem.map((item) => [
          item.language,
          `${ogBaseUrl}${item.language}/${item.docItem.displayPath}`,
        ]),
      ),
    },
    openGraph: {
      title: navItem.metadata.title,
      siteName: t('mtfwiki', language),
      type: 'article',
      url: `${ogBaseUrl}${language}/${navItem.displayPath}`,
      locale: language,
      modifiedTime: (
        await getFileLastModifiedTime(navItem.realPath)
      )?.toISOString(),
    },
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<DocParams>;
}) {
  const { language, slug } = await params;

  // 处理 slug 为 undefined 的情况
  const slugArray = slug || [];

  const slugPath = slugArray.join('/');

  const {
    root: navigationItemRoot,
    map: navigationItemMap,
    redirectMap,
  } = await getDocsNavigationMap(language, slugArray[0]);

  const navItem = getDocItemByNavigationMap(navigationItemMap, slugPath);

  if (!navItem) {
    // console.log('redirectMap: ', redirectMap, slugPath);
    if (redirectMap.has(slugPath)) {
      const redirectItem = redirectMap.get(slugPath);
      if (redirectItem) {
        return (
          <RedirectClient
            href={`/${language}/${redirectItem.redirectTo}`}
            altText={sT('redirect-client-text', language)}
          />
        );
      }
    }
    throw new Error('Nav item not found');
  }

  const isIndexPage = !!navItem.isIndex;
  // console.log('isIndexPage: ', isIndexPage);

  const fileContents = await fs.readFile(navItem.realPath, 'utf-8');

  const { frontmatter, strippedSource } =
    getFrontmatter<Frontmatter>(fileContents);
  const pageTitle =
    frontmatter?.title || slugArray[slugArray.length - 1] || '文档';

  const realCurrentSlug = navItem.realPath
    ? path.relative(`${getContentDir()}/${language}`, navItem.realPath)
    : slugPath;

  const hugoRemarkOptions = {
    currentLanguage: language,
    navigationItems: navigationItemRoot.children ?? [],
    currentSlug: slugPath,
    realCurrentSlug,
    isCurrentSlugIndex: isIndexPage,
  };

  function remarkHugoShortcodePlugin(this: unknown) {
    return remarkHugoShortcode.call(this, hugoRemarkOptions);
  }

  function remarkCsvToTablePlugin() {
    return remarkCsvToTable(hugoRemarkOptions);
  }

  function remarkHeadingIdPlugin() {
    return remarkHeadingId({
      defaults: true,
    });
  }

  const mdxRawContent: string = strippedSource;
  const remarkPlugins = [
    remarkHeadingIdPlugin,
    remarkCsvToTablePlugin,
    remarkHugoShortcodePlugin,
    remarkGfm,
    remarkMath,
    remarkHtmlContent,
    remarkQrCode,
  ];

  async function ImageComponent(
    props: DetailedHTMLProps<
      ImgHTMLAttributes<HTMLImageElement>,
      HTMLImageElement
    >,
  ) {
    const imagePath = props.src as string;
    return (
      <LocalImage
        src={imagePath || ''}
        alt={props.alt || ''}
        className={props.className}
        language={language}
      />
    );
  }

  // 定义组件映射
  const components: MDXComponents = {
    ShortCodeComp: (props) => (
      <ShortCodeComp
        {...props}
        mdContext={{
          currentLanguage: language,
          currentSlug: slugPath,
          realCurrentSlug: realCurrentSlug,
          isCurrentSlugIndex: isIndexPage,
        }}
      />
    ),
    Link: ControlledLink,
    a: (props) => <ControlledElement tagName="a" {...props} />,
    li: (props) => <ControlledElement tagName="li" {...props} />,
    img: ImageComponent,
    h1: (props) => <ControlledElement tagName="h1" {...props} />,
    h2: (props) => <ControlledElement tagName="h2" {...props} />,
    h3: (props) => <ControlledElement tagName="h3" {...props} />,
    h4: (props) => <ControlledElement tagName="h4" {...props} />,
    h5: (props) => <ControlledElement tagName="h5" {...props} />,
    h6: (props) => <ControlledElement tagName="h6" {...props} />,
  };

  const ErrorContent = ({ error }: { error: Error }) => {
    if (process.env.NODE_ENV !== 'development') {
      throw error;
    }
    console.error('⚠️ Compile Error: ', {
      displayPath: navItem.displayPath,
      error,
    });
    return (
      <article>
        <h1>处理内容时发生错误</h1>
        <p>无法加载或解析文件：{navItem.displayPath}</p>
        <pre>{String(error)}</pre>
        <MDXRemote
          source={`\`\`\`\`mdx\n${mdxRawContent}\n\`\`\`\``}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm, remarkMath],
              format: 'md',
            },
          }}
        />
      </article>
    );
  };

  // 获取父级导航项以确定兄弟页面
  const parentItem = navItem.parentDisplayPath
    ? getDocItemByNavigationMap(navigationItemMap, navItem.parentDisplayPath)
    : navigationItemRoot;

  // 获取兄弟页面列表
  const siblings = parentItem?.children || [];
  const currentIndex = siblings.findIndex(
    (item) => item.displayPath === navItem.displayPath,
  );

  // 获取上一页和下一页
  const previousPage = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextPage =
    currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const showEditAndLastModifiedTime = strippedSource.trim().length > 0;

  // 获取文件的最近修改时间
  const lastModifiedTime = showEditAndLastModifiedTime
    ? await getFileLastModifiedTime(navItem.realPath)
    : null;

  // 生成GitHub编辑链接
  const editLinkGithubUrl = process.env.NEXT_PUBLIC_EDIT_LINK_GITHUB_URL;
  const editLink =
    showEditAndLastModifiedTime && editLinkGithubUrl
      ? `${editLinkGithubUrl}${path
          .relative(getContentGitRootDir(), navItem.realPath)
          .replace(/\\/g, '/')}`
      : null;

  const languageAlternate = await getLanguageAlternateDocItem(language, slug);

  return (
    <div className="flex flex-col">
      <SingleChildRedirect
        language={language}
        currentPath={slugPath}
        redirectToSingleChild={navItem.metadata.redirectToSingleChild}
      />

      {/* 文档内容 */}

      <div className="p-6 rounded-xl bg-base-100/30 border border-base-300/30 shadow-sm flex-1">
        <article
          id="markdown-content"
          className="prose max-w-none prose-headings:text-base-content prose-p:text-base-content/80 prose-strong:text-base-content prose-code:text-primary prose-pre:bg-base-200 prose-pre:border prose-pre:border-base-300 wrap-break-word"
        >
          <header>
            <h1>{pageTitle}</h1>
            {/* 你可以在这里添加其他 frontmatter 信息的渲染, e.g., date, author */}
          </header>

          <MDXRemote
            source={mdxRawContent}
            components={components}
            onError={ErrorContent}
            options={{
              mdxOptions: {
                remarkPlugins: remarkPlugins,
                remarkRehypeOptions: {
                  footnoteLabel: t('footnoteLabel', language),
                  footnoteLabelProperties: {},
                },
                format: 'md',
              },
            }}
          />

          {/* 编辑链接和最近更新时间 */}
          {(editLink || lastModifiedTime) && (
            <div className="mt-8 gap-4 flex justify-between items-center">
              {/* 左侧：编辑链接 */}
              {editLink ? (
                <a
                  href={editLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-base-content/40 hover:text-primary transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  {sT('edit-this-page', language)}
                </a>
              ) : (
                <span />
              )}

              {/* 右侧：最近更新时间 */}
              {lastModifiedTime && (
                <span className="text-xs text-base-content/40 font-mono">
                  {sT('last-modified-time', language)}
                  {lastModifiedTime.toLocaleDateString(language, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          )}
        </article>
      </div>

      <LanguageAlternate
        languageAlternate={
          new Map(
            languageAlternate.map((item) => [
              item.language,
              item.docItem.displayPath,
            ]),
          )
        }
      />

      {/* 子页面列表 */}
      {navItem.children && navItem.children.length > 0 && (
        <section className="mt-8 p-6 bg-base-100/30 rounded-lg border border-base-300/30 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-base-content">
            {t('childPages', language)}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {navItem.children.map((child) => (
              <Link
                key={child.displayPath}
                href={`/${language}/${child.displayPath}`}
                className="block p-4 bg-base-200 hover:bg-base-300 rounded-lg transition-colors border border-base-300 hover:border-primary/30"
              >
                <h3 className="font-medium text-base-content">
                  {child.metadata.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
      {/* 上一页/下一页导航 */}
      {(previousPage || nextPage) && (
        <nav className="mt-8 flex justify-between items-center p-4 bg-base-100/30 rounded-lg border border-base-300/30 shadow-sm">
          {previousPage ? (
            <Link
              href={`/${language}/${previousPage.displayPath}`}
              className="inline-flex items-center text-sm text-base-content/70 hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              <div>
                <div className="text-xs text-base-content/50">
                  {t('previousPage', language)}
                </div>
                <div className="font-medium">{previousPage.metadata.title}</div>
              </div>
            </Link>
          ) : (
            <span />
          )}

          {nextPage && (
            <Link
              href={`/${language}/${nextPage.displayPath}`}
              className="inline-flex items-center text-sm text-base-content/70 hover:text-primary transition-colors"
            >
              <div>
                <div className="text-xs text-base-content/50">
                  {t('nextPage', language)}
                </div>
                <div className="font-medium">{nextPage.metadata.title}</div>
              </div>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
