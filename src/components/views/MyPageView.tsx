import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MyPageView = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: '로그아웃 실패',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/auth', { replace: true });
    }
  };

  const menuItems = [
    { icon: User, label: "프로필 설정", description: "개인 정보 관리" },
    { icon: Bell, label: "알림 설정", description: "푸시 알림 관리" },
    { icon: Shield, label: "보안 설정", description: "비밀번호 및 2FA" },
    { icon: HelpCircle, label: "고객센터", description: "FAQ 및 문의" },
  ];

  const displayName = profile?.display_name || user?.email?.split('@')[0] || '사용자';
  const email = user?.email || '';

  return (
    <div className="bg-background min-h-full">
      {/* Header */}
      <header className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">마이페이지</h1>
      </header>

      <div className="px-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium mt-1">
              <Check className="w-3 h-3" />
              인증 완료
            </span>
          </div>
        </div>

        {/* Trust Score */}
        <div className="bg-gradient-primary rounded-2xl p-5 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">현재 신뢰 등급</p>
              <p className="text-2xl font-bold">Diamond Tier</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">누적 점수</p>
              <p className="text-2xl font-bold">980점</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors ${
                  index < menuItems.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">로그아웃</span>
        </button>

        <p className="text-center text-xs text-muted-foreground pb-4">
          VeriNode v1.0.0
        </p>
      </div>
    </div>
  );
};

export default MyPageView;