import { getLanguageConfigs, getSEOConfig } from '@/lib/site-config';
import {
  generateAllStaticParams,
  getDocItemByNavigationMap,
  getDocsNavigationMap,
} from '@/service/directory-service';
import { getFileLastModifiedTime } from '@/service/path-utils';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seoConfig = getSEOConfig();
  const languageConfigs = getLanguageConfigs();

  const entries: Array<{ url: string; realPath?: string | null }> = [];

  // 添加首页 (该页会跳转，所以不添加)
  // urls.push({
  //   url: seoConfig.siteUrl,
  //   lastModified: new Date(),
  //   changeFrequency: 'daily',
  //   priority: 1,
  // });

  // 为每种语言添加语言首页
  for (const langConfig of languageConfigs) {
    entries.push({
      url: `${seoConfig.siteUrl}${langConfig.code}`,
    });

    // 为每个子目录生成页面URL
    for (const subfolder of langConfig.subfolders) {
      try {
        const params = await generateAllStaticParams(
          langConfig.code,
          subfolder,
        );

        const { map: navigationItemMap } = await getDocsNavigationMap(
          langConfig.code,
          subfolder,
        );

        for (const param of params) {
          if (param.slug && param.slug.length > 0) {
            const path = param.slug.join('/');
            const url = `${seoConfig.siteUrl}${param.language}/${path}`;
            const docItem = getDocItemByNavigationMap(navigationItemMap, path);

            entries.push({
              url,
              realPath: docItem?.realPath || null,
            });
          }
        }
      } catch (error) {
        console.warn(
          `Failed to generate sitemap for ${langConfig.code}/${subfolder}:`,
          error,
        );
      }
    }
  }

  const parsedConcurrency = Number(process.env.SITEMAP_LASTMOD_CONCURRENCY);
  const concurrency = Math.max(
    1,
    Number.isFinite(parsedConcurrency) && parsedConcurrency > 0
      ? Math.floor(parsedConcurrency)
      : 8,
  );

  return mapWithConcurrency(entries, concurrency, async (entry) => {
    if (!entry.realPath) {
      return { url: entry.url };
    }

    const lastModified = await getFileLastModifiedTime(entry.realPath);

    if (!lastModified) {
      return { url: entry.url };
    }

    return { url: entry.url, lastModified };
  });
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const effectiveLimit =
    Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 1;
  const workerCount = Math.min(effectiveLimit, items.length);
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = currentIndex;
      currentIndex += 1;

      if (index >= items.length) {
        break;
      }

      results[index] = await mapper(items[index], index);
    }
  }

  if (workerCount === 0) {
    return results;
  }

  const workers = Array.from({ length: workerCount }, () => worker());

  await Promise.all(workers);

  return results;
}
