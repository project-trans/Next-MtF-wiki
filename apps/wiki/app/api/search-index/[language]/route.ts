import fs from 'node:fs/promises';
import type { Frontmatter } from '@/app/[language]/(documents)/[...slug]/types';
import { getNonSelfClosingElements } from '@/app/[language]/(documents)/[...slug]/utils';
import { getLanguageConfig } from '@/lib/site-config';
import { getDocsNavigationRoot } from '@/service/directory-service';
import type { DocItem } from '@/service/directory-service-client';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { hugoShortcodeFromMarkdown } from 'mdast-util-md-hugo-marker';
import type { HugoShortcodeFromMarkdownOptions } from 'mdast-util-md-hugo-marker';
import { hugoShortcode } from 'micromark-extension-md-hugo-marker';
import MiniSearch from 'minisearch';
import { getFrontmatter } from 'next-mdx-remote-client/utils';
import { visit } from 'unist-util-visit';
export const dynamic = 'force-static';

// 生成静态参数
export async function generateStaticParams() {
  // 获取所有可用语言
  const { getAvailableLanguages } = await import('@/service/directory-service');
  const languages = await getAvailableLanguages();

  return languages.map((language) => ({
    language: language,
  }));
}

interface SearchDocument {
  id: string;
  title: string;
  content: string;
  url: string;
  description?: string;
  section: string;
}

// 使用 remark 和项目插件提取纯文本内容
function extractPlainText(strippedSource: string): string {
  try {
    const options: HugoShortcodeFromMarkdownOptions = {
      noSelfClosingElements: getNonSelfClosingElements(),
    };

    const tree = fromMarkdown(strippedSource, {
      extensions: [hugoShortcode()],
      mdastExtensions: [hugoShortcodeFromMarkdown(options)],
    });

    // 收集所有文本节点，跳过 Hugo shortcode 节点
    const textNodes: string[] = [];

    visit(tree, (node: any) => {
      // 跳过 Hugo shortcode 节点
      if (
        node.type === 'hugoShortcodeFlowElement' ||
        node.type === 'hugoShortcodeTextElement'
      ) {
        return 'skip';
      }

      // 收集文本节点
      if (node.type === 'text' && node.value) {
        if (node.value.trim()) {
          textNodes.push(node.value.trim());
        }
      }
    });

    // 合并所有文本，用空格分隔
    return textNodes.join(' ').replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Error extracting plain text with remark:', error);
    // 如果 remark 解析失败，回退到简单的正则表达式方法
    return strippedSource
      .replace(/\{\{<[^>]*>\}\}/g, '')
      .replace(/\{\{%[^%]*%\}\}/g, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/^\s*>\s+/gm, '')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }
}

// 递归收集所有文档并构建搜索索引
async function buildSearchIndex(
  items: DocItem[],
  language: string,
  subfolder: string,
  miniSearch: MiniSearch,
): Promise<void> {
  for (const item of items) {
    if (item.realPath && item.slug) {
      try {
        const fileContent = await fs.readFile(item.realPath, 'utf-8');
        const { frontmatter, strippedSource } =
          getFrontmatter<Frontmatter>(fileContent);

        // 跳过草稿文档
        if (frontmatter?.draft) {
          continue;
        }

        const plainContent = extractPlainText(strippedSource);

        const document: SearchDocument = {
          id: item.displayPath || item.slug,
          title: item.metadata.title,
          content: plainContent,
          url: `/${language}/${item.displayPath}`,
          description: frontmatter?.description
            ? String(frontmatter.description)
            : undefined,
          section: subfolder,
        };

        // 直接添加到 MiniSearch 索引
        miniSearch.add(document);
      } catch (error) {
        console.error(`Error processing document ${item.realPath}:`, error);
      }
    }

    // 递归处理子项
    if (item.children) {
      await buildSearchIndex(item.children, language, subfolder, miniSearch);
    }
  }
}

