import fs from 'node:fs/promises';
import path from 'node:path';
import { cache } from '@/lib/cache';
import { getLanguageConfig, getLanguageConfigs } from '@/lib/site-config';
import { getFrontmatter } from 'next-mdx-remote-client/utils';
import type { Frontmatter } from '../app/[language]/(documents)/[...slug]/types';
import {
  getContentDir,
  getIndexPageSlugs,
} from '../app/[language]/(documents)/[...slug]/utils';
import type {
  DocItem,
  DocItemForClient,
  DocItemRedirectItem,
  DocMetadata,
  DocNavigationOrderEntry,
  DocNavigationOrderMap,
} from './directory-service-client';
import { getLocalImagePath } from './path-utils';

export { getLocalImagePath };

export function getDirPath(slug: string): string {
  return path.dirname(slug);
}

async function getDocFrontmatter(
  filePath: string,
): Promise<Frontmatter | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter } = getFrontmatter<Frontmatter>(content);
    return frontmatter;
  } catch (error) {
    return null;
  }
}

// 检查 markdown 文件除了 frontmatter 外是否为空白内容
async function isMarkdownContentEmpty(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { strippedSource } = getFrontmatter(content);
    // 移除所有空白字符后检查是否为空
    return strippedSource.trim() === '';
  } catch (error) {
    return false;
  }
}

async function getDocTitleFromFrontmatter(
  filePath: string,
  frontmatter: Frontmatter | null,
): Promise<string> {
  return frontmatter?.title || path.basename(filePath, path.extname(filePath));
}

async function getDocMetadata(
  filePath: string,
  frontmatter: Frontmatter | null,
): Promise<DocMetadata> {
  const preferredSlug = frontmatter?.slug;
  const aliases = frontmatter?.aliases || null;
  const aliasesArray: string[] = [];
  if (aliases) {
    // console.log('aliases: ', aliases);
    if (typeof aliases === 'string') {
      aliasesArray.push(aliases);
    } else if (Array.isArray(aliases)) {
      aliasesArray.push(...aliases);
    }
  }
  return {
    title: await getDocTitleFromFrontmatter(filePath, frontmatter),
    description: frontmatter?.description?.toString() || null,
    draft: Boolean(frontmatter?.draft),
    order: Number(frontmatter?.weight) || null,
    preferredSlug: preferredSlug?.toString() || null,
    aliases: aliasesArray,
    redirectToSingleChild: null,
  };
}

// 获取文档标题的辅助函数
async function getDocTitle(filePath: string): Promise<string> {
  return getDocTitleFromFrontmatter(
    filePath,
    await getDocFrontmatter(filePath),
  );
}

