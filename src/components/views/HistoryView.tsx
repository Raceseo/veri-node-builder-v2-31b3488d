import { FileText, Share2, Shield, Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const getIconByType = (type: string) => {
  switch (type) {
    case 'document':
      return FileText;
    case 'sns':
      return Share2;
    case 'profile':
    default:
      return Shield;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'document':
      return '재직증명서 인증';
    case 'sns':
      return 'SNS 연동';
    case 'profile':
      return '본인 인증';
    default:
      return '인증';
  }
};

const HistoryView = () => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['verification-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('verification_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="bg-background min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-full">
      {/* Header */}
      <header className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">인증 내역</h1>
        <p className="text-sm text-muted-foreground">모든 인증 활동 기록을 확인하세요</p>
      </header>

      <div className="px-4 space-y-3">
        {(!history || history.length === 0) ? (
          <div className="bg-card rounded-2xl p-8 shadow-card text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">아직 인증 내역이 없습니다</p>
            <p className="text-sm text-muted-foreground mt-1">인증을 완료하면 이곳에 표시됩니다</p>
          </div>
        ) : (
          history.map((item) => {
            const Icon = getIconByType(item.verification_type);
            return (
              <div 
                key={item.id}
                className="bg-card rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">{getTypeLabel(item.verification_type)}</h3>
                      <span className="text-success font-bold">+{(item.vn_earned || 0).toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">
                        <Check className="w-3 h-3" />
                        완료
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), 'yyyy.MM.dd HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HistoryView;