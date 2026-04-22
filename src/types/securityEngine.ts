// Security Engine Types - Google AI Studio 코드 기반

export enum LogStatus {
  APPROVED = 'approved',
  FRAUD = 'fraud',
  PENDING_REVIEW = 'pending_review',
}

export type DataTier = 'Gold' | 'Silver' | 'Bronze' | 'Unranked';

export interface UserBehavior {
  session_duration_sec: number;
  pages_visited: string[];
  last_action: string;
  ip_address: string;
}

export interface SecurityResult {
  decision: LogStatus;
  score5W1H: number;
  overallScore: number;
  isFraud: boolean;
  fraudReason: string | null;
  analysis: string;
}

export interface ValuationResult {
  marketValue: number;
  tier: DataTier;
  isListed: boolean;
  report: string;
  continuityBonus: number;
  contextMultiplier: number;
}

export interface DataSalesLog {
  id: string;
  user_id: string;
  content: string;
  is_fraud_checked: boolean;
  status: LogStatus;
  fraud_reason: string | null;
  escrow_release_date: string | null;
  created_at: string;
  five_w_one_h_score: number;
  fraud_analysis: string;
  behavior_context: UserBehavior;
  market_value: number;
  tier: DataTier;
  is_listed_for_sale: boolean;
  valuation_report: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  amount: number;
  status: 'escrowed' | 'released' | 'cancelled';
}

export interface ContributeFormData {
  content: string;
  isCherryPickerMode: boolean;
  simDays: number;
  simContext: string;
}
