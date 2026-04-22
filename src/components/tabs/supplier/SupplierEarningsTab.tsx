import { useState } from "react";
import { 
  TrendingUp, ChevronRight, Building2, Calendar,
  BarChart3, PieChart, ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import RollingNumber from "@/components/animations/RollingNumber";
import PartnerMarketplace from "@/components/marketplace/PartnerMarketplace";

interface SupplierEarningsTabProps {
  onOpenPartnerRevenue?: () => void;
  onOpenRevenueSource?: (earning: { id: number; title: string; amount: number; date: string }) => void;
}

const monthlyEarnings = [
  { month: "1월", amount: 45000 },
  { month: "2월", amount: 52000 },
  { month: "3월", amount: 48000 },
  { month: "4월", amount: 61000 },
  { month: "5월", amount: 58000 },
  { month: "6월", amount: 72000 },
];

const topBuyers = [
  { name: "삼성카드", category: "금융", earnings: 125000, percentage: 35 },
  { name: "롯데마트", category: "유통", earnings: 89000, percentage: 25 },
  { name: "신한은행", category: "금융", earnings: 72000, percentage: 20 },
  { name: "삼성생명", category: "보험", earnings: 54000, percentage: 15 },
  { name: "기타", category: "-", earnings: 18000, percentage: 5 },
];

const SupplierEarningsTab = ({
  onOpenPartnerRevenue,
  onOpenRevenueSource,
}: SupplierEarningsTabProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const totalEarnings = monthlyEarnings.reduce((sum, m) => sum + m.amount, 0);
  const thisMonthEarnings = monthlyEarnings[monthlyEarnings.length - 1].amount;
  const lastMonthEarnings = monthlyEarnings[monthlyEarnings.length - 2].amount;
  const growthRate = ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent">
          <p className="text-xs text-muted-foreground mb-1">이번 달 수익</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">
              <RollingNumber value={thisMonthEarnings} />
            </span>
            <span className="text-xs text-muted-foreground">원</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-emerald-600">+{growthRate}%</span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">누적 수익</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">
              {formatCurrency(totalEarnings)}
            </span>
            <span className="text-xs text-muted-foreground">원</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">6개월 기준</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="partners">파트너</TabsTrigger>
          <TabsTrigger value="marketplace">마켓</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Monthly Chart (simplified) */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">월별 수익 추이</h3>
              <Badge variant="secondary" className="text-xs">최근 6개월</Badge>
            </div>
            
            <div className="flex items-end justify-between gap-2 h-24">
              {monthlyEarnings.map((item, index) => {
                const maxAmount = Math.max(...monthlyEarnings.map(m => m.amount));
                const height = (item.amount / maxAmount) * 100;
                const isLast = index === monthlyEarnings.length - 1;
                
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className={`w-full rounded-t-md ${
                        isLast ? "bg-primary" : "bg-primary/30"
                      }`}
                    />
                    <span className="text-[10px] text-muted-foreground">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Buyers */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">주요 구매 기업</h3>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onOpenPartnerRevenue}>
                상세 보기 <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {topBuyers.slice(0, 3).map((buyer, index) => (
                <div key={buyer.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{buyer.name}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(buyer.earnings)}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{buyer.category}</span>
                      <span className="text-xs text-primary">{buyer.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="mt-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">전체 파트너 현황</h3>
            <div className="space-y-3">
              {topBuyers.map((buyer, index) => (
                <motion.div
                  key={buyer.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{buyer.name}</span>
                      <span className="text-sm font-semibold text-emerald-600">
                        +{formatCurrency(buyer.earnings)}원
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${buyer.percentage}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="mt-4">
          <PartnerMarketplace />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplierEarningsTab;
