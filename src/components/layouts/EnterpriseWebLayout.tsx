import { ReactNode } from 'react';
import EnterpriseSidebar from '@/components/enterprise/EnterpriseSidebar';
import EnterpriseHeader from '@/components/enterprise/EnterpriseHeader';
import type { EnterpriseTab } from '@/pages/Enterprise';

interface EnterpriseWebLayoutProps {
  children: ReactNode;
  activeTab: EnterpriseTab;
  onTabChange: (tab: EnterpriseTab) => void;
}

const EnterpriseWebLayout = ({ children, activeTab, onTabChange }: EnterpriseWebLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* 좌측 사이드바 - 고정 */}
      <EnterpriseSidebar activeTab={activeTab} onTabChange={onTabChange} />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* 상단 헤더 */}
        <EnterpriseHeader />
        
        {/* 콘텐츠 */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* 하단 철학 문구 */}
        <footer className="py-4 px-8 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            데이터의 주인은 나이며, 무상으로 제공하지 않는다
          </p>
        </footer>
      </div>
    </div>
  );
};

export default EnterpriseWebLayout;
