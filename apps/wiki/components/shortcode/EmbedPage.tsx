import fs from 'node:fs/promises';
import path from 'node:path';
import { ArrowUpRight } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import remarkGfm from 'remark-gfm';
import remarkHeadingId from 'remark-heading-id';
import remarkMath from 'remark-math';
import remarkCsvToTable from '@/app/[language]/(documents)/[...slug]/remarkCsvToTable';
import remarkHtmlContent from '@/app/[language]/(documents)/[...slug]/remarkHtmlContent';
import remarkQrCode, {
  remarkHugoShortcode,
} from '@/app/[language]/(documents)/[...slug]/remarkHugoShortcode';
import { getContentDir } from '@/app/[language]/(documents)/[...slug]/utils';
import { getLanguageConfig } from '@/lib/site-config';
import {
  type DocItem,
  getDocsNavigationMap,
} from '@/service/directory-service';
import { ShortCodeComp } from './index';
import type { ShortCodeCompProps } from './types';

export default async function EmbedPage({
  attrs,
  mdContext,
}: ShortCodeCompProps) {
  // Parse attrs
  const args = Object.fromEntries(
    attrs.map((attr) => {
      if (Array.isArray(attr)) {
        return [attr[0] || `_pos_${attrs.indexOf(attr)}`, attr[1]];
      }
      return [String(attr), String(attr)];
    }),
  );

  const pathArg = args.path || args._pos_0;
  const startArg = args.start || args._pos_1;
  const endArg = args.end || args._pos_2;

  const startLine = startArg ? Number.parseInt(startArg, 10) : 0;
  const endLine = endArg ? Number.parseInt(endArg, 10) : 0;

  if (!pathArg) {
    return (
      <div className="alert alert-error">
        <span>EmbedPage: path attribute is required</span>
      </div>
    );
  }

  if (!mdContext?.currentLanguage) {
    return (
      <div className="alert alert-error">
        <span>EmbedPage: currentLanguage context is missing</span>
      </div>
    );
  }

  const language = mdContext.currentLanguage;

  let targetSlug = pathArg;
  if (targetSlug.startsWith('/')) targetSlug = targetSlug.slice(1);
  if (targetSlug.startsWith(`${language}/`))
    targetSlug = targetSlug.slice(language.length + 1);

  // Try to find file
  const contentDir = getContentDir();
  const langDir = path.join(contentDir, language);

  const extensions = ['.md', '.mdx', '/_index.md', '/index.md'];
  let foundPath = '';
  let isIndex = false;

  const possiblePaths = [path.join(langDir, targetSlug)];

  for (const basePath of possiblePaths) {
    // 1. Check if basePath exists and handle directory vs file
    try {
      const stats = await fs.stat(basePath);
      if (stats.isDirectory()) {
        // It's a directory, try index files inside
        const indexFiles = ['_index.md', 'index.md'];
        for (const indexFile of indexFiles) {
          try {
            const p = path.join(basePath, indexFile);
            await fs.access(p);
            foundPath = p;
            isIndex = true;
            break;
          } catch {}
        }
      } else if (stats.isFile()) {
        foundPath = basePath;
        if (basePath.endsWith('index.md')) isIndex = true;
      }
      if (foundPath) break;
    } catch {
      // basePath doesn't exist directly, continue to check extensions
    }

    // 2. Check extensions (.md, .mdx)
    for (const ext of ['.md', '.mdx']) {
      try {
        const p = basePath + ext;
        await fs.access(p);
        foundPath = p;
        break;
      } catch {}
    }
    if (foundPath) break;
  }

  if (!foundPath) {
    return (
      <div className="alert alert-warning">
        <span>EmbedPage: Content not found for {targetSlug}</span>
      </div>
    );
  }

  // Read content
  const content = await fs.readFile(foundPath, 'utf-8');

  const lines = content.split('\n');
  const start = startLine > 0 ? startLine - 1 : 0;
  const end = endLine > 0 ? endLine : lines.length;

  // Validate range
  if (start >= lines.length || start < 0) {
    return (
      <div className="alert alert-warning">
        EmbedPage: Start line out of range
      </div>
    );
  }

  const slicedContent = lines.slice(start, end).join('\n');

  // 获取所有导航项以支持跨板块引用
  const languageConfig = getLanguageConfig(language);
  const allNavigationItems: DocItem[] = [];
  if (languageConfig) {
    for (const subfolder of languageConfig.subfolders) {
      const { root } = await getDocsNavigationMap(language, subfolder);
      // 确保根节点有 originalSlug，以便可以被引用
      const rootWithSlug = {
        ...root,
        originalSlug: root.originalSlug || subfolder,
      };
      allNavigationItems.push(rootWithSlug);
    }
  }

  let displaySlug = targetSlug;
  // Clean up displaySlug for View Source URL
  displaySlug = displaySlug.replace(/(\.mdx?)$/, '');
  displaySlug = displaySlug.replace(/\/(_)?index$/, '');
  displaySlug = displaySlug.replace(/(_)?index$/, '');

  const hugoRemarkOptions = {
    currentLanguage: language,
    navigationItems: allNavigationItems,
    currentSlug: targetSlug,
    realCurrentSlug: targetSlug,
    isCurrentSlugIndex: isIndex,
  };

  return (
    <div className="my-4 border rounded-lg overflow-hidden bg-base-100 shadow-sm">
      <div className="bg-base-200 px-4 py-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-base-content/70">
          Embedded Content
        </span>
        <a
          href={`/${language}/${displaySlug}`}
          className="flex items-center gap-1 text-primary hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          View Source
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
      <div className="p-4 prose max-w-none">
        <MDXRemote
          source={slicedContent}
          components={{ ShortCodeComp } as any}
          options={{
            mdxOptions: {
              remarkPlugins: [
                [remarkHeadingId, { defaults: true }],
                [remarkCsvToTable, hugoRemarkOptions],
                [remarkHugoShortcode, hugoRemarkOptions],
                remarkGfm,
                remarkMath,
                remarkHtmlContent,
                remarkQrCode,
              ],
            },
          }}
        />
      </div>
    </div>
  );
}
