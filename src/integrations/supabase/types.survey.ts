/**
 * 설문 테이블 수동 타입 정의 (surveys / survey_questions)
 * ----------------------------------------------------------------------------
 * ⚠️ 이 파일은 `types.ts`(Lovable 자동 생성)와 분리된 수동 파일입니다.
 *
 * 왜 types.ts를 직접 고치지 않는가:
 *  - types.ts 상단에 "automatically generated. Do not edit"가 명시돼 있고,
 *    Lovable이 스키마 동기화 시 이 파일을 통째로 덮어써서 수동 수정이 유실됩니다.
 *  - `Database`는 interface가 아니라 `type` 별칭이라 declaration merging(모듈 확장)도 불가.
 *  - 따라서 새 테이블 타입은 별도 파일로 두고 구간② 코드에서 명시적으로 import 합니다.
 *  - 나중에 Lovable이 types.ts를 재생성해 surveys/survey_questions가 포함되면
 *    이 파일은 그때 폐기(정본으로 이관)하면 됩니다.
 *
 * 컬럼은 20260726120000_create_surveys_and_survey_questions.sql 과 1:1로 맞춥니다.
 */

import type { Json } from "./types";

export type SurveyStatus = "draft" | "active" | "closed";
export type SurveyQuestionType = "single_choice" | "multi_choice" | "scale" | "text";

// ─── surveys ────────────────────────────────────────────────────────────────
export interface SurveyRow {
  id: string;
  title: string;
  description: string | null;
  reward_vn: number;
  status: SurveyStatus;
  target_responses: number | null;
  response_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyInsert {
  id?: string;
  title: string;
  description?: string | null;
  reward_vn?: number;
  status?: SurveyStatus;
  target_responses?: number | null;
  response_count?: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type SurveyUpdate = Partial<SurveyInsert>;

// ─── survey_questions ────────────────────────────────────────────────────────
export interface SurveyQuestionRow {
  id: string;
  survey_id: string;
  order_no: number;
  question_text: string;
  question_type: SurveyQuestionType;
  options: Json;
  is_trap: boolean;
  created_at: string;
}

export interface SurveyQuestionInsert {
  id?: string;
  survey_id: string;
  order_no: number;
  question_text: string;
  question_type: SurveyQuestionType;
  options?: Json;
  is_trap?: boolean;
  created_at?: string;
}

export type SurveyQuestionUpdate = Partial<SurveyQuestionInsert>;

/**
 * authenticated(클라이언트)가 실제로 조회 가능한 문항 형태.
 * is_trap 컬럼은 SELECT 권한에서 회수됐으므로 클라이언트 select에 포함하면 오류.
 * → 프론트에서는 이 타입을 쓰고, 아래 SURVEY_QUESTION_PUBLIC_COLUMNS 로만 조회할 것.
 */
export type SurveyQuestionPublic = Omit<SurveyQuestionRow, "is_trap">;

/** survey_questions 를 authenticated 로 조회할 때 사용할 안전 컬럼 목록 */
export const SURVEY_QUESTION_PUBLIC_COLUMNS =
  "id, survey_id, order_no, question_text, question_type, options, created_at" as const;
