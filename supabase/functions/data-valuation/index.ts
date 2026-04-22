import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValuationRequest {
  content: string;
  score5W1H: number;
  continuousDays: number;
  contextData: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, score5W1H, continuousDays, contextData, userId }: ValuationRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`[Data Valuation] Processing for user: ${userId}`);
    console.log(`[Data Valuation] 5W1H Score: ${score5W1H}, Continuous Days: ${continuousDays}`);

    const systemPrompt = `You are VeriNode Valuation Agent AI.
Evaluate the market value of user-submitted data based on quality, continuity, and market context.

Return a JSON object with:
{
  "marketValue": number (USD value, range 0.50-50.00),
  "tier": "Gold" | "Silver" | "Bronze" | "Unranked",
  "isListed": boolean (true if tier is Gold or Silver),
  "report": string (valuation rationale in Korean, max 100 chars),
  "continuityBonus": number (0-2.0 multiplier based on continuous days),
  "contextMultiplier": number (0.5-1.5 based on market context)
}

Tier Criteria:
- Gold: score5W1H >= 8, continuousDays >= 7, high market relevance
- Silver: score5W1H >= 6, continuousDays >= 3
- Bronze: score5W1H >= 4
- Unranked: below Bronze thresholds

VeriNode 철학: "데이터의 주인은 나이며, 무상으로 제공하지 않는다"
Fair compensation based on data quality and market demand.`;

    const userPrompt = `Evaluate this data:

Content: "${content.substring(0, 500)}..."

Quality Score (5W1H): ${score5W1H}/10
Continuous Contribution Days: ${continuousDays}
Market Context: ${contextData}

Provide valuation analysis.`;

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
          { role: "user", content: userPrompt }
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
    
    console.log(`[Data Valuation] AI Response:`, aiContent);

    let result;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[Data Valuation] Parse error:", parseError);
      // 휴리스틱 기반 기본 평가
      const continuityBonus = Math.min(continuousDays * 0.1, 2.0);
      const baseValue = score5W1H * 2;
      
      let tier: 'Gold' | 'Silver' | 'Bronze' | 'Unranked' = 'Unranked';
      if (score5W1H >= 8 && continuousDays >= 7) tier = 'Gold';
      else if (score5W1H >= 6 && continuousDays >= 3) tier = 'Silver';
      else if (score5W1H >= 4) tier = 'Bronze';
      
      result = {
        marketValue: Math.round((baseValue + continuityBonus * 5) * 100) / 100,
        tier,
        isListed: tier === 'Gold' || tier === 'Silver',
        report: `품질 점수 ${score5W1H}/10 기준 ${tier} 등급으로 평가되었습니다.`,
        continuityBonus,
        contextMultiplier: 1.0
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Data Valuation] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
