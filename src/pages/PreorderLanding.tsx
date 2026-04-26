import { FileText, Mail, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { PreorderHero } from "@/components/marketing/PreorderHero";
import { StepCard } from "@/components/marketing/StepCard";

const PreorderLanding = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      <MarketingHeader />

      <PreorderHero
        size="full"
        secondaryCta={
          <Link
            to="/auth"
            className="border-b border-border px-4 py-3.5 text-[15px] font-medium text-foreground hover:text-trust"
          >
            이미 가입하셨나요? 로그인
          </Link>
        }
      />

      {/* 3-step how-it-works */}
      <section className="bg-white px-6 py-12 md:px-12 md:py-16" id="how">
        <div className="grid gap-4 md:grid-cols-3">
          <StepCard
            step={1}
            active
            title="사전 신청서 작성"
            desc="Google Form으로 1분 소요. 관심 주제와 연락처를 남깁니다."
            icon={<FileText className="h-5 w-5" />}
          />
          <StepCard
            step={2}
            title="런칭 시 우선 초대"
            desc="출시 직후 유료 설문을 이메일로 가장 먼저 받아보세요."
            icon={<Mail className="h-5 w-5" />}
          />
          <StepCard
            step={3}
            title="응답 완료 → 5,000원"
            desc="건당 즉시 지급. 공공 마이데이터 인증으로 중복 없이 정산."
            icon={<Coins className="h-5 w-5" />}
          />
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-7 text-[11.5px] text-muted-foreground md:px-12">
        <span>© {new Date().getFullYear()} VeriNode. All rights reserved.</span>
        <span>
          사전 신청은 Google Form으로 수집되며, 런칭 전 서비스 안내 수신에 동의하는 것으로 간주됩니다.
        </span>
      </footer>
    </div>
  );
};

export default PreorderLanding;