// 递归获取目录结构
async function getDirectoryStructure(
  dirPath: string,
  basePath = '',
  parentPath = '',
  contentDirPath = '',
): Promise<DocItem> {
  const contentDir = contentDirPath || getContentDir();
  const children: DocItem[] = [];

  {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    // 处理文件和目录
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name);
      const currentDisplayPath = parentPath
        ? `${parentPath}/${entry.name}`
        : entry.name;

      if (entry.isDirectory()) {
        // 递归处理子目录
        const subDirItem = await getDirectoryStructure(
          entryPath,
          relativePath,
          currentDisplayPath,
          contentDir,
        );

        if (subDirItem.isIndex) {
          // 如果有 _index.md 文件，创建目录项，包含子项
          subDirItem.slug = subDirItem.metadata.preferredSlug || entry.name;
          subDirItem.originalSlug = entry.name;
          subDirItem.parentDisplayPath = parentPath;
          // console.log("parentPath: ", parentPath, "currentDisplayPath: ", currentDisplayPath);
          children.push(subDirItem);
        } else {
          // 只有文件，没有子目录，跳过当前目录，将文件提升到上一级
          for (const child of subDirItem.children ?? []) {
            children.push({
              ...child,
              parentDisplayPath: currentDisplayPath,
              // fullPath 保持不变，因为实际文件路径包含这个目录
            });
          }
        }
      } else if (
        entry.name.endsWith('.md') &&
        !getIndexPageSlugs().includes(entry.name)
      ) {
        // 处理 Markdown 文件
        const metadata = await getDocMetadata(
          entryPath,
          await getDocFrontmatter(entryPath),
        );
        const slug = entry.name.replace(/\.md$/, '');

        const preferredSlug = metadata.preferredSlug || slug;

        const fileFullPath = parentPath
          ? `${parentPath}/${preferredSlug}`
          : preferredSlug;
        const fileRealPath = entryPath;

        const toPush = {
          metadata,
          slug: preferredSlug,
          originalSlug: slug,
          displayPath: fileFullPath,
          realPath: fileRealPath,
          parentDisplayPath: parentPath,
        };

        children.push(toPush);
      }
    }
  }

  // 确定当前目录的元数据
  let dirHasIndex = false;
  let dirIndexPath = '';
  for (const indexPageSlug of getIndexPageSlugs()) {
    const p = path.join(dirPath, indexPageSlug);
    try {
      await fs.access(p);
      dirIndexPath = p;
      dirHasIndex = true;
      break;
    } catch (error) {
      // 未找到，继续
    }
  }

  let dirMetadata: DocMetadata;
  if (dirHasIndex) {
    dirMetadata = await getDocMetadata(
      dirIndexPath,
      await getDocFrontmatter(dirIndexPath),
    );
  } else {
    dirMetadata = { title: path.basename(parentPath || dirPath) };
  }

  // 按顺序和标题排序
  const sortedChildren = children
    .filter((item) => {
      return !item.metadata.draft;
    })
    .sort((a, b) => {
      const orderA = a.metadata?.order || Number.MAX_SAFE_INTEGER;
      const orderB = b.metadata?.order || Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.metadata.title.localeCompare(b.metadata.title);
    });

  const realP = dirHasIndex ? dirIndexPath : dirPath;

  // 检查是否需要设置单子页面重定向
  if (dirHasIndex && sortedChildren.length === 1) {
    const frontmatter = await getDocFrontmatter(dirIndexPath);
    const isCollapsible = Boolean(frontmatter?.collapsible);
    const isEmpty = await isMarkdownContentEmpty(dirIndexPath);

    if (isCollapsible && isEmpty) {
      const singleChild = sortedChildren[0];
      dirMetadata.redirectToSingleChild = singleChild.displayPath;
    }
  }

  const result: DocItem = {
    metadata: dirMetadata,
    slug: '',
    originalSlug: '',
    displayPath: parentPath,
    realPath: realP,
    children: sortedChildren,
    isIndex: dirHasIndex,
  };

  return result;
}

// 获取所有可用的语言代码
export async function getAvailableLanguages(): Promise<string[]> {
  const languageConfigs = getLanguageConfigs();
  return languageConfigs.map((config) => config.code);
}

const getDocsNavigationRootInner = cache(
  async (language: string, subfolder: string): Promise<DocItem> => {
    const contentDir = path.join(getContentDir(), language, subfolder);

    const rootItem = await getDirectoryStructure(
      contentDir,
      '',
      subfolder,
      getContentDir(),
    );

    return rootItem;
  },
);

export const checkSubFolderExists = cache(
  async (language: string, subfolder: string): Promise<boolean> => {
    const contentDir = path.join(getContentDir(), language, subfolder);
    return await fs
      .access(contentDir)
      .then(() => true)
      .catch(() => false);
  },
);

export async function getDocsNavigationRoot(
  language: string,
  subfolder: string,
): Promise<DocItem> {
  return await getDocsNavigationRootInner(language, subfolder);
}
function shouldIncludeInNavigationOrder(item: DocItem): boolean {
  if (!item.displayPath) {
    return false;
  }
  if (item.metadata.redirectToSingleChild) {
    return false;
  }
  if (item.slug) {
    return true;
  }
  return Boolean(item.isIndex);
}

function collectNavigationOrder(item: DocItem, result: string[]): void {
  if (shouldIncludeInNavigationOrder(item)) {
    result.push(item.displayPath);
  }
  if (item.children) {
    for (const child of item.children) {
      collectNavigationOrder(child, result);
    }
  }
}

function buildNavigationOrder(root: DocItem): {
  order: string[];
  map: DocNavigationOrderMap;
} {
  const displayPaths: string[] = [];
  collectNavigationOrder(root, displayPaths);
  const orderMap: DocNavigationOrderMap = new Map<
    string,
    DocNavigationOrderEntry
  >();
  for (let index = 0; index < displayPaths.length; index++) {
    const current = displayPaths[index];
    const previous = index > 0 ? displayPaths[index - 1] : null;
    const next =
      index < displayPaths.length - 1 ? displayPaths[index + 1] : null;
    orderMap.set(current, { previous, next });
  }
  return { order: displayPaths, map: orderMap };
}

