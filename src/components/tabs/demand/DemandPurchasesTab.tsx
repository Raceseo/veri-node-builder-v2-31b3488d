/**
 * 🔴 **더미 화면. 실데이터 미연결 (B-90).**
 *    2026-08-22 진입점 차단 — 홈 헤더 「기업 공급자 전환 →」 버튼을 제거했다.
 *    Index.tsx 가 SupplierLayout 에 onSwitchToDemand 를 넘기지 않는다.
 *
 * 수요자 화면 7파일(1,805줄) 전부 `supabase.` 호출 0건이다.
 * 화면에 보이는 금액·등급·상품·구매내역·리포트가 모두 상수다.
 * 🔴 되살리기 전 목업 제거 필수 — 첫 의뢰 기업이 자기 것이 아닌 숫자를 보게 된다.
 * 이 파일의 목업: :12 purchases 상수 배열
 */
import { Package, Clock, CheckCircle2, XCircle, ChevronRight, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface DemandPurchasesTabProps {
  onOpenReport?: (purchaseId: string) => void;
}

const purchases = [
  {
    id: "PO-2024-001",
    title: "2030 소비패턴 데이터",
    status: "completed",
    samples: 1240,
    amount: 150000,
    purchasedAt: "2024-01-15",
    completedAt: "2024-01-16",
  },
  {
    id: "PO-2024-002",
    title: "금융 행동 분석 데이터",
    status: "collecting",
    samples: 450,
    targetSamples: 890,
    amount: 280000,
    purchasedAt: "2024-01-18",
  },
  {
    id: "PO-2024-003",
    title: "건강/웰니스 관심 데이터",
    status: "pending",
    samples: 0,
    targetSamples: 2100,
    amount: 120000,
    purchasedAt: "2024-01-20",
  },
];

const statusConfig = {
  completed: { label: "완료", color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2 },
  collecting: { label: "수집중", color: "bg-primary/10 text-primary", icon: Clock },
  pending: { label: "대기중", color: "bg-muted text-muted-foreground", icon: Package },
  failed: { label: "실패", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

const DemandPurchasesTab = ({ onOpenReport }: DemandPurchasesTabProps) => {
  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">3</p>
          <p className="text-xs text-muted-foreground">총 구매</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-emerald-500">1</p>
          <p className="text-xs text-muted-foreground">완료</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-amber-500">2</p>
          <p className="text-xs text-muted-foreground">진행중</p>
        </Card>
      </div>

      {/* Purchase Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="active">진행중</TabsTrigger>
          <TabsTrigger value="completed">완료</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {purchases.map((purchase, index) => {
            const status = statusConfig[purchase.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            const progress = purchase.targetSamples 
              ? Math.round((purchase.samples / purchase.targetSamples) * 100) 
              : 100;

            return (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => onOpenReport?.(purchase.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{purchase.title}</p>
                      <p className="text-xs text-muted-foreground">{purchase.id}</p>
                    </div>
                    <Badge className={`${status.color} border-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  {purchase.status === "collecting" && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">수집 진행률</span>
                        <span className="text-primary font-medium">{progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {purchase.samples.toLocaleString()} / {purchase.targetSamples?.toLocaleString()}명
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {purchase.purchasedAt}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        ₩{purchase.amount.toLocaleString()}
                      </span>
                      {purchase.status === "completed" && (
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Download className="w-3 h-3 mr-1" />
                          리포트
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="active" className="space-y-3 mt-4">
          {purchases
            .filter(p => p.status === "collecting" || p.status === "pending")
            .map((purchase, index) => {
              const status = statusConfig[purchase.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{purchase.title}</p>
                        <p className="text-xs text-muted-foreground">{purchase.id}</p>
                      </div>
                      <Badge className={`${status.color} border-0`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {purchases
            .filter(p => p.status === "completed")
            .map((purchase, index) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{purchase.title}</p>
                      <p className="text-xs text-muted-foreground">{purchase.id}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3 mr-1" />
                      다운로드
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {purchase.samples.toLocaleString()}명 · ₩{purchase.amount.toLocaleString()}
                  </p>
                </Card>
              </motion.div>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DemandPurchasesTab;
