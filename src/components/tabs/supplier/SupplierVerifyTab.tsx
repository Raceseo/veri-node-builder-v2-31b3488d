import { Shield, Fingerprint, FileCheck, Brain, ChevronRight, CheckCircle2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface SupplierVerifyTabProps {
  trustScore: number;
  isVerified: boolean;
  onStartVerification?: () => void;
  onOpenVCoreAnonymization?: () => void;
}

const verificationMethods = [
  {
    id: "ai-survey",
    name: "AI 스마트 설문",
    description: "AI가 분석하는 맞춤형 질문에 답변",
    icon: Brain,
    reward: "+15점",
    color: "text-primary",
    bgColor: "bg-primary/10",
    available: true,
  },
  {
    id: "identity",
    name: "본인 인증",
    description: "지문, 안면인식, 또는 간편인증",
    icon: Fingerprint,
    reward: "+20점",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    available: true,
  },
  {
    id: "document",
    name: "서류 인증",
    description: "주민등록증, 운전면허증 등",
    icon: FileCheck,
    reward: "+25점",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    available: true,
  },
  {
    id: "premium",
    name: "프리미엄 인증",
    description: "금융/공공기관 연동 인증",
    icon: Shield,
    reward: "+40점",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    available: false,
  },
];

const SupplierVerifyTab = ({
  trustScore,
  isVerified,
  onStartVerification,
  onOpenVCoreAnonymization,
}: SupplierVerifyTabProps) => {
  const getNextGrade = () => {
    if (trustScore >= 90) return null;
    if (trustScore >= 80) return { target: 90, grade: "S", points: 90 - trustScore };
    if (trustScore >= 70) return { target: 80, grade: "A", points: 80 - trustScore };
    if (trustScore >= 60) return { target: 70, grade: "B", points: 70 - trustScore };
    return { target: 60, grade: "C", points: 60 - trustScore };
  };

  const nextGrade = getNextGrade();

  return (
    <div className="p-4 space-y-4">
      {/* Current Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">신뢰 인증</h2>
            <p className="text-sm text-muted-foreground">인증을 통해 데이터 가치를 높이세요</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{trustScore}</p>
            <p className="text-xs text-muted-foreground">현재 점수</p>
          </div>
        </div>

        {nextGrade && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{nextGrade.grade}등급까지</span>
              <span className="text-primary font-medium">{nextGrade.points}점 필요</span>
            </div>
            <Progress value={(trustScore / nextGrade.target) * 100} className="h-2" />
          </div>
        )}
      </Card>

      {/* V-Core Section */}
      <Card className="p-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">V-Core 익명화 엔진</h3>
            <p className="text-xs text-muted-foreground">군사급 데이터 보호 시스템</p>
          </div>
        </div>
        
        <Button 
          onClick={onOpenVCoreAnonymization}
          variant="outline" 
          className="w-full justify-between mt-2"
        >
          익명화 설정 관리
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Card>

      {/* Verification Methods */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground px-1">인증 방법</h3>
        
        {verificationMethods.map((method, index) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`p-4 cursor-pointer transition-all ${
                method.available 
                  ? "hover:border-primary/50" 
                  : "opacity-60"
              }`}
              onClick={() => method.available && method.id === "ai-survey" && onStartVerification?.()}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${method.bgColor} flex items-center justify-center`}>
                  <method.icon className={`w-5 h-5 ${method.color}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{method.name}</span>
                    {!method.available && (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                </div>
                
                <Badge variant="secondary" className={`${method.bgColor} ${method.color} border-0`}>
                  {method.reward}
                </Badge>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Verification Status */}
      {isVerified && (
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-foreground">기본 인증 완료</p>
              <p className="text-xs text-muted-foreground">추가 인증으로 더 높은 등급을 획득하세요</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SupplierVerifyTab;
