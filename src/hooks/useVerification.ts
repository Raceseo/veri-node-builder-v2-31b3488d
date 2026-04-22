import { useState, useCallback } from "react";
import type { ProfileData, Question, SurveyResponse, IntegrityResult, VerificationStep } from "@/types/verinode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function useVerification() {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<VerificationStep>("profile_setup");
  const [profile, setProfile] = useState<ProfileData>({
    occupation: "",
    company: "",
    snsKeywords: [],
    introduction: "",
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateQuestions = useCallback(async () => {
    if (!profile.occupation || !profile.introduction) {
      toast({
        title: "프로필 미완성",
        description: "직업과 자기소개는 필수 항목입니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setCurrentStep("question_generation");

    try {
      const { data, error } = await supabase.functions.invoke('verinode-ai', {
        body: { action: 'generate_questions', profile }
      });

      if (error) throw error;

      if (data?.data?.questions) {
        setQuestions(data.data.questions);
        setCurrentStep("smart_survey");
        toast({
          title: "질문 생성 완료",
          description: "AI가 프로필 기반 검증 질문을 생성했습니다.",
        });
      }
    } catch (error) {
      console.error("Question generation error:", error);
      toast({
        title: "오류 발생",
        description: "질문 생성에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      setCurrentStep("profile_setup");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  const generateFollowUpQuestion = useCallback(async (previousAnswer: string, previousQuestion: string): Promise<Question | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('verinode-ai', {
        body: { 
          action: 'generate_detail_trap',
          previousAnswer,
          previousQuestion
        }
      });

      if (error) throw error;

      if (data?.data?.question) {
        return data.data.question as Question;
      }
      return null;
    } catch (error) {
      console.error("Follow-up question generation error:", error);
      return null;
    }
  }, []);

  const submitSurvey = useCallback(async (surveyResponses: SurveyResponse[]) => {
    setIsLoading(true);
    setCurrentStep("analysis");
    setResponses(surveyResponses);

    const trapQuestion = questions.find(q => q.type === "trap");
    const trapResponse = surveyResponses.find(r => r.questionId === trapQuestion?.id);

    try {
      // Step 1: 서버측 입력 무결성 검증
      const { data: validationData, error: validationError } = await supabase.functions.invoke(
        'validate-survey-integrity',
        {
          body: {
            responses: surveyResponses,
            totalQuestions: questions.length,
          },
        }
      );

      if (validationError) {
        console.error("Server validation error:", validationError);
        // 검증 실패해도 분석은 계속 진행 (결과에 플래그만 추가)
      }

      if (validationData && !validationData.valid) {
        toast({
          title: "⚠️ 데이터 무결성 경고",
          description: validationData.message || "응답 데이터에 이상이 감지되었습니다.",
          variant: "destructive",
        });
        setCurrentStep("smart_survey");
        setIsLoading(false);
        return;
      }

      // Step 2: AI 무결성 분석
      const { data, error } = await supabase.functions.invoke('verinode-ai', {
        body: { 
          action: 'analyze_integrity',
          profile,
          responses: surveyResponses,
          trapAnswer: {
            instruction: trapQuestion?.trapInstruction,
            answer: trapResponse?.answer
          },
          serverValidation: validationData ?? null,
        }
      });

      if (error) throw error;

      if (data?.data) {
        const analysisResult = data.data as IntegrityResult;
        setResult(analysisResult);
        await saveVerificationData(analysisResult, surveyResponses);
        setCurrentStep("reward");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "분석 오류",
        description: "응답 분석에 실패했습니다.",
        variant: "destructive",
      });
      setCurrentStep("smart_survey");
    } finally {
      setIsLoading(false);
    }
  }, [profile, questions]);

  const saveVerificationData = async (analysisResult: IntegrityResult, surveyResponses: SurveyResponse[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('trust_score, vn_balance')
        .eq('id', user.id)
        .maybeSingle();

      const currentTrustScore = currentProfile?.trust_score ?? 0;
      const currentBalance = currentProfile?.vn_balance ?? 0;
      const newTrustScore = analysisResult.overallScore;
      const earnedTokens = analysisResult.tokenReward;
      const newBalance = currentBalance + earnedTokens;

      // 1. Insert verification history
      const { data: verificationHistory, error: historyError } = await supabase
        .from('verification_history')
        .insert([{
          user_id: user.id,
          verification_type: 'profile',
          trust_score_before: currentTrustScore,
          trust_score_after: newTrustScore,
          score_change: newTrustScore - currentTrustScore,
          vn_earned: earnedTokens,
          result: JSON.parse(JSON.stringify(analysisResult))
        }])
        .select('id')
        .single();
      
      const historyId = verificationHistory?.id;

      if (historyError) throw historyError;

      // 2. Insert survey responses
      const responseInserts = surveyResponses.map((response) => ({
        user_id: user.id,
        verification_id: historyId,
        question_id: response.questionId,
        question_text: questions.find(q => q.id === response.questionId)?.question ?? '',
        answer: response.answer,
        time_spent: response.timeSpent,
        typing_speed: response.typingSpeed
      }));

      await supabase.from('survey_responses').insert(responseInserts);

      // 3. Insert transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'earn',
        amount: earnedTokens,
        balance_before: currentBalance,
        balance_after: newBalance,
        description: '프로필 인증 완료 보상',
        reference_type: 'verification',
        reference_id: historyId
      });

      // 4. Update profile - 핵심 보완 로직 (is_verified 추가)
      await supabase
        .from('profiles')
        .update({
          trust_score: newTrustScore,
          vn_balance: newBalance,
          is_verified: true, // 인증 상태 활성화
          occupation: profile.occupation,
          company: profile.company,
          sns_keywords: profile.snsKeywords,
          introduction: profile.introduction,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['home-profile'] });

      toast({
        title: "인증 성공",
        description: "실제 존재 증명이 완료되었습니다.",
      });
    } catch (error) {
      console.error("Save verification data error:", error);
    }
  };

  const resetVerification = useCallback(() => {
    setCurrentStep("profile_setup");
    setProfile({ occupation: "", company: "", snsKeywords: [], introduction: "" });
    setQuestions([]);
    setResponses([]);
    setResult(null);
  }, []);

  return {
    currentStep,
    setCurrentStep,
    profile,
    setProfile,
    questions,
    responses,
    result,
    isLoading,
    generateQuestions,
    generateFollowUpQuestion,
    submitSurvey,
    resetVerification,
  };
}
