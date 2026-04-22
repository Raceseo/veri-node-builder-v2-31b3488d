import { User, Building, Hash, FileText, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileData } from "@/types/verinode";

interface ProfileSetupStepProps {
  profile: ProfileData;
  setProfile: (profile: ProfileData) => void;
  onNext: () => void;
  isLoading: boolean;
}

const ProfileSetupStep = ({ profile, setProfile, onNext, isLoading }: ProfileSetupStepProps) => {
  const updateField = (field: keyof ProfileData, value: string | string[]) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          프로필 <span className="text-gradient">설정</span>
        </h2>
        <p className="text-muted-foreground">
          AI가 당신의 프로필을 분석하여 맞춤형 검증 질문을 생성합니다
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> 직업 *
          </label>
          <Input
            placeholder="예: 소프트웨어 개발자, 마케터, 대학생"
            value={profile.occupation}
            onChange={(e) => updateField("occupation", e.target.value)}
            className="bg-muted border-border"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" /> 회사/소속
          </label>
          <Input
            placeholder="예: 네이버, 서울대학교"
            value={profile.company}
            onChange={(e) => updateField("company", e.target.value)}
            className="bg-muted border-border"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" /> SNS 관심 키워드
          </label>
          <Input
            placeholder="예: 테크, 여행, 음식 (쉼표로 구분)"
            value={profile.snsKeywords.join(", ")}
            onChange={(e) => updateField("snsKeywords", e.target.value.split(",").map(s => s.trim()))}
            className="bg-muted border-border"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> 자기소개 *
          </label>
          <Textarea
            placeholder="당신에 대해 간단히 소개해주세요 (경력, 관심사, 전문 분야 등)"
            value={profile.introduction}
            onChange={(e) => updateField("introduction", e.target.value)}
            className="bg-muted border-border min-h-[120px]"
          />
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={isLoading || !profile.occupation || !profile.introduction}
        className="w-full bg-gradient-primary hover:opacity-90 h-12 text-base"
      >
        {isLoading ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> AI 질문 생성 중...</>
        ) : (
          <>검증 시작하기 <ArrowRight className="w-5 h-5 ml-2" /></>
        )}
      </Button>
    </div>
  );
};

export default ProfileSetupStep;