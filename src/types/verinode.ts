export interface ProfileData {
  occupation: string;
  company: string;
  snsKeywords: string[];
  introduction: string;
}

export interface Question {
  id: number;
  question: string;
  type: "consistency" | "trap" | "detail_trap";
  targetField: string;
  trapInstruction?: string;
  basedOnPreviousAnswer?: string;
}

export interface SurveyResponse {
  questionId: number;
  answer: string;
  timeSpent: number;
  typingSpeed: number;
}

export interface IntegrityResult {
  overallScore: number;
  consistencyScore: number;
  sincerityScore: number;
  trapScore: number;
  verdict: "high_trust" | "medium_trust" | "low_trust";
  analysis: {
    consistencyDetails: string;
    sincerityDetails: string;
    trapDetails: string;
    overallSummary: string;
  };
  tokenReward: number;
}

export type VerificationStep = 
  | "profile_setup"
  | "question_generation"
  | "smart_survey"
  | "analysis"
  | "reward";