const getDocsNavigationRootWithMapInner = cache(
  async (
    language: string,
    subfolder: string,
  ): Promise<{
    root: DocItem;
    map: Map<string, DocItem>;
    redirectMap: Map<string, DocItemRedirectItem>;
    order: string[];
    orderMap: DocNavigationOrderMap;
  }> => {
    function addRedirectItem(
      item: DocItem,
      redirectMap: Map<string, DocItemRedirectItem>,
    ): void {
      if (item.metadata.aliases) {
        for (const alias of item.metadata.aliases) {
          function getAliasDisplayPath(alias: string): string | null {
            if (alias.startsWith('/')) {
              const aliasParts = alias.split('/').filter((part) => part !== '');
              if (
                aliasParts.length >= 2 &&
                aliasParts[0] === language &&
                aliasParts[1] === subfolder
              ) {
                return aliasParts.slice(1).join('/');
              } else {
                // console.warn(
                //   `Alias ${alias} starts with /, but not in ${language}/${subfolder}, skipping`,
                // );
                return null;
              }
            }
            const displayPath = path
              .join(path.dirname(item.displayPath), alias)
              .replaceAll('\\', '/');
            if (displayPath.startsWith(`${subfolder}/`)) {
              return displayPath
                .split('/')
                .filter((part) => part !== '')
                .join('/');
            } else {
              // console.warn(
              //   `Alias ${alias} locate in ${displayPath}, but not in ${language}/${subfolder}, skipping`,
              // );
              return null;
            }
          }
          const displayPath = getAliasDisplayPath(alias);
          if (displayPath) {
            // console.log('displayPath: ', displayPath);
            redirectMap.set(displayPath, {
              slug: alias,
              displayPath: displayPath,
              redirectTo: item.displayPath,
            });
          }
        }
      }
    }

    const rootItem = await getDocsNavigationRootInner(language, subfolder);
    const map = new Map<string, DocItem>();
    const redirectMap = new Map<string, DocItemRedirectItem>();
    map.set(rootItem.displayPath, rootItem);
    function collectPaths(item: DocItem): void {
      if (item.slug) {
        map.set(item.displayPath, item);
        addRedirectItem(item, redirectMap);
      }
      if (item.children) {
        for (const c of item.children) {
          collectPaths(c);
        }
      }
    }
    collectPaths(rootItem);
    const { order, map: navigationOrderMap } = buildNavigationOrder(rootItem);
    return {
      root: rootItem,
      map: map,
      redirectMap: redirectMap,
      order,
      orderMap: navigationOrderMap,
    };
  },
);

export async function getDocsNavigationMap(
  language: string,
  subfolder: string,
): Promise<{
  root: DocItem;
  map: Map<string, DocItem>;
  redirectMap: Map<string, DocItemRedirectItem>;
  order: string[];
  orderMap: DocNavigationOrderMap;
}> {
  const { root, map, redirectMap, order, orderMap } =
    await getDocsNavigationRootWithMapInner(language, subfolder);
  return { root, map, redirectMap, order, orderMap };
}

const getDocsNavigationForClientInner = cache(
  async (language: string, subfolder: string): Promise<DocItemForClient[]> => {
    const rootItems = await getDocsNavigation(language, subfolder);
    return rootItems.map((item) => clearServerLocalInfo(item));
  },
);

/**
 * 递归清空DocItem及其子项的realPath字段
 * @param item 要处理的DocItem对象
 * @returns 新的DocItem对象，realPath字段为空字符串
 */
export function clearServerLocalInfo(item: DocItem): DocItemForClient {
  // 创建新的DocItem对象，realPath为空字符串
  const newItem: DocItemForClient = {
    name: item.metadata.title,
    path: item.displayPath,
    children: item.children
      ? item.children.map((child) => clearServerLocalInfo(child))
      : undefined,
  };

  return newItem;
}

const getDocsNavigationForClientForAllSubfoldersInner = cache(
  async (language: string): Promise<Map<string, DocItemForClient[]>> => {
    const allSubfolders = getLanguageConfig(language)?.subfolders || [];

    const allItems = await Promise.all(
      allSubfolders.map(async (subfolder) => ({
        subfolder,
        items: await getDocsNavigationForClient(language, subfolder),
      })),
    );
    const map = new Map<string, DocItemForClient[]>();
    for (const item of allItems) {
      map.set(item.subfolder, item.items);
    }
    return map;
  },
);

export async function getDocsNavigationForClientForAllSubfolders(
  language: string,
): Promise<Map<string, DocItemForClient[]>> {
  return await getDocsNavigationForClientForAllSubfoldersInner(language);
}

export async function getDocsNavigationForClient(
  language: string,
  subfolder: string,
): Promise<DocItemForClient[]> {
  return await getDocsNavigationForClientInner(language, subfolder);
}

