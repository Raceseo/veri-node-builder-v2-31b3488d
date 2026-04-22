import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptData, getEncryptionKeyFromEnv } from "../_shared/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResponseData {
  questionId: number;
  answer: string;
  timeSpent: number;
  typingSpeed: number;
}

interface ValidationResult {
  questionId: number;
  flags: string[];
  riskLevel: "low" | "medium" | "high";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { responses, totalQuestions } = await req.json() as {
      responses: ResponseData[];
      totalQuestions: number;
    };

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid responses data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validation rules
    const validationResults: ValidationResult[] = [];
    let totalTime = 0;
    let hasReject = false;

    for (const resp of responses) {
      const flags: string[] = [];

      // Rule 1: timeSpent < 3s is suspicious
      if (resp.timeSpent < 3000) {
        flags.push("rapid_response");
      }

      // Rule 2: typingSpeed > 15 chars/sec is suspicious
      if (resp.typingSpeed > 15) {
        flags.push("abnormal_typing_speed");
      }

      // Rule 3: very long answer in very short time
      if (resp.answer.length > 100 && resp.timeSpent < 5000) {
        flags.push("possible_paste_bypass");
      }

      totalTime += resp.timeSpent;

      const riskLevel: "low" | "medium" | "high" =
        flags.length === 0 ? "low" : flags.length === 1 ? "medium" : "high";

      validationResults.push({
        questionId: resp.questionId,
        flags,
        riskLevel,
      });
    }

    // Rule 4: total time < questions * 5s => reject
    const minTotalTime = totalQuestions * 5000;
    if (totalTime < minTotalTime) {
      hasReject = true;
    }

    // Encrypt typing pattern data
    const encryptionKey = getEncryptionKeyFromEnv();
    const patternData = responses.map((r) => ({
      questionId: r.questionId,
      timeSpent: r.timeSpent,
      typingSpeed: r.typingSpeed,
      answerLength: r.answer.length,
    }));
    const encryptedPatterns = await encryptData(
      JSON.stringify(patternData),
      encryptionKey
    );

    const overallRisk = hasReject
      ? "rejected"
      : validationResults.some((v) => v.riskLevel === "high")
        ? "high"
        : validationResults.some((v) => v.riskLevel === "medium")
          ? "medium"
          : "low";

    return new Response(
      JSON.stringify({
        valid: !hasReject,
        overallRisk,
        validationResults,
        encryptedPatterns,
        message: hasReject
          ? "응답 시간이 너무 짧아 데이터 무결성을 보장할 수 없습니다."
          : "데이터 무결성 검증 완료",
      }),
      {
        status: hasReject ? 422 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
