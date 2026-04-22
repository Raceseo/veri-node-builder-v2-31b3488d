import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  Loader2, 
  Shield,
  Link2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Institution {
  code: string;
  name: string;
  type: string;
}

interface Institutions {
  banks: Institution[];
  cards: Institution[];
}

interface Connection {
  id: string;
  institution_code: string;
  institution_name: string;
  institution_type: string;
  is_connected: boolean;
  connected_at: string;
  sync_status: string;
}

interface MydataConnectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionSuccess: () => void;
}

export function MydataConnectionSheet({ 
  open, 
  onOpenChange,
  onConnectionSuccess 
}: MydataConnectionSheetProps) {
  const [institutions, setInstitutions] = useState<Institutions | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('bank');

  useEffect(() => {
    if (open) {
      loadInstitutions();
      loadConnections();
    }
  }, [open]);

  const loadInstitutions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('mydata-sync', {
        body: { action: 'get_institutions' }
      });

      if (error) throw error;
      setInstitutions(data.institutions);
    } catch (error) {
      console.error('Error loading institutions:', error);
    }
  };

  const loadConnections = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('mydata-sync', {
        body: { action: 'get_connections' }
      });

      if (error) throw error;
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const handleConnect = async (institution: Institution) => {
    try {
      setConnecting(institution.code);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('로그인이 필요합니다');
        return;
      }

      // 이미 연결된 기관인지 확인
      if (connections.some(c => c.institution_code === institution.code)) {
        toast.info('이미 연결된 기관입니다');
        return;
      }

      const { data, error } = await supabase.functions.invoke('mydata-sync', {
        body: { 
          action: 'connect',
          institutionCode: institution.code,
          institutionType: institution.type
        }
      });

      if (error) throw error;

      toast.success(`${institution.name} 연결 완료!`, {
        description: `${data.transactionCount}건의 거래 내역을 불러왔습니다.`
      });

      await loadConnections();
      onConnectionSuccess();
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('연결에 실패했습니다');
    } finally {
      setConnecting(null);
    }
  };

  const isConnected = (code: string) => {
    return connections.some(c => c.institution_code === code && c.is_connected);
  };

  const renderInstitutionCard = (institution: Institution) => {
    const connected = isConnected(institution.code);
    const isConnecting = connecting === institution.code;

    return (
      <motion.div
        key={institution.code}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative p-4 rounded-xl border transition-all duration-200
          ${connected 
            ? 'bg-primary/5 border-primary/30' 
            : 'bg-card hover:bg-muted/50 border-border hover:border-primary/30'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${connected ? 'bg-primary/10' : 'bg-muted'}
            `}>
              {institution.type === 'bank' ? (
                <Building2 className={`w-5 h-5 ${connected ? 'text-primary' : 'text-muted-foreground'}`} />
              ) : (
                <CreditCard className={`w-5 h-5 ${connected ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{institution.name}</p>
              {connected && (
                <p className="text-xs text-muted-foreground">연결됨</p>
              )}
            </div>
          </div>
          
          {connected ? (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              연결 완료
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleConnect(institution)}
              disabled={isConnecting}
              className="h-8"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Link2 className="w-3 h-3 mr-1" />
                  연결
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            마이데이터 연결
          </SheetTitle>
          <SheetDescription>
            금융기관을 연결하여 소비 분석 데이터의 가치를 높이세요
          </SheetDescription>
        </SheetHeader>

        {/* 보안 안내 */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 mb-6">
          <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">데모 모드 안내</p>
            <p className="text-muted-foreground text-xs mt-1">
              현재 시뮬레이션 데이터로 마이데이터 연동 플로우를 체험합니다.
              실제 금융정보는 연동되지 않습니다.
            </p>
          </div>
        </div>

        {/* 연결 현황 */}
        {connections.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-3 text-muted-foreground">
              연결된 기관 ({connections.length}개)
            </p>
            <div className="flex flex-wrap gap-2">
              {connections.map((conn) => (
                <Badge key={conn.id} variant="secondary" className="gap-1">
                  {conn.institution_type === 'bank' ? (
                    <Building2 className="w-3 h-3" />
                  ) : (
                    <CreditCard className="w-3 h-3" />
                  )}
                  {conn.institution_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 기관 선택 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="bank" className="gap-2">
              <Building2 className="w-4 h-4" />
              은행
            </TabsTrigger>
            <TabsTrigger value="card" className="gap-2">
              <CreditCard className="w-4 h-4" />
              카드
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="space-y-3 mt-0">
            {institutions?.banks.map(renderInstitutionCard)}
          </TabsContent>

          <TabsContent value="card" className="space-y-3 mt-0">
            {institutions?.cards.map(renderInstitutionCard)}
          </TabsContent>
        </Tabs>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-600">더 많은 기관을 연결하면</p>
              <p className="text-muted-foreground text-xs mt-1">
                소비 패턴 분석이 더 정확해지고, 데이터 가치가 최대 3배까지 상승합니다.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