// 获取特定语言的文档导航
export async function getDocsNavigation(
  language: string,
  subfolder: string,
): Promise<DocItem[]> {
  try {
    const rootItem = await getDocsNavigationRoot(language, subfolder);
    return rootItem.children ?? [];
  } catch (error) {
    console.error(`Error getting docs navigation for ${language}:`, error);
    const emptyResult: DocItem[] = [];
    return emptyResult;
  }
}

export async function getDocFullPathByTrying(
  language: string,
  slugPath: string,
  contentRootDir: string,
  subfolder: string,
): Promise<string | null> {
  let fullPath = '';
  let fileExists = false;

  // 如果 slugPath 为空（访问 /docs/），直接查找 _index.md
  if (slugPath === '') {
    fullPath = path.join(contentRootDir, language, subfolder, '_index.md');
    fileExists = await fs
      .access(fullPath)
      .then(() => true)
      .catch(() => false);
    if (fileExists) {
      return fullPath;
    }
  } else {
    // 首先尝试 .md 后缀
    fullPath = path.join(contentRootDir, language, subfolder, `${slugPath}.md`);
    fileExists = await fs
      .access(fullPath)
      .then(() => true)
      .catch(() => false);

    if (fileExists) {
      return fullPath;
    }

    for (const indexPageSlug of getIndexPageSlugs()) {
      fullPath = path.join(
        contentRootDir,
        language,
        subfolder,
        slugPath,
        indexPageSlug,
      );

      fileExists = await fs
        .access(fullPath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        return fullPath;
      }
    }
  }

  return null;
}

export function getDocItemByNavigationMap(
  navigationItemMap: Map<string, DocItem>,
  displayPath: string,
): DocItem | null {
  return navigationItemMap.get(displayPath) || null;
}

export function getDocItemByNavigationInfo(
  slugs: string[],
  navigationItemRoot: DocItem,
): DocItem | null {
  if (slugs.length === 0) {
    return navigationItemRoot;
  }

  let currentItems = navigationItemRoot.children;
  for (let i = 0; i < slugs.length; i++) {
    const foundItem = currentItems?.find((item) => item.slug === slugs[i]);

    if (foundItem) {
      if (i === slugs.length - 1) {
        return foundItem;
      } else if (foundItem.children) {
        currentItems = foundItem.children;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
  return null;
}

// 检查特定路径在各语言中是否存在
export async function getAvailablePaths(
  languages: string[],
  currentPath: string,
  currentLanguage: string,
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  const pathWithoutLang = currentPath.replace(`/${currentLanguage}`, '');

  for (const lang of languages) {
    const targetPath = `/${lang}${pathWithoutLang}`;

    // 将路径转换为文件系统路径
    let filePath = '';
    if (pathWithoutLang === '') {
      // 首页
      filePath = path.join(getContentDir(), lang, '_index.md');
    } else {
      // 其他页面
      filePath = path.join(getContentDir(), lang, `${pathWithoutLang}.md`);
    }

    try {
      await fs.access(filePath);
      result[targetPath] = true;
    } catch (error) {
      result[targetPath] = false;
    }
  }

  return result;
}

export function getNavigationForOriginalSlug(
  languageCode: string,
  slug: string,
  navigationItems: DocItem[],
): DocItem | null {
  function findItem(items: DocItem[], slug: string): DocItem | null {
    for (const item of items) {
      if (item.originalSlug === slug) {
        return item;
      }
      if (item.children) {
        const child = findItem(item.children, slug);
        if (child) {
          return child;
        }
      }
    }
    return null;
  }

  const item = findItem(navigationItems, slug);

  return item || null;
}

// 生成静态参数（用于 generateStaticParams）
export async function generateAllStaticParams(
  language: string,
  subfolder: string,
): Promise<Array<{ language: string; slug?: string[] }>> {
  const allParams: Array<{
    language: string;
    slug?: string[];
    redirectTo?: string[];
  }> = [];

  // 使用指定的subfolder获取导航根节点
  const rootItem = await getDocsNavigationRoot(language, subfolder);

  if (rootItem.isIndex) {
    // 添加文档根路径
    allParams.push({ language: language, slug: [subfolder] });
  }

  // 递归收集所有路径
  function collectPaths(item: DocItem): void {
    if (item.slug && item.displayPath) {
      const slugParts = item.displayPath
        .split('/')
        .filter((part) => part !== '');
      allParams.push({ language: language, slug: slugParts });
    }
    if (item.children) {
      for (const child of item.children) {
        collectPaths(child);
      }
    }
  }

  // 收集根节点的所有子路径
  if (rootItem.children) {
    for (const child of rootItem.children) {
      collectPaths(child);
    }
  }

  return allParams;
}

export type { DocItem, DocMetadata };
