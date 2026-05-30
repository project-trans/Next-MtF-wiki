'use client';

import { bannerHeightAtom } from '@/lib/banner-atoms';
import { t } from '@/lib/i18n/client';
import { useAtom } from 'jotai';
import { SquareMenu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import {
  type TocItem,
  extractHeadings,
  scrollToHeading,
} from './tableOfContentsUtils';

interface MobileTableOfContentsProps {
  language: string;
}

export default function MobileTableOfContents({
  language,
}: MobileTableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [bannerHeight] = useAtom(bannerHeightAtom);

  useEffect(() => {
    // 提取页面中main元素内的标题
    const extractHeadingsLocal = () => {
      const items = extractHeadings();

      setTocItems(items);
    };

    extractHeadingsLocal();

    // 监听页面内容变化
    const observer = new MutationObserver(() => {
      extractHeadingsLocal();
    });

    // 开始观察main元素变化
    const mainElement = document.querySelector('main');
    if (mainElement) {
      observer.observe(mainElement, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // 滚动监听，高亮当前标题
    const handleScroll = () => {
      const headings = tocItems
        .map((item) => ({
          id: item.id,
          element: document.getElementById(item.id),
        }))
        .filter((item) => item.element);

      let currentId = '';
      for (const heading of headings) {
        if (heading.element) {
          const rect = heading.element.getBoundingClientRect();
          if (rect.top <= 100) {
            currentId = heading.id;
          } else {
            break;
          }
        }
      }

      setActiveId(currentId);
    };

    if (tocItems.length > 0) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [tocItems]);

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 如果没有main元素或没有标题，不显示按钮
  if (tocItems.length === 0) {
    return null;
  }

  // 计算按钮的底部位置，如果有 banner 就在 banner 上方
  const buttonBottomPosition =
    bannerHeight > 0 ? `${bannerHeight + 24}px` : '24px';

  return (
    <>
      {/* 浮动按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-6 z-40 xl:hidden p-3 rounded-full bg-base-200/80 backdrop-blur-sm text-base-content shadow-lg hover:bg-base-200 transition-all duration-200 hover:scale-105 border border-base-300/50"
        style={{ bottom: buttonBottomPosition }}
        aria-label={t('tableOfContents', language)}
      >
        <SquareMenu className="w-5 h-5" />
      </button>

      {/* 目录弹窗 */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setIsOpen(false);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={t('closeToc', language)}
            />

            {/* 弹窗内容 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-base-100 rounded-t-xl shadow-2xl border-t border-base-300"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b border-base-300 bg-primary/5">
                <h2 className="text-lg font-semibold text-base-content flex items-center space-x-2">
                  <SquareMenu className="w-5 h-5 text-primary" />
                  <span>{t('tableOfContents', language)}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-base-300/50 transition-colors"
                  aria-label={t('close', language)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 目录内容 */}
              <div className="overflow-y-auto max-h-96 p-4">
                <nav className="space-y-1">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        scrollToHeading(item.id);
                        setIsOpen(false);
                      }}
                      className={`
                      block w-full text-left text-sm transition-colors
                      ${item.level === 1 ? 'font-medium' : ''}
                      ${item.level === 2 ? 'pl-3' : ''}
                      ${item.level === 3 ? 'pl-6' : ''}
                      ${item.level === 4 ? 'pl-9' : ''}
                      ${item.level >= 5 ? 'pl-12' : ''}
                      ${
                        activeId === item.id
                          ? 'bg-secondary text-secondary-content font-medium'
                          : 'text-base-content/80 hover:text-base-content hover:bg-base-200/50'
                      }
                      py-2 px-3 rounded-lg
                    `}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
