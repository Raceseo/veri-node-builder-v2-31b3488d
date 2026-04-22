import { useState, useEffect } from "react";
import { ArrowLeft, Users, MapPin, TrendingUp, Clock, RefreshCw, Radio, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface PollMonitorDashboardProps {
  onBack: () => void;
}

interface RegionData {
  name: string;
  responses: number;
  target: number;
  supportA: number;
  supportB: number;
  supportC: number;
}

const PollMonitorDashboard = ({ onBack }: PollMonitorDashboardProps) => {
  const [isLive, setIsLive] = useState(true);
  const [totalResponses, setTotalResponses] = useState(2847);
  const [targetResponses] = useState(5000);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 실시간 응답 시뮬레이션
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setTotalResponses(prev => prev + Math.floor(Math.random() * 5) + 1);
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive]);

  const responseRate = Math.round((totalResponses / targetResponses) * 100);

  // 시간대별 응답 추이 데이터
  const timeSeriesData = [
    { time: "09:00", responses: 120, cumulative: 120 },
    { time: "10:00", responses: 280, cumulative: 400 },
    { time: "11:00", responses: 350, cumulative: 750 },
    { time: "12:00", responses: 180, cumulative: 930 },
    { time: "13:00", responses: 420, cumulative: 1350 },
    { time: "14:00", responses: 380, cumulative: 1730 },
    { time: "15:00", responses: 450, cumulative: 2180 },
    { time: "16:00", responses: 320, cumulative: 2500 },
    { time: "17:00", responses: 347, cumulative: 2847 },
  ];

  // 지역별 데이터
  const regionData: RegionData[] = [
    { name: "서울", responses: 892, target: 1500, supportA: 42, supportB: 35, supportC: 23 },
    { name: "경기", responses: 654, target: 1200, supportA: 38, supportB: 40, supportC: 22 },
    { name: "인천", responses: 287, target: 400, supportA: 45, supportB: 32, supportC: 23 },
    { name: "부산", responses: 345, target: 500, supportA: 35, supportB: 42, supportC: 23 },
    { name: "대구", responses: 189, target: 300, supportA: 40, supportB: 38, supportC: 22 },
    { name: "광주", responses: 156, target: 250, supportA: 48, supportB: 30, supportC: 22 },
    { name: "대전", responses: 134, target: 200, supportA: 36, supportB: 41, supportC: 23 },
    { name: "기타", responses: 190, target: 650, supportA: 39, supportB: 37, supportC: 24 },
  ];

  // 전체 지지율 파이 차트 데이터
  const supportData = [
    { name: "후보 A", value: 40.2, color: "hsl(217, 91%, 60%)" },
    { name: "후보 B", value: 37.5, color: "hsl(168, 76%, 36%)" },
    { name: "후보 C", value: 22.3, color: "hsl(220, 9%, 46%)" },
  ];

  // 연령대별 지지율
  const ageGroupData = [
    { age: "20대", candidateA: 52, candidateB: 28, candidateC: 20 },
    { age: "30대", candidateA: 45, candidateB: 35, candidateC: 20 },
    { age: "40대", candidateA: 38, candidateB: 42, candidateC: 20 },
    { age: "50대", candidateA: 32, candidateB: 45, candidateC: 23 },
    { age: "60+", candidateA: 28, candidateB: 48, candidateC: 24 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 hover:bg-secondary rounded-full">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-foreground">여론조사 모니터링</h1>
                <p className="text-xs text-muted-foreground">2024 대선 지지율 조사</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isLive ? "default" : "secondary"}
                className={cn(
                  "gap-1",
                  isLive && "bg-destructive text-destructive-foreground"
                )}
              >
                <Radio className="w-3 h-3" />
                {isLive ? "LIVE" : "일시정지"}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsLive(!isLive)}
              >
                <RefreshCw className={cn("w-4 h-4", isLive && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 pb-24 space-y-4">
        {/* 응답률 요약 */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-trust" />
                <span className="font-semibold text-foreground">총 응답 현황</span>
              </div>
              <span className="text-xs text-muted-foreground">
                <Clock className="w-3 h-3 inline mr-1" />
                {lastUpdate.toLocaleTimeString('ko-KR')}
              </span>
            </div>
            
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-foreground font-stat">
                {totalResponses.toLocaleString()}
              </span>
              <span className="text-muted-foreground mb-1">/ {targetResponses.toLocaleString()}</span>
            </div>
            
            <Progress value={responseRate} className="h-3 mb-2" />
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">응답률 {responseRate}%</span>
              <span className={cn(
                "font-medium",
                responseRate >= 80 ? "text-success" : responseRate >= 50 ? "text-trust" : "text-warning"
              )}>
                {targetResponses - totalResponses}명 추가 필요
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 실시간 지지율 */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-trust" />
              실시간 지지율
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supportData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {supportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, '']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-2">
              {supportData.map((candidate) => (
                <div 
                  key={candidate.name}
                  className="text-center p-2 rounded-lg bg-secondary/50"
                >
                  <div 
                    className="w-3 h-3 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: candidate.color }}
                  />
                  <p className="text-xs text-muted-foreground">{candidate.name}</p>
                  <p className="text-lg font-bold text-foreground">{candidate.value}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 시간대별 응답 추이 */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              시간대별 응답 추이
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="responses"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorResponses)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 연령대별 지지율 */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-trust-teal" />
              연령대별 지지율
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageGroupData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    domain={[0, 100]}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="age" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, '']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px' }}
                  />
                  <Bar dataKey="candidateA" name="후보 A" stackId="a" fill="hsl(217, 91%, 60%)" />
                  <Bar dataKey="candidateB" name="후보 B" stackId="a" fill="hsl(168, 76%, 36%)" />
                  <Bar dataKey="candidateC" name="후보 C" stackId="a" fill="hsl(220, 9%, 46%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 지역별 현황 */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-warning" />
              지역별 응답 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {regionData.map((region) => {
              const regionRate = Math.round((region.responses / region.target) * 100);
              return (
                <div key={region.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{region.name}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">
                        {region.responses}/{region.target}
                      </span>
                      <span className={cn(
                        "font-medium",
                        regionRate >= 80 ? "text-success" : regionRate >= 50 ? "text-trust" : "text-warning"
                      )}>
                        {regionRate}%
                      </span>
                    </div>
                  </div>
                  <Progress value={regionRate} className="h-2" />
                  <div className="flex gap-1">
                    <div 
                      className="h-1 rounded-full bg-trust"
                      style={{ width: `${region.supportA}%` }}
                    />
                    <div 
                      className="h-1 rounded-full bg-trust-teal"
                      style={{ width: `${region.supportB}%` }}
                    />
                    <div 
                      className="h-1 rounded-full bg-muted-foreground"
                      style={{ width: `${region.supportC}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 통계 요약 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">평균 응답 시간</p>
              <p className="text-2xl font-bold text-foreground">3.2분</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">완료율</p>
              <p className="text-2xl font-bold text-success">94.7%</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">신뢰도</p>
              <p className="text-2xl font-bold text-trust">±2.5%</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">중복 제거</p>
              <p className="text-2xl font-bold text-warning">23건</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PollMonitorDashboard;
