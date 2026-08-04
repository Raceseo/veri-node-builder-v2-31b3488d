import { TrendingUp, Trophy, Target, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DigitalBadgeCard from "@/components/DigitalBadgeCard";

const DashboardTab = () => {
  // Mock data for demonstration
  const userName = "김베리";
  const tier = "Diamond" as const;

  const historyData = [
    { date: "12/14", score: 75 },
    { date: "12/15", score: 82 },
    { date: "12/16", score: 78 },
    { date: "12/17", score: 85 },
    { date: "12/18", score: 88 },
    { date: "12/19", score: 92 },
    { date: "12/20", score: 90 },
  ];

  const distributionData = [
    { name: "일관성", value: 35, color: "hsl(239 84% 67%)" },
    { name: "성실성", value: 35, color: "hsl(187 85% 53%)" },
    { name: "함정이행", value: 30, color: "hsl(152 69% 41%)" },
  ];

  const stats = [
    { label: "총 검증 횟수", value: "12", icon: Target, color: "text-primary" },
    { label: "평균 신뢰 점수", value: "85", icon: TrendingUp, color: "text-accent" },
    { label: "고신뢰 달성", value: "8회", icon: Trophy, color: "text-success" },
    { label: "평균 응답 시간", value: "4.2분", icon: Clock, color: "text-cyber" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          신뢰도 <span className="text-gradient">대시보드</span>
        </h2>
        <p className="text-muted-foreground">
          당신의 검증 기록과 통계를 확인하세요
        </p>
      </div>

      {/* Digital Badge Card */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">나의 인증 배지</h3>
        {/* B-34: percentile prop 삭제에 따른 최소 수정.
            이 파일은 dead(import 0건)라 B-24에서 삭제 예정 — 빌드 유지 목적의 변경만 한다.
            기존 percentile={5} 역시 근거 없는 하드코딩이었다. */}
        <DigitalBadgeCard
          userName={userName}
          tier={tier}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-4 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score History Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            신뢰 점수 추이
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(239 84% 67%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(239 84% 67%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 28% 17%)" />
                <XAxis dataKey="date" stroke="hsl(215 20% 55%)" fontSize={12} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={12} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222 47% 10%)",
                    border: "1px solid hsl(215 28% 17%)",
                    borderRadius: "8px",
                    color: "hsl(210 40% 98%)"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(239 84% 67%)"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            점수 구성 비율
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222 47% 10%)",
                    border: "1px solid hsl(215 28% 17%)",
                    borderRadius: "8px",
                    color: "hsl(210 40% 98%)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {distributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Verifications */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          최근 검증 기록
        </h3>
        <div className="space-y-3">
          {[
            { date: "2024-12-20 14:30", score: 90, verdict: "high_trust" },
            { date: "2024-12-19 10:15", score: 85, verdict: "high_trust" },
            { date: "2024-12-18 16:45", score: 72, verdict: "medium_trust" },
          ].map((record, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{record.date}</p>
                <p className="text-xs text-muted-foreground">
                  {record.verdict === "high_trust" ? "고신뢰" : record.verdict === "medium_trust" ? "보통" : "신뢰불가"}
                </p>
              </div>
              <div className={`text-lg font-bold ${
                record.verdict === "high_trust" ? "text-success" : 
                record.verdict === "medium_trust" ? "text-warning" : "text-destructive"
              }`}>
                {record.score}점
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;