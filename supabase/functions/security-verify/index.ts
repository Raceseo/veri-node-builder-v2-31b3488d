import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserBehavior {
  session_duration_sec: number;
  pages_visited: string[];
  last_action: string;
  ip_address: string;
}

interface SecurityRequest {
  content: string;
  behavior: UserBehavior;
  userId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, behavior, userId }: SecurityRequest = await req.json();

    // 🛡️ 입력값 null 체크 추가
    if (!content || !behavior || !userId) {
      return new Response(
        JSON.stringify({
          error: "필수 입력값이 누락되었습니다",
          required: ["content", "behavior", "userId"],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!behavior.pages_visited || !Array.isArray(behavior.pages_visited)) {
      return new Response(
        JSON.stringify({
          error: "behavior.pages_visited가 올바르지 않습니다",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`[Security Verify] Processing for user: ${userId}`);
    console.log(`[Security Verify] Content length: ${content.length}`);
    console.log(`[Security Verify] Behavior:`, behavior);
    // AI 보안 분석 프롬프트
    const systemPrompt = `You are VeriNode Security Analyst AI.
Analyze the submitted data for fraud, cherry-picking behavior, and data quality.

Return a JSON object with:
{
  "decision": "approved" | "fraud" | "pending_review",
  "score5W1H": 0-10 (data quality score based on Who, What, When, Where, Why, How),
  "overallScore": 0-100 (overall security score),
  "isFraud": boolean,
  "fraudReason": string | null,
  "analysis": string (detailed analysis in Korean)
}

Cherry-picker indicators:
- Very short session duration (<30 seconds)
- Only visiting reward/withdraw pages
- Suspicious IP patterns
- Low quality or generic content

Data Quality (5W1H) criteria:
- Who: Is the data clearly attributed?
- What: Is the data specific and detailed?
- When: Is there temporal context?
- Where: Is there location/context?
- Why: Is the purpose clear?
- How: Is the methodology/source clear?

VeriNode 철학: "데이터의 주인은 나이며, 무상으로 제공하지 않는다"
Only high-quality, verified data deserves fair compensation.`;

    const userPrompt = `Analyze this data submission:

Content: "${content}"

User Behavior:
- Session Duration: ${behavior.session_duration_sec} seconds
- Pages Visited: ${behavior.pages_visited.join(" → ")}
- Last Action: ${behavior.last_action}
- IP Address: ${behavior.ip_address}

Provide your security analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content;

    console.log(`[Security Verify] AI Response:`, aiContent);

    // JSON 파싱
    let result;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[Security Verify] Parse error:", parseError);
      // 기본 휴리스틱 분석
      const isSuspicious =
        behavior.session_duration_sec < 30 ||
        behavior.pages_visited.includes("rewards_withdraw") ||
        content.length < 50;

      result = {
        decision: isSuspicious ? "pending_review" : "approved",
        score5W1H: isSuspicious ? 3 : 7,
        overallScore: isSuspicious ? 40 : 75,
        isFraud: false,
        fraudReason: null,
        analysis: isSuspicious ? "행동 패턴이 의심스러워 추가 검토가 필요합니다." : "데이터 품질이 양호합니다.",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Security Verify] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
