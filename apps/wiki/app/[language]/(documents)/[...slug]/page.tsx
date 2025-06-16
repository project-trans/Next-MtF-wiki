import fs from 'node:fs/promises';
import { LocalImage } from '@/components/LocalImage';
import { Link } from '@/components/progress';
import { ShortCodeComp } from '@/components/shortcode';
import { t } from '@/lib/i18n/client';
import { sT } from '@/lib/i18n/server';
import { getLanguageConfigs } from '@/lib/site-config';
import {
  generateAllStaticParams,
  getDocItemByNavigationMap,
  getDocsNavigationMap,
} from '@/service/directory-service';
import { getFileLastModifiedTime } from '@/service/path-utils';
import { type MDXComponents, MDXRemote } from 'next-mdx-remote-client/rsc';
import { getFrontmatter } from 'next-mdx-remote-client/utils';
import type { DetailedHTMLProps, ImgHTMLAttributes } from 'react';
import remarkGfm from 'remark-gfm';
import remarkHeadingId from 'remark-heading-id';
import remarkMath from 'remark-math';
import remarkCsvToTable from './remarkCsvToTable';
import remarkHtmlContent from './remarkHtmlContent';
import { remarkHugoShortcode } from './remarkHugoShortcode';
import type { Frontmatter } from './types';

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

  // console.log("uniqueParams: ", uniqueParams);
  return uniqueParams;
}

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
    throw new Error('Nav item not found');
  }

  const ogBaseUrl = process.env.NEXT_PUBLIC_OG_BASE_URL || 'https://mtf.wiki/';

  return {
    title: `${navItem.metadata.title} - ${t('mtfwiki', language)}`,
    description: navItem.metadata.description || null,
    openGraph: {
      title: navItem.metadata.title,
      siteName: t('mtfwiki', language),
      type: 'article',
      url: `${ogBaseUrl}${language}/${navItem.displayPath}`,
      locale: language,
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

  const { root: navigationItemRoot, map: navigationItemMap } =
    await getDocsNavigationMap(language, slugArray[0]);

  const navItem = getDocItemByNavigationMap(navigationItemMap, slugPath);

  if (!navItem) {
    throw new Error('Nav item not found');
  }

  const isIndexPage = navItem.isIndex;

  const fileContents = await fs.readFile(navItem.realPath, 'utf-8');

  const { frontmatter, strippedSource } =
    getFrontmatter<Frontmatter>(fileContents);
  const pageTitle =
    frontmatter?.title || slugArray[slugArray.length - 1] || '文档';

  const hugoRemarkOptions = {
    currentLanguage: language,
    navigationItems: navigationItemRoot.children ?? [],
    currentSlug: slugPath,
    isCurrentSlugIndex: isIndexPage,
  };

  function remarkHugoShortcodePlugin(this: unknown) {
    return remarkHugoShortcode.call(this, hugoRemarkOptions);
  }

  function remarkCsvToTablePlugin() {
    return remarkCsvToTable(hugoRemarkOptions);
  }

  const mdxRawContent: string = strippedSource;
  const remarkPlugins = [
    remarkHeadingId,
    remarkCsvToTablePlugin,
    remarkHugoShortcodePlugin,
    remarkGfm,
    remarkMath,
    remarkHtmlContent,
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
          isCurrentSlugIndex: isIndexPage,
        }}
      />
    ),
    Link,
    img: ImageComponent,
  };

  const ErrorContent = ({ error }: { error: Error }) => {
    console.log('⚠️ Compile Error: ', {
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

  // 获取文件的最近修改时间
  const lastModifiedTime = await getFileLastModifiedTime(navItem.realPath);

  return (
    <div className="flex flex-col">
      {/* 文档内容 */}

      <div className="p-6 rounded-xl bg-base-100/30 backdrop-blur-sm border border-base-300/30 shadow-sm flex-1">
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

          {/* 最近更新时间 */}
          {lastModifiedTime && (
            <div className="mt-8 text-right">
              <span className="text-xs text-base-content/40 font-mono">
                {sT('last-modified-time', language)}
                {lastModifiedTime.toLocaleDateString(language, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </article>
      </div>

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
          <div className="flex-1">
            {previousPage && (
              <Link
                href={`/${language}/${previousPage.displayPath}`}
                className="inline-flex items-center text-sm text-base-content/70 hover:text-primary transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <div>
                  <div className="text-xs text-base-content/50">
                    {t('previousPage', language)}
                  </div>
                  <div className="font-medium">
                    {previousPage.metadata.title}
                  </div>
                </div>
              </Link>
            )}
          </div>

          <div className="flex-1 text-right">
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
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
