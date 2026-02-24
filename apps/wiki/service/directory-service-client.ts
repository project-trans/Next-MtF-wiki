export interface DocItemForClient {
  name: string;
  path: string;
  children?: DocItemForClient[];
}
// 文档项接口
export interface DocItem {
  slug: string;
  originalSlug: string;
  displayPath: string;
  realPath: string; // 真实文件系统路径
  children?: DocItem[];
  isIndex?: boolean;
  metadata: DocMetadata;
  parentDisplayPath?: string;
}

export interface DocMetadata {
  title: string;
  description?: string | null;
  draft?: boolean;
  order?: number | null;
  preferredSlug?: string | null;
  aliases?: string[];
  redirectToSingleChild?: string | null;
}

export interface DocItemRedirectItem {
  slug: string;
  displayPath: string;
  redirectTo: string;
}

export interface DocNavigationOrderEntry {
  previous: string | null;
  next: string | null;
}

export type DocNavigationOrderMap = Map<string, DocNavigationOrderEntry>;
