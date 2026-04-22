import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Building2, Heart, Home, GraduationCap, Shield, Award,
  Check, Loader2, Lock, AlertCircle, Calendar
} from 'lucide-react';

interface Agency {
  code: string;
  name: string;
  type: string;
  icon: string;
}

interface Agencies {
  tax: Agency[];
  health: Agency[];
  housing: Agency[];
  education: Agency[];
  military: Agency[];
  certification: Agency[];
}

interface Connection {
  id: string;
  agency_code: string;
  agency_name: string;
  agency_type: string;
  is_connected: boolean;
  connected_at: string;
  consent_expires_at: string;
}

interface GovDataConnectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionSuccess?: () => void;
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  tax: <Building2 className="w-4 h-4" />,
  health: <Heart className="w-4 h-4" />,
  housing: <Home className="w-4 h-4" />,
  education: <GraduationCap className="w-4 h-4" />,
  military: <Shield className="w-4 h-4" />,
  certification: <Award className="w-4 h-4" />,
};

const TAB_LABELS: Record<string, string> = {
  tax: '세금',
  health: '건강',
  housing: '주거',
  education: '학력',
  military: '병역',
  certification: '자격증',
};

export default function GovDataConnectionSheet({ 
  open, 
  onOpenChange,
  onConnectionSuccess 
}: GovDataConnectionSheetProps) {
  const [agencies, setAgencies] = useState<Agencies | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tax');

  useEffect(() => {
    if (open) {
      loadAgencies();
      loadConnections();
    }
  }, [open]);

  const loadAgencies = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gov-data-sync', {
        body: { action: 'get_agencies' }
      });
      if (error) throw error;
      setAgencies(data.agencies);
    } catch (error: any) {
      console.error('기관 목록 로드 실패:', error);
      toast.error('기관 목록을 불러오는데 실패했습니다');
    }
  };

  const loadConnections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gov-data-sync', {
        body: { action: 'get_connections' }
      });
      if (error) throw error;
      setConnections(data.connections || []);
    } catch (error: any) {
      console.error('연결 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (agency: Agency) => {
    setConnecting(agency.code);
    try {
      const { data, error } = await supabase.functions.invoke('gov-data-sync', {
        body: { 
          action: 'connect',
          agency_code: agency.code,
          agency_type: agency.type,
          agency_name: agency.name,
        }
      });
      
      if (error) throw error;

      const bonus = data.trust_score_bonus;
      const bonusMessage = bonus 
        ? `Trust Score +${bonus.score}점, ${bonus.vnReward} VN 획득!`
        : `${data.records_count}개의 데이터를 가져왔습니다.`;

      toast.success(`${agency.name} 연동 완료! 🎉`, {
        description: bonusMessage
      });
      
      await loadConnections();
      onConnectionSuccess?.();
    } catch (error: any) {
      console.error('연동 실패:', error);
      toast.error('연동에 실패했습니다', {
        description: error.message
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (agencyCode: string, agencyName: string) => {
    try {
      const { error } = await supabase.functions.invoke('gov-data-sync', {
        body: { action: 'disconnect', agency_code: agencyCode }
      });
      
      if (error) throw error;
      
      toast.success(`${agencyName} 연동 해제 완료`);
      await loadConnections();
    } catch (error: any) {
      toast.error('연동 해제 실패');
    }
  };

  const isConnected = (agencyCode: string) => {
    return connections.some(c => c.agency_code === agencyCode);
  };

  const getConnection = (agencyCode: string) => {
    return connections.find(c => c.agency_code === agencyCode);
  };

  const renderAgencyCard = (agency: Agency) => {
    const connected = isConnected(agency.code);
    const connection = getConnection(agency.code);
    const isConnecting = connecting === agency.code;

    return (
      <motion.div
        key={agency.code}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Card className={`p-4 transition-all ${connected ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{agency.icon}</div>
              <div>
                <h4 className="font-medium text-sm">{agency.name}</h4>
                {connected && connection && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    동의 만료: {new Date(connection.consent_expires_at).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </div>
            </div>
            
            {connected ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Check className="w-3 h-3 mr-1" />
                  연동됨
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDisconnect(agency.code, agency.name)}
                >
                  해제
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => handleConnect(agency)}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    연동 중
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-1" />
                    연동하기
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  const connectedCount = connections.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            정부 마이데이터 연동
          </SheetTitle>
          <SheetDescription>
            정부 기관의 공식 데이터를 연동하여 신뢰도를 높이고 데이터 가치를 극대화하세요
          </SheetDescription>
        </SheetHeader>

        {/* 보안 안내 */}
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>데모 모드:</strong> 실제 정부 API 연동은 민간 마이데이터 사업자 등록이 필요합니다.
            현재는 시뮬레이션 데이터로 기능을 체험하실 수 있습니다.
          </p>
        </div>

        {/* 연동 현황 */}
        {connectedCount > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">연동된 기관 ({connectedCount}개)</p>
            <div className="flex flex-wrap gap-2">
              {connections.map(conn => (
                <Badge key={conn.id} variant="secondary" className="gap-1">
                  {TAB_ICONS[conn.agency_type]}
                  {conn.agency_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-6 mb-4">
              {Object.keys(TAB_LABELS).map(key => (
                <TabsTrigger key={key} value={key} className="flex flex-col gap-1 py-2 px-1">
                  {TAB_ICONS[key]}
                  <span className="text-xs">{TAB_LABELS[key]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <AnimatePresence mode="wait">
              {agencies && Object.keys(TAB_LABELS).map(key => (
                <TabsContent key={key} value={key} className="space-y-3 mt-0">
                  {agencies[key as keyof Agencies]?.map(agency => renderAgencyCard(agency))}
                </TabsContent>
              ))}
            </AnimatePresence>
          </Tabs>
        )}

        {/* 안내 문구 */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            더 많은 기관을 연동할수록 데이터 가치가 높아집니다
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{connectedCount}</p>
              <p className="text-xs text-muted-foreground">연동 기관</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">+{connectedCount * 50}</p>
              <p className="text-xs text-muted-foreground">추가 VN</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}