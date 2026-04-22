import { Shield, Store, ShoppingCart, FileText, CreditCard, Settings, LogOut, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { EnterpriseTab } from '@/pages/Enterprise';

interface EnterpriseSidebarProps {
  activeTab: EnterpriseTab;
  onTabChange: (tab: EnterpriseTab) => void;
}

const menuItems: { id: EnterpriseTab; label: string; icon: typeof Store }[] = [
  { id: 'market', label: '데이터 마켓', icon: Store },
  { id: 'purchases', label: '구매 내역', icon: ShoppingCart },
  { id: 'approvals', label: '승인 관리', icon: ClipboardCheck },
  { id: 'reports', label: '리포트', icon: FileText },
  { id: 'subscription', label: '구독 관리', icon: CreditCard },
  { id: 'settings', label: '설정', icon: Settings },
];

const EnterpriseSidebar = ({ activeTab, onTabChange }: EnterpriseSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: '로그아웃 완료',
      description: '안전하게 로그아웃되었습니다.',
    });
    navigate('/auth');
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 fixed h-full flex flex-col">
      {/* 로고 */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-8 h-8 text-cyan-500" />
            <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-full" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">VeriNode</h1>
            <p className="text-xs text-slate-400">Enterprise</p>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 하단 로그아웃 */}
      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="w-5 h-5 mr-3" />
          로그아웃
        </Button>
      </div>
    </aside>
  );
};

export default EnterpriseSidebar;
