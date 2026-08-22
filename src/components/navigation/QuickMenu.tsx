import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

/**
 * 🔴 2026-08-22 — 마이데이터 메뉴 3개를 제거했다. 되돌리기 전에 읽을 것.
 *
 * 제거한 것: 「내 데이터 자산」 「추가 연결」 「가치 분석」
 * 도착 화면 3개(MyDataUploadView · DataCategoryMonitorView · ConsumptionReportView)가
 * 전부 작동하지 않았고, 그중 둘은 빈 화면이 아니라 **거짓을 표시**했다.
 *   - MyDataUploadView: setTimeout 2초 후 "연결됨" 표시 (DB 기록 없음)
 *     + 금융결제원·금융감독원·한국은행 등 실명 기관 제휴 허위 표시
 *   - DataCategoryMonitorView: 연동 0건인 신규 가입자에게도 "내 자산 850만원"
 *   - ConsumptionReportView: Math.random() 으로 만든 소비 추이 (새로고침마다 변함)
 * 백로그 B-86 ~ B-89.
 *
 * 뷰 파일은 지우지 않았다 — 마이데이터가 실제로 열리면 재사용 가능하다.
 * 🔴 다만 되살릴 때는 각 파일 상단 경고 주석대로 가짜 데이터·실명 기관 표시를
 *    먼저 걷어내야 한다. 메뉴만 되돌리면 허위 표시가 그대로 살아난다.
 *
 * 함께 제거: 「알림 설정」 「도움말」 — onClick 이 없어 눌러도 아무 반응이 없었다.
 * 작동하지 않는 것을 두지 않는다는 같은 기준을 적용했다.
 */
interface QuickMenuProps {
  displayName: string;
  trustScore: number;
  vnBalance: number;
}

const QuickMenu = ({ displayName, trustScore, vnBalance }: QuickMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ko-KR').format(balance);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetTitle className="sr-only">메뉴</SheetTitle>
        
        {/* User Profile Header */}
        <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-b">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {displayName.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{displayName}님</p>
              <p className="text-xs text-muted-foreground">개인 공급자</p>
            </div>
          </div>
          
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">신뢰점수</p>
              <p className="font-semibold text-primary">{trustScore}점</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">VN 잔액</p>
              <p className="font-semibold text-emerald-600">{formatBalance(vnBalance)}</p>
            </div>
          </div>
        </div>

        {/* 메뉴 항목을 전부 걷어내 Separator 와 상단 구획도 함께 지웠다.
            남긴 것은 실제로 동작하는 로그아웃 하나뿐이다.
            위 프로필 머리글(신뢰점수·VN 잔액)은 실값이라 그대로 둔다. */}
        <div className="p-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-destructive/10 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">로그아웃</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default QuickMenu;
