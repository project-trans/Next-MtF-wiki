'use client';

import { cache } from '@/lib/cache';
import { FileText, Search, X } from 'lucide-react';
import MiniSearch, { type SearchResult } from 'minisearch';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '../progress';

interface SearchBoxProps {
  language: string;
  placeholder?: string;
  serverBuildIndex: boolean;
  notFoundText?: string;
  tryDifferentKeywordsText?: string;
  startSearchText?: string;
  enterKeywordsText?: string;
  compact?: boolean;
}

const loadSearchIndex = cache(
  async (language: string, serverBuildIndex: boolean) => {
    // 构建 API URL，包含部署时间查询参数
    const deployTime = process.env.NEXT_PUBLIC_DEPLOY_TIME;
    const url = new URL(
      `/api/search-index/${language}`,
      window.location.origin,
    );
    if (deployTime) {
      url.searchParams.set('deployTime', deployTime);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch search index: ${response.status}`);
    }

    const data = await response.json();

    let searchInstance: MiniSearch;

    if (serverBuildIndex) {
      // 服务端构建索引：从序列化的索引重建 MiniSearch 实例
      if (!data.index) {
        console.warn('No search index found');
        return;
      }

      searchInstance = MiniSearch.loadJSON(data.index, {
        fields: ['title', 'content', 'description'], // 搜索字段
        storeFields: ['title', 'url', 'description', 'section'], // 存储字段
      });

      console.log(
        `Search index loaded from server with ${data.totalCount} documents`,
      );
      return searchInstance;
    } else {
      // 客户端构建索引：从文档数据构建索引
      if (!data.documents || data.documents.length === 0) {
        console.warn('No documents found in search index');
        return;
      }

      searchInstance = new MiniSearch({
        fields: ['title', 'content', 'description'], // 搜索字段
        storeFields: ['title', 'url', 'description', 'section'], // 存储字段
        searchOptions: {
          boost: { title: 2, description: 1.5 }, // 标题权重更高
          fuzzy: 0.2, // 模糊搜索
          prefix: true, // 前缀匹配
          combineWith: 'AND', // 组合方式
        },
      });

      // 添加文档到索引
      searchInstance.addAll(data.documents);

      console.log(
        `Search index built on client with ${data.documents.length} documents`,
      );
      return searchInstance;
    }
  },
);

export default function SearchBoxClient({
  language,
  placeholder,
  serverBuildIndex,
  notFoundText,
  tryDifferentKeywordsText,
  startSearchText,
  enterKeywordsText,
  compact = false,
}: SearchBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [miniSearch, setMiniSearch] = useState<MiniSearch | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  // 初始化搜索索引
  const initializeSearch = useCallback(async () => {
    if (isInitialized || isLoading) return;

    try {
      setIsLoading(true);

      const searchInstance = await loadSearchIndex(language, serverBuildIndex);
      if (!searchInstance) {
        throw new Error('Failed to load search index');
      }
      setMiniSearch(searchInstance);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize search:', error);
    } finally {
      setIsLoading(false);
    }
  }, [language, serverBuildIndex, isInitialized, isLoading]);

  // 执行搜索
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!miniSearch || !searchQuery.trim()) {
        setResults([]);
        return;
      }

      try {
        const searchResults = miniSearch.search(searchQuery);

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      }
    },
    [miniSearch],
  );

  // 处理搜索输入
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    // 如果还没有初始化搜索索引，先初始化
    if (!isInitialized) {
      initializeSearch();
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300); // 防抖

    return () => clearTimeout(timeoutId);
  }, [query, performSearch, isInitialized, initializeSearch]);

  const closeResultPanel = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults(null);
    if (compact && modalRef.current) {
      modalRef.current.close();
    }
  }, [compact]);

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    if (compact && modalRef.current) {
      modalRef.current.close();
    }
  };

  const handleSearchButtonClick = useCallback(() => {
    if (compact && modalRef.current) {
      modalRef.current.showModal();
      setIsOpen(true);
      // 延迟聚焦，确保modal已渲染
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [compact]);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeResultPanel();
      }

      // Ctrl/Cmd + K 聚焦到搜索框
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (compact) {
          handleSearchButtonClick();
        } else {
          inputRef.current?.focus();
          setIsOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [compact, closeResultPanel, handleSearchButtonClick]);

  // 处理点击外部关闭 (只在非compact模式下使用)
  useEffect(() => {
    if (compact) return; // compact模式下由modal自己处理

    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        closeResultPanel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [compact, closeResultPanel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi',
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  // 骨架屏组件
  const SkeletonLoader = () => (
    <div className="py-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={index}
          className="px-4 py-3 border-b border-base-300/50 last:border-b-0"
        >
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 skeleton mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-4 skeleton mb-2" />
              <div className="h-3 skeleton mb-2 w-3/4" />
              <div className="h-3 skeleton w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const isShowSkeleton =
    isLoading || !isInitialized || !results || query === '';

  // 紧凑模式：显示搜索按钮
  if (compact) {
    return (
      <div>
        <button
          type="button"
          onClick={handleSearchButtonClick}
          className="p-2 hover:text-primary transition-colors rounded-lg hover:bg-base-200/50"
          title={placeholder}
        >
          <Search className="h-5 w-5" />
        </button>

        {/* 全局搜索对话框 */}
        <dialog ref={modalRef} className="modal h-screen">
          <div className="modal-box w-11/12 max-w-2xl p-0">
            {/* 搜索框区域 */}
            <div className="p-3 border-b border-base-300">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  placeholder={placeholder}
                  className="w-full pl-12 pr-12 py-3 text-lg bg-transparent border-none focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={closeResultPanel}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 搜索结果区域 */}
            <div className="max-h-96 overflow-y-auto">
              {query &&
                (isShowSkeleton ? (
                  // 显示骨架屏加载状态
                  <SkeletonLoader />
                ) : results.length > 0 ? (
                  // 显示搜索结果
                  <div className="py-2">
                    {results.map((result) => (
                      <Link
                        key={result.id}
                        href={result.url}
                        onClick={handleResultClick}
                        className="block px-6 py-4 hover:bg-base-200 transition-colors border-b border-base-300/50 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base-content mb-1">
                              {highlightMatch(result.title, query)}
                            </h3>
                            {result.description && (
                              <p className="text-sm text-base-content/70 mb-2 line-clamp-2">
                                {highlightMatch(result.description, query)}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                                {result.section}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  // 没有搜索结果
                  <div className="p-8 text-center text-base-content/60">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">{notFoundText}</p>
                    <p className="text-sm">{tryDifferentKeywordsText}</p>
                  </div>
                ))}

              {!query && (
                <div className="p-8 text-center text-base-content/60">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">{startSearchText}</p>
                  <p className="text-sm">{enterKeywordsText}</p>
                </div>
              )}
            </div>
          </div>

          {/* 点击背景关闭 */}
          <form method="dialog" className="modal-backdrop">
            <button
              tabIndex={-1}
              aria-hidden="true"
              type="button"
              onClick={closeResultPanel}
            />
          </form>
        </dialog>
      </div>
    );
  }

  // 非紧凑模式：原有的inline搜索框
  return (
    <div ref={searchRef} className="relative">
      {/* 搜索输入框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 text-sm bg-base-200/50 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-base-content/60 bg-base-200 border border-base-300 rounded">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* 搜索结果下拉框 */}
      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isShowSkeleton ? (
            // 显示骨架屏加载状态
            <SkeletonLoader />
          ) : results.length > 0 ? (
            // 显示搜索结果
            <div className="py-2">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={result.url}
                  onClick={handleResultClick}
                  className="block px-4 py-3 hover:bg-base-200 transition-colors border-b border-base-300/50 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base-content truncate">
                        {highlightMatch(result.title, query)}
                      </h3>
                      {result.description && (
                        <p className="text-sm text-base-content/70 mt-1 line-clamp-2">
                          {highlightMatch(result.description, query)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                          {result.section}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // 没有搜索结果
            <div className="p-4 text-center text-base-content/60">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{notFoundText}</p>
              <p className="text-xs mt-1">{tryDifferentKeywordsText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
