import { useState } from "react";
import { 
  ArrowLeft, 
  FileText, 
  BarChart3, 
  Landmark, 
  Building2, 
  Users, 
  TrendingUp,
  Clock,
  ChevronRight,
  Plus,
  Activity,
  Target,
  Shield,
  Sparkles,
  ClipboardList,
  PieChart,
  Zap,
  Eye,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SurveyRequestHubProps {
  onBack: () => void;
  onOpenProjectBuilder: () => void;
  onOpenPoliticalSurvey: () => void;
  onOpenPollMonitor: () => void;
  onOpenDomainTemplates: () => void;
  onOpenSampleMonitor: () => void;
}

interface ActiveProject {
  id: string;
  name: string;
  status: 'collecting' | 'analyzing' | 'completed';
  progress: number;
  targetCount: number;
  currentCount: number;
  createdAt: string;
  category: string;
}

const mockProjects: ActiveProject[] = [
  {
    id: '1',
    name: '2024 MZ세대 소비 트렌드 조사',
    status: 'collecting',
    progress: 68,
    targetCount: 500,
    currentCount: 340,
    createdAt: '2024-01-15',
    category: '소비자'
  },
  {
    id: '2',
    name: '직장인 건강관리 실태 조사',
    status: 'analyzing',
    progress: 100,
    targetCount: 300,
    currentCount: 300,
    createdAt: '2024-01-10',
    category: '건강'
  },
  {
    id: '3',
    name: '총선 후보 지지도 조사',
    status: 'collecting',
    progress: 42,
    targetCount: 1000,
    currentCount: 420,
    createdAt: '2024-01-18',
    category: '정치'
  }
];

const SurveyRequestHub = ({ 
  onBack, 
  onOpenProjectBuilder, 
  onOpenPoliticalSurvey, 
  onOpenPollMonitor,
  onOpenDomainTemplates,
  onOpenSampleMonitor
}: SurveyRequestHubProps) => {
  const [activeProjects] = useState<ActiveProject[]>(mockProjects);

  const getStatusBadge = (status: ActiveProject['status']) => {
    switch (status) {
      case 'collecting':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs flex items-center gap-1">
            <Activity className="w-3 h-3 animate-pulse" />
            수집중
          </Badge>
        );
      case 'analyzing':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            분석중
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            완료
          </Badge>
        );
    }
  };

  const quickActions = [
    {
      id: 'new-survey',
      title: '새 설문조사',
      description: '새로운 설문조사 프로젝트를 시작하세요',
      icon: Plus,
      color: 'from-blue-500 to-indigo-600',
      onClick: onOpenDomainTemplates
    },
    {
      id: 'political',
      title: '정치 여론조사',
      description: '주소지 인증 기반 정밀 여론조사',
      icon: Landmark,
      color: 'from-indigo-500 to-purple-600',
      badge: 'HOT',
      onClick: onOpenPoliticalSurvey
    },
    {
      id: 'corporate',
      title: '기업용 리서치',
      description: 'API 인증 기반 고품질 데이터 수집',
      icon: Building2,
      color: 'from-teal-500 to-cyan-600',
      onClick: onOpenProjectBuilder
    },
    {
      id: 'monitor',
      title: '샘플 모니터링',
      description: '실시간 응답 수집 현황 확인',
      icon: BarChart3,
      color: 'from-emerald-500 to-green-600',
      badge: 'LIVE',
      onClick: onOpenSampleMonitor
    }
  ];

  const stats = [
    { label: '진행중 프로젝트', value: 3, icon: ClipboardList },
    { label: '총 응답자', value: '1,060', icon: Users },
    { label: '완료된 조사', value: 12, icon: CheckCircle2 },
    { label: '평균 응답률', value: '78%', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-slate-900/95 backdrop-blur border-b border-white/10">
        <button onClick={onBack} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">설문조사 의뢰 센터</h1>
          <p className="text-xs text-blue-300/70">Survey Request Hub</p>
        </div>
        <Button 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
          onClick={onOpenDomainTemplates}
        >
          <Plus className="w-4 h-4 mr-1" />
          새 의뢰
        </Button>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Stats Overview */}
        <section className="grid grid-cols-4 gap-2">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10 text-center"
              >
                <Icon className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-white/50 leading-tight">{stat.label}</p>
              </div>
            );
          })}
        </section>

        {/* Quick Actions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              빠른 시작
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="relative p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-left group"
                >
                  {action.badge && (
                    <span className={cn(
                      "absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded",
                      action.badge === 'LIVE' ? "bg-red-500/30 text-red-300 animate-pulse" : "bg-amber-500/30 text-amber-300"
                    )}>
                      {action.badge}
                    </span>
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3",
                    action.color
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{action.title}</h3>
                  <p className="text-xs text-white/50 line-clamp-2">{action.description}</p>
                  <ChevronRight className="absolute bottom-4 right-3 w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Real-time Poll Monitor Banner */}
        <button
          onClick={onOpenPollMonitor}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-400/30 flex items-center gap-4 hover:from-emerald-600/30 hover:to-teal-600/30 transition-all group"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/40 to-teal-500/40 flex items-center justify-center">
            <PieChart className="w-7 h-7 text-emerald-200" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-white">실시간 여론조사 대시보드</p>
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500/30 text-red-200 rounded animate-pulse">LIVE</span>
            </div>
            <p className="text-sm text-emerald-200/70">응답률, 지역별 분포, 지지율 실시간 모니터링</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/50 transition-colors">
            <ChevronRight className="w-5 h-5 text-emerald-200" />
          </div>
        </button>

        {/* Active Projects */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              진행중인 프로젝트
            </h2>
            <button className="text-xs text-blue-400 hover:text-blue-300">전체보기</button>
          </div>
          <div className="space-y-3">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-blue-500/20 text-blue-300 border-0 text-[10px]">
                        {project.category}
                      </Badge>
                      {getStatusBadge(project.status)}
                    </div>
                    <h3 className="font-semibold text-white text-sm">{project.name}</h3>
                  </div>
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <Eye className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-white/60">수집 진행률</span>
                    <span className="text-white font-medium">
                      {project.currentCount.toLocaleString()} / {project.targetCount.toLocaleString()}명
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        project.status === 'completed' 
                          ? "bg-blue-500" 
                          : "bg-gradient-to-r from-emerald-500 to-teal-500"
                      )}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-white/40">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{project.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>{project.progress}% 완료</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Templates Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              추천 템플릿
            </h2>
            <button 
              onClick={onOpenDomainTemplates}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              전체보기
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {[
              { name: '정치 여론조사', icon: Landmark, color: 'from-indigo-500 to-purple-500' },
              { name: '시장 분석', icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
              { name: '사회 이슈 조사', icon: Users, color: 'from-teal-500 to-cyan-500' },
              { name: '소비자 트렌드', icon: Target, color: 'from-pink-500 to-rose-500' }
            ].map((template, index) => {
              const Icon = template.icon;
              return (
                <button
                  key={index}
                  onClick={onOpenDomainTemplates}
                  className="flex-shrink-0 w-32 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-center"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mx-auto mb-2",
                    template.color
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-white">{template.name}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Data Quality Banner */}
        <section className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-white">VeriNode 품질 보증</h3>
              <p className="text-xs text-blue-200/70">API 인증 기반 고품질 데이터</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '데이터 신뢰도', value: '97%' },
              { label: '중복 응답 차단', value: '100%' },
              { label: '평균 완료율', value: '92%' }
            ].map((item, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-white">{item.value}</p>
                <p className="text-[10px] text-white/50">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SurveyRequestHub;
