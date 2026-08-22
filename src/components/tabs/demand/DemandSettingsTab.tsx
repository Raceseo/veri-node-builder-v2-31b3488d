/**
 * 🔴 **더미 화면. 실데이터 미연결 (B-90).**
 *    2026-08-22 진입점 차단 — 홈 헤더 「기업 공급자 전환 →」 버튼을 제거했다.
 *    Index.tsx 가 SupplierLayout 에 onSwitchToDemand 를 넘기지 않는다.
 *
 * 수요자 화면 7파일(1,805줄) 전부 `supabase.` 호출 0건이다.
 * 화면에 보이는 금액·등급·상품·구매내역·리포트가 모두 상수다.
 * 🔴 되살리기 전 목업 제거 필수 — 첫 의뢰 기업이 자기 것이 아닌 숫자를 보게 된다.
 */
import { 
  Building2, 
  CreditCard, 
  Bell, 
  FileText, 
  Users, 
  Shield,
  ChevronRight,
  LogOut,
  HelpCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface DemandSettingsTabProps {
  companyName?: string;
  onOpenPreferences?: () => void;
  onOpenPaymentSettings?: () => void;
  onOpenTeamManagement?: () => void;
  onLogout?: () => void;
}

const DemandSettingsTab = ({
  companyName = "ABC Corporation",
  onOpenPreferences,
  onOpenPaymentSettings,
  onOpenTeamManagement,
  onLogout,
}: DemandSettingsTabProps) => {
  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Company Profile */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{companyName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-0">인증 기업</Badge>
              <Badge variant="outline">프리미엄</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm">수정</Button>
        </div>
      </Card>

      {/* Data Preferences */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">데이터 수집 설정</h3>
        
        <div 
          className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 -mx-4 px-4 transition-colors"
          onClick={onOpenPreferences}
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">선호 데이터 설정</p>
              <p className="text-xs text-muted-foreground">카테고리, 등급, 예산 설정</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        <Separator />

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">자동 알림</p>
              <p className="text-xs text-muted-foreground">새 데이터 상품 알림</p>
            </div>
          </div>
          <Switch defaultChecked />
        </div>

        <Separator />

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">자동 리포트</p>
              <p className="text-xs text-muted-foreground">구매 완료 시 자동 생성</p>
            </div>
          </div>
          <Switch defaultChecked />
        </div>
      </Card>

      {/* Payment & Billing */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">결제 및 정산</h3>
        
        <div 
          className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 -mx-4 px-4 transition-colors"
          onClick={onOpenPaymentSettings}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">결제 수단 관리</p>
              <p className="text-xs text-muted-foreground">카드, 계좌이체 설정</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        <Separator />

        <div 
          className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 -mx-4 px-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">청구서 및 세금계산서</p>
              <p className="text-xs text-muted-foreground">발행 내역 조회</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </Card>

      {/* Team Management */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">팀 관리</h3>
        
        <div 
          className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 -mx-4 px-4 transition-colors"
          onClick={onOpenTeamManagement}
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">팀원 관리</p>
              <p className="text-xs text-muted-foreground">권한 설정 및 초대</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">3명</Badge>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </Card>

      {/* Support */}
      <Card className="p-4">
        <div 
          className="flex items-center justify-between py-2 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">고객 지원</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </Card>

      {/* Logout */}
      <Button 
        variant="outline" 
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onLogout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        로그아웃
      </Button>
    </div>
  );
};

export default DemandSettingsTab;
