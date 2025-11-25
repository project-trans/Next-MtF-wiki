import { getDocsNavigationForClientForAllSubfolders } from '@/service/directory-service';
import LayoutComponent from './components/LayoutComponent';

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  // 获取文档导航数据
  const navigationItems =
    await getDocsNavigationForClientForAllSubfolders(language);
  return (
    <LayoutComponent navigationItems={navigationItems} language={language}>
      {children}
    </LayoutComponent>
  );
}
