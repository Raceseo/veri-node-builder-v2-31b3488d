import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const SettingsTab = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['settings-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('display_name, email, is_verified')
        .eq('id', user.id)
        .maybeSingle();

      return { ...data, authEmail: user.email };
    }
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "로그아웃 완료",
        description: "다음에 또 만나요!",
      });
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "로그아웃 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile Settings", description: "Manage your profile" },
        { icon: Bell, label: "Notifications", description: "Configure alerts" },
        { icon: Shield, label: "Security", description: "Password & 2FA" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", description: "FAQs and guides" },
      ],
    },
  ];

  const displayName = profile?.display_name || profile?.authEmail?.split('@')[0] || 'User';
  const email = profile?.authEmail || '';
  const isVerified = profile?.is_verified ?? false;

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="bg-card rounded-xl p-4 shadow-card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#3182F6]/10 flex items-center justify-center">
          <User className="w-8 h-8 text-[#3182F6]" />
        </div>
        <div>
          <p className="font-bold text-foreground">{displayName}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
            isVerified 
              ? 'bg-success/10 text-success' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            <Shield className="w-3 h-3" /> 
            {isVerified ? 'Verified' : 'Unverified'}
          </span>
        </div>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group) => (
        <div key={group.title} className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="px-4 py-3 bg-secondary/50">
            <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
          </div>
          <div className="divide-y divide-border">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#3182F6]/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#3182F6]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button 
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
      </button>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground">
        VeriNode v1.0.0
      </p>
    </div>
  );
};

export default SettingsTab;