// 递归收集所有文档（用于客户端构建索引）
async function collectDocuments(
  items: DocItem[],
  language: string,
  subfolder: string,
  documents: SearchDocument[] = [],
): Promise<SearchDocument[]> {
  for (const item of items) {
    if (item.realPath && item.slug) {
      try {
        const fileContent = await fs.readFile(item.realPath, 'utf-8');
        const { frontmatter, strippedSource } =
          getFrontmatter<Frontmatter>(fileContent);

        // 跳过草稿文档
        if (frontmatter?.draft) {
          continue;
        }

        const plainContent = extractPlainText(strippedSource);

        const document: SearchDocument = {
          id: item.displayPath || item.slug,
          title: item.metadata.title,
          content: plainContent,
          url: `/${language}/${item.displayPath}`,
          description: frontmatter?.description
            ? String(frontmatter.description)
            : undefined,
          section: subfolder,
        };

        documents.push(document);
      } catch (error) {
        console.error(`Error processing document ${item.realPath}:`, error);
      }
    }

    // 递归处理子项
    if (item.children) {
      await collectDocuments(item.children, language, subfolder, documents);
    }
  }

  return documents;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ language: string }> },
) {
  try {
    const { language } = await params;

    // 获取该语言的所有子文件夹配置
    const languageConfig = getLanguageConfig(language);
    const subfolders = languageConfig?.subfolders || ['docs'];

    // 检查是否在服务端构建索引
    const serverBuildIndex =
      process.env.NEXT_PUBLIC_SERVER_BUILD_INDEX === 'true';

    if (serverBuildIndex) {
      // 服务端构建索引
      const miniSearch = new MiniSearch({
        fields: ['title', 'content', 'description'], // 搜索字段
        storeFields: ['title', 'url', 'description', 'section'], // 存储字段
        searchOptions: {
          boost: { title: 2, description: 1.5 }, // 标题权重更高
          fuzzy: 0.2, // 模糊搜索
          prefix: true, // 前缀匹配
          combineWith: 'AND', // 组合方式
        },
      });

      let totalDocuments = 0;

      // 遍历所有子文件夹，直接构建索引
      for (const subfolder of subfolders) {
        try {
          const rootItem = await getDocsNavigationRoot(language, subfolder);
          if (rootItem.children) {
            const beforeCount = miniSearch.documentCount;
            await buildSearchIndex(
              rootItem.children,
              language,
              subfolder,
              miniSearch,
            );
            totalDocuments += miniSearch.documentCount - beforeCount;
          }
        } catch (error) {
          console.error(
            `Error processing subfolder ${subfolder} for language ${language}:`,
            error,
          );
        }
      }

      // 序列化 MiniSearch 索引
      const serializedIndex = JSON.stringify(miniSearch);

      const response = Response.json({
        index: serializedIndex,
        language,
        totalCount: totalDocuments,
      });

      // 设置缓存头
      response.headers.set(
        'Cache-Control',
        'public, max-age=31536000, immutable',
      );

      return response;
    } else {
      // 客户端构建索引：返回文档数据
      const allDocuments: SearchDocument[] = [];

      // 遍历所有子文件夹，收集文档
      for (const subfolder of subfolders) {
        try {
          const rootItem = await getDocsNavigationRoot(language, subfolder);
          if (rootItem.children) {
            const documents = await collectDocuments(
              rootItem.children,
              language,
              subfolder,
            );
            allDocuments.push(...documents);
          }
        } catch (error) {
          console.error(
            `Error processing subfolder ${subfolder} for language ${language}:`,
            error,
          );
        }
      }

      const response = Response.json({
        documents: allDocuments,
        language,
        totalCount: allDocuments.length,
      });

      // 设置缓存头
      response.headers.set(
        'Cache-Control',
        'public, max-age=31536000, immutable',
      );

      return response;
    }
  } catch (error) {
    console.error('Error generating search index:', error);
    const errorResponse = Response.json(
      {
        error: 'Failed to generate search index',
        index: null,
        documents: [],
        language: '',
        totalCount: 0,
      },
      { status: 500 },
    );

    errorResponse.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable',
    );

    return errorResponse;
  }
}
