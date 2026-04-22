import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVerification } from "@/hooks/useVerification";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProfileSetupStep from "@/components/verification/ProfileSetupStep";
import QuestionGenerationStep from "@/components/verification/QuestionGenerationStep";
import SmartSurveyStep from "@/components/verification/SmartSurveyStep";
import AnalysisStep from "@/components/verification/AnalysisStep";
import RewardStep from "@/components/verification/RewardStep";
import VerificationProgress from "@/components/verification/VerificationProgress";
import GovDataDashboard from "@/components/govdata/GovDataDashboard";
import TrustScoreHistoryChart from "@/components/charts/TrustScoreHistoryChart";
import { 
  ShieldCheck, Building2, TrendingUp, ClipboardCheck 
} from "lucide-react";

const VerifyTab = () => {
  const [activeTab, setActiveTab] = useState("verification");
  
  const {
    currentStep,
    profile,
    setProfile,
    questions,
    result,
    isLoading,
    generateQuestions,
    generateFollowUpQuestion,
    submitSurvey,
    resetVerification,
  } = useVerification();

  const stepLabels = [
    { key: "profile_setup", label: "프로필 설정" },
    { key: "question_generation", label: "질문 생성" },
    { key: "smart_survey", label: "스마트 설문" },
    { key: "analysis", label: "분석 중" },
    { key: "reward", label: "결과 확인" },
  ];

  const currentStepIndex = stepLabels.findIndex(s => s.key === currentStep);

  return (
    <div className="space-y-6">
      {/* 상단 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-auto p-1">
          <TabsTrigger 
            value="verification" 
            className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <ClipboardCheck className="w-5 h-5" />
            <span className="text-xs">AI 검증</span>
          </TabsTrigger>
          <TabsTrigger 
            value="govdata" 
            className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Building2 className="w-5 h-5" />
            <span className="text-xs">정부 데이터</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Trust 이력</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {/* AI 검증 탭 */}
          <TabsContent value="verification" className="mt-6">
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Progress Indicator */}
              <VerificationProgress
                steps={stepLabels}
                currentIndex={currentStepIndex}
              />

              {/* Step Content */}
              <div className="animate-fade-in">
                {currentStep === "profile_setup" && (
                  <ProfileSetupStep
                    profile={profile}
                    setProfile={setProfile}
                    onNext={generateQuestions}
                    isLoading={isLoading}
                  />
                )}

                {currentStep === "question_generation" && (
                  <QuestionGenerationStep />
                )}

                {currentStep === "smart_survey" && (
                  <SmartSurveyStep
                    questions={questions}
                    onSubmit={submitSurvey}
                    isLoading={isLoading}
                    onRequestFollowUp={generateFollowUpQuestion}
                  />
                )}

                {currentStep === "analysis" && (
                  <AnalysisStep />
                )}

                {currentStep === "reward" && result && (
                  <RewardStep
                    result={result}
                    onReset={resetVerification}
                  />
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* 정부 마이데이터 탭 */}
          <TabsContent value="govdata" className="mt-6">
            <motion.div
              key="govdata"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GovDataDashboard />
            </motion.div>
          </TabsContent>

          {/* Trust Score 이력 탭 */}
          <TabsContent value="history" className="mt-6">
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <TrustScoreHistoryChart />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default VerifyTab;