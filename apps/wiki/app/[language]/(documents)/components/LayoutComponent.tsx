"use client";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import TableOfContents from "@/components/TableOfContents";
import MobileTableOfContents from "@/components/MobileTableOfContents";
import type { DocItem } from "@/service/directory-service-client";
import { useParams, usePathname } from "next/navigation";
import SuggestionBox from "@/components/SuggestionBox";

export default function LayoutComponent({
  navigationItems,
  language,
  children,
}: {
  navigationItems: Map<string, DocItem[]>;
  language: string;
  children: React.ReactNode;
}) {
  //const pathname = usePathname();
  //const isShowSidebar = shouldShowSidebar(pathname);
  //const isShowTableOfContents = shouldShowTableOfContents(pathname);
  const isShowSidebar = true;
  const isShowTableOfContents = true;

  const params = useParams<{ slug: string[] }>();
  const subfolder = params.slug?.[0];

  const items = navigationItems.get(subfolder) ?? [];

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex gap-8">
        {/* 桌面端侧边栏 */}
        {isShowSidebar && (
          <aside className="hidden lg:block lg:w-64 lg:shrink-0">
            <div
              id="sidebar-scroll-container"
              className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto"
            >
              <div className="p-4 rounded-xl bg-base-100/50 backdrop-blur-sm border border-base-300/50 shadow-sm">
                <Sidebar items={items} language={language} />
              </div>
            </div>
          </aside>
        )}

        {/* 主要内容区域 */}
        <main className="flex-1 min-w-0">
          {children}
          <div className="mt-8">
            <SuggestionBox />
          </div>
        </main>

        {isShowTableOfContents && (
          // 桌面端右侧目录区域
          <aside className="hidden xl:block xl:w-48 xl:shrink-0">
            <div className="sticky top-24 border border-base-300/50 shadow-sm rounded-xl">
              <TableOfContents language={language} />
            </div>
          </aside>
        )}
      </div>

      {/* 移动端侧边栏组件 */}
      {isShowSidebar && (
        <MobileSidebar navigationItems={items} language={language} />
      )}

      {/* 移动端目录组件 */}
      {isShowTableOfContents && <MobileTableOfContents language={language} />}
    </div>
  );
}
