import { useState } from "react";
import { 
  Menu, X, ChevronRight, Database, Activity, Shield, 
  TrendingUp, BarChart3, HelpCircle, Bell, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface QuickMenuProps {
  displayName: string;
  trustScore: number;
  vnBalance: number;
  onOpenMyDataUpload?: () => void;
  onOpenCategoryMonitor?: () => void;
  onOpenVCoreAnonymization?: () => void;
  onOpenConsumptionReport?: () => void;
}

const QuickMenu = ({
  displayName,
  trustScore,
  vnBalance,
  onOpenMyDataUpload,
  onOpenCategoryMonitor,
  onOpenVCoreAnonymization,
  onOpenConsumptionReport,
}: QuickMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const menuItems = [
    { 
      label: "내 데이터 자산", 
      icon: Database, 
      action: onOpenMyDataUpload,
      description: "연결된 데이터 소스 관리"
    },
    { 
      label: "추가 연결", 
      icon: Activity, 
      action: onOpenCategoryMonitor,
      description: "새로운 데이터 소스 연결"
    },
    { 
      label: "가치 분석", 
      icon: TrendingUp, 
      action: onOpenConsumptionReport,
      description: "내 데이터 가치 확인"
    },
  ];

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

        {/* Menu Items */}
        <div className="p-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.action?.();
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <Separator className="my-2" />

        {/* Footer Menu */}
        <div className="p-2">
          <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">알림 설정</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">도움말</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 transition-colors text-left"
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
