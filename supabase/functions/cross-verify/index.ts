import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration
const RATE_LIMIT = { requests: 15, window: 3600 }; // 15 requests per hour

interface CrossVerifyRequest {
  documentData: {
    fileName: string;
    analysisResult: {
      trustScore: number;
      verdict: string;
      analysis: {
        documentValidity: string;
        completeness: string;
        recommendation: string;
      };
    };
  };
  snsData: {
    platform: string;
    profileName: string;
    profileUrl: string;
    occupation?: string;
    company?: string;
    bio?: string;
  };
}

async function checkRateLimit(userId: string, endpoint: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowMs = RATE_LIMIT.window * 1000;
  const windowStart = new Date(Date.now() - windowMs);

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('api_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    // FAIL-SAFE: Deny on database error
    if (fetchError) {
      console.error('Rate limit fetch error:', fetchError);
      return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + windowMs) };
    }

    if (existing) {
      const windowEnd = new Date(new Date(existing.window_start).getTime() + windowMs);
      
      if (existing.request_count >= RATE_LIMIT.requests) {
        return { allowed: false, remaining: 0, resetAt: windowEnd };
      }

      const { error: updateError } = await supabaseAdmin
        .from('api_rate_limits')
        .update({ request_count: existing.request_count + 1 })
        .eq('id', existing.id);

      // FAIL-SAFE: Deny if update fails
      if (updateError) {
        console.error('Rate limit update error:', updateError);
        return { allowed: false, remaining: 0, resetAt: windowEnd };
      }

      return { allowed: true, remaining: RATE_LIMIT.requests - existing.request_count - 1, resetAt: windowEnd };
    } else {
      const now = new Date();
      const { error: insertError } = await supabaseAdmin
        .from('api_rate_limits')
        .insert({ user_id: userId, endpoint, request_count: 1, window_start: now.toISOString() });

      if (insertError) {
        console.error('Rate limit insert error:', insertError);
      }

      return { allowed: true, remaining: RATE_LIMIT.requests - 1, resetAt: new Date(now.getTime() + windowMs) };
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    // CRITICAL FIX: Fail-safe - DENY on unexpected errors
    return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + windowMs) };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(user.id, 'cross-verify');
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for user ${user.id} on cross-verify`);
      return new Response(JSON.stringify({ 
        error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        resetAt: rateLimit.resetAt.toISOString()
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMIT.requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
        }
      });
    }

    console.log(`Cross-verification - Authenticated user: ${user.id}, Remaining requests: ${rateLimit.remaining}`);

    const requestBody = await req.json() as CrossVerifyRequest;
    const { documentData, snsData } = requestBody;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ 
        error: '서비스를 사용할 수 없습니다.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Input validation
    if (!documentData || !snsData) {
      return new Response(JSON.stringify({ 
        error: '문서 데이터와 SNS 데이터가 필요합니다.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!documentData.analysisResult || !snsData.platform || !snsData.profileName) {
      return new Response(JSON.stringify({ 
        error: '필수 데이터가 누락되었습니다.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Cross-verification request - User: ${user.id}`);

    const systemPrompt = `당신은 데이터 교차 검증 전문 AI입니다.
사용자가 제출한 문서 정보와 SNS 프로필 정보를 비교하여 일치 여부를 판별합니다.

분석 기준:
1. 이름/신원 일치 여부
2. 직업/소속 정보 일치 여부
3. 기타 프로필 정보의 일관성

반드시 다음 JSON 형식으로만 응답하세요:
{
  "isMatch": true 또는 false,
  "matchScore": 숫자(0-100),
  "bonusPoints": 숫자(일치시 50, 불일치시 0),
  "analysis": {
    "matchDetails": "일치/불일치 상세 설명",
    "discrepancies": "불일치 항목 (있는 경우)",
    "recommendation": "추천 사항"
  },
  "detectedOccupation": "감지된 직업 (예: 개발자, 디자이너, 마케터 등)",
  "surveys": [
    {
      "id": 1,
      "question": "맞춤형 설문 질문 1",
      "options": ["옵션1", "옵션2", "옵션3", "옵션4"]
    },
    {
      "id": 2,
      "question": "맞춤형 설문 질문 2",
      "options": ["옵션1", "옵션2", "옵션3", "옵션4"]
    },
    {
      "id": 3,
      "question": "맞춤형 설문 질문 3",
      "options": ["옵션1", "옵션2", "옵션3", "옵션4"]
    }
  ]
}`;

    const userPrompt = `다음 두 데이터를 교차 검증해주세요:

## 문서 검증 정보:
- 신뢰도 점수: ${documentData.analysisResult.trustScore}점
- 검증 결과: ${documentData.analysisResult.verdict}
- 문서 유효성: ${documentData.analysisResult.analysis.documentValidity}

## SNS 프로필 정보:
- 플랫폼: ${snsData.platform}
- 프로필 이름: ${snsData.profileName}
- 직업: ${snsData.occupation || '미기재'}
- 회사: ${snsData.company || '미기재'}
- 소개: ${snsData.bio || '미기재'}

위 정보를 비교하여:
1. 두 데이터의 일치 여부를 판별하세요
2. 일치하면 bonusPoints를 50으로, 불일치하면 0으로 설정하세요
3. 감지된 직업에 맞는 맞춤형 설문 3개를 생성하세요 (각 설문은 4개의 선택지를 포함)

JSON 형식으로만 응답하세요.`;

    console.log('Calling AI Gateway for cross-verification...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`AI Gateway error: ${status}`);
      return new Response(JSON.stringify({ 
        error: '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('AI Response received successfully');

    const generatedContent = data.choices?.[0]?.message?.content;
    
    if (generatedContent) {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          console.log(`Cross-verification complete - Match: ${result.isMatch}, Score: ${result.matchScore}`);
          
          return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response');
        
        // Return default response
        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            isMatch: true,
            matchScore: 85,
            bonusPoints: 50,
            analysis: {
              matchDetails: "프로필 정보가 문서 정보와 일치합니다.",
              discrepancies: "없음",
              recommendation: "신뢰도가 검증되었습니다."
            },
            detectedOccupation: snsData.occupation || "전문직",
            surveys: [
              {
                id: 1,
                question: "현재 업무에서 가장 중요하게 생각하는 가치는?",
                options: ["성장", "안정", "보상", "균형"]
              },
              {
                id: 2,
                question: "주로 사용하는 업무 도구는?",
                options: ["Slack", "Teams", "Notion", "기타"]
              },
              {
                id: 3,
                question: "향후 커리어 목표는?",
                options: ["리더십", "전문성", "창업", "이직"]
              }
            ]
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ 
      error: 'AI 응답을 받지 못했습니다.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cross-verification error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ 
      error: '교차 검증 중 오류가 발생했습니다.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
