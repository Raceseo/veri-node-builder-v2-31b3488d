import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration
const RATE_LIMIT = { requests: 20, window: 3600 }; // 20 requests per hour

interface ProfileData {
  occupation: string;
  company: string;
  snsKeywords: string[];
  introduction: string;
}

interface SurveyResponse {
  questionId: number;
  answer: string;
  timeSpent: number;
  typingSpeed: number;
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
        // Allow first request but log for monitoring
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
    const rateLimit = await checkRateLimit(user.id, 'verinode-ai');
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for user ${user.id} on verinode-ai`);
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

    console.log(`VeriNode AI - Authenticated user: ${user.id}, Remaining requests: ${rateLimit.remaining}`);

    const { action, profile, responses, trapAnswer, reportTitle, reportContext, previousAnswer, previousQuestion, linkedData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: '서비스를 사용할 수 없습니다.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Input validation
    if (!action || typeof action !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid action parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";
    let tools = undefined;
    let toolChoice = undefined;

    if (action === 'generate_questions') {
      if (!profile || !profile.occupation) {
        return new Response(JSON.stringify({ error: 'Profile data is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      systemPrompt = `당신은 냉철하고 분석적인 데이터 무결성 검증 전문가입니다. 
사용자의 프로필 정보를 분석하여 논리적 일관성을 테스트할 수 있는 질문을 생성합니다.
질문은 프로필 정보와의 불일치를 감지하도록 설계되어야 합니다.
반드시 한국어로 작성하세요.`;

      userPrompt = `사용자 프로필:
- 직업: ${profile.occupation}
- 회사/소속: ${profile.company}
- SNS 키워드: ${profile.snsKeywords?.join(', ') || '없음'}
- 자기소개: ${profile.introduction}

위 프로필을 바탕으로 5개의 검증 질문을 생성하세요:
- 질문 1-4: 일관성 검증 질문 (프로필 정보와 답변의 논리적 부합성 테스트)
- 질문 5: 함정 질문 (숨겨진 지시사항 이행 여부 확인, 예: "답변에 특정 단어를 포함시키세요")

각 질문은 프로필 정보의 진실성을 교차 검증할 수 있어야 합니다.`;

      tools = [{
        type: "function",
        function: {
          name: "generate_verification_questions",
          description: "프로필 검증을 위한 5개의 질문을 생성합니다",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", description: "질문 번호 (1-5)" },
                    question: { type: "string", description: "질문 내용" },
                    type: { type: "string", enum: ["consistency", "trap"], description: "질문 유형" },
                    targetField: { type: "string", description: "검증 대상 프로필 필드" },
                    trapInstruction: { type: "string", description: "함정 질문의 경우 숨겨진 지시사항" }
                  },
                  required: ["id", "question", "type", "targetField"]
                }
              }
            },
            required: ["questions"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "generate_verification_questions" } };

    } else if (action === 'generate_contextual_questions') {
      if (!linkedData) {
        return new Response(JSON.stringify({ error: 'Linked data is required for contextual questions' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { financial = [], government = [], profile: userProfile, transactionCategories = [] } = linkedData;

      systemPrompt = `당신은 데이터 무결성 검증 전문가입니다.
사용자가 VeriNode에 연동한 실제 데이터를 기반으로,
해당 데이터의 진정한 소유자만이 답할 수 있는 검증 질문을 생성합니다.

[질문 생성 규칙]
1. 각 연동 데이터 유형별로 1-2개의 질문 생성 (총 5개)
2. 질문은 해당 서비스/기관을 실제 사용해야만 알 수 있는 내용
3. 계좌번호, 주민번호 등 직접적인 개인정보를 묻지 않음
4. 대신 사용 패턴, UX, 혜택, 서비스 특성 등 간접적 검증 질문
5. 마지막 질문(5번)은 함정 질문: 이전 답변에서 언급할 내용의 구체적 사실 확인

반드시 한국어로 작성하세요.`;

      const financialContext = financial.length > 0 
        ? `- 금융 기관: ${financial.map((f: { name: string; type: string }) => `${f.name} (${f.type})`).join(', ')}`
        : '- 금융 기관: 연동 없음';
      
      const governmentContext = government.length > 0
        ? `- 정부 기관: ${government.map((g: { name: string; type: string }) => `${g.name} (${g.type})`).join(', ')}`
        : '- 정부 기관: 연동 없음';
      
      const transactionContext = transactionCategories.length > 0
        ? `- 최근 거래 카테고리: ${transactionCategories.join(', ')}`
        : '';

      const profileContext = userProfile 
        ? `- 직업: ${userProfile.occupation || '미입력'}
- 관심사: ${userProfile.interests?.join(', ') || '미입력'}
- SNS 키워드: ${userProfile.sns_keywords?.join(', ') || '미입력'}`
        : '';

      userPrompt = `사용자가 연동한 데이터:
${financialContext}
${governmentContext}
${transactionContext}
${profileContext}

위 연동 데이터를 바탕으로 사용자가 실제로 해당 데이터를 소유하고 있는지 
검증할 수 있는 구체적인 질문 5개를 생성하세요.

예시:
- 은행 연동 시: "신한은행 앱에서 가장 자주 사용하는 메뉴는?"
- 카드 연동 시: "삼성카드 혜택 중 주로 사용하는 것은?"
- 건보공단 연동 시: "최근 건강검진을 받은 의료기관 유형은?"
- 거래내역 기반: "지난달 가장 큰 지출 항목의 대략적인 금액대는?"`;

      tools = [{
        type: "function",
        function: {
          name: "generate_contextual_questions",
          description: "연동된 데이터 기반으로 5개의 맞춤형 검증 질문을 생성합니다",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", description: "질문 번호 (1-5)" },
                    question: { type: "string", description: "검증 질문 내용" },
                    type: { type: "string", enum: ["financial", "government", "profile", "transaction", "trap"], description: "질문 유형" },
                    targetSource: { type: "string", description: "검증 대상 데이터 출처 (예: 신한은행, 건보공단)" },
                    verificationHint: { type: "string", description: "검증 포인트 힌트 (내부용)" }
                  },
                  required: ["id", "question", "type", "targetSource"]
                }
              }
            },
            required: ["questions"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "generate_contextual_questions" } };

    } else if (action === 'analyze_integrity') {
      if (!profile || !responses || !Array.isArray(responses)) {
        return new Response(JSON.stringify({ error: 'Profile and responses are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      systemPrompt = `당신은 냉철하고 공정한 데이터 무결성 분석가입니다.
사용자의 응답을 3가지 기준으로 분석합니다:
1. 일관성(Consistency): 프로필 정보와 답변 간의 논리적 부합성
2. 성실성(Sincerity): 답변의 구체성, 응답 시간, 타이핑 속도
3. 함정 문항 이행(Trap): 숨겨진 지시사항을 따랐는지 여부

점수는 반드시 0-100 사이로 산출하세요.
판정 기준:
- 80점 이상: 고신뢰 (High Trust)
- 50-79점: 보통 (Medium Trust)  
- 50점 미만: 신뢰불가 (Low Trust)`;

      const responsesText = responses.map((r: SurveyResponse) => 
        `질문 ${r.questionId}: [응답 있음] (응답시간: ${(r.timeSpent/1000).toFixed(1)}초)`
      ).join('\n');

      userPrompt = `원본 프로필:
- 직업: ${profile.occupation}
- 회사/소속: ${profile.company}
- SNS 키워드: ${profile.snsKeywords?.join(', ') || '없음'}
- 자기소개: ${profile.introduction}

설문 응답:
${responsesText}

함정 질문 이행 여부: ${trapAnswer?.completed ? '이행함' : '미이행'}

위 데이터를 분석하여 무결성 점수와 상세 분석을 제공하세요.`;

      tools = [{
        type: "function",
        function: {
          name: "analyze_integrity_score",
          description: "응답 데이터를 분석하여 무결성 점수와 판정을 제공합니다",
          parameters: {
            type: "object",
            properties: {
              overallScore: { type: "number", minimum: 0, maximum: 100, description: "전체 무결성 점수" },
              consistencyScore: { type: "number", minimum: 0, maximum: 100, description: "일관성 점수" },
              sincerityScore: { type: "number", minimum: 0, maximum: 100, description: "성실성 점수" },
              trapScore: { type: "number", minimum: 0, maximum: 100, description: "함정 문항 이행 점수" },
              verdict: { type: "string", enum: ["high_trust", "medium_trust", "low_trust"], description: "최종 판정" },
              analysis: {
                type: "object",
                properties: {
                  consistencyDetails: { type: "string", description: "일관성 분석 상세" },
                  sincerityDetails: { type: "string", description: "성실성 분석 상세" },
                  trapDetails: { type: "string", description: "함정 문항 분석 상세" },
                  overallSummary: { type: "string", description: "종합 분석 요약" }
                }
              },
              tokenReward: { type: "number", description: "지급될 VN 토큰 수량" }
            },
            required: ["overallScore", "consistencyScore", "sincerityScore", "trapScore", "verdict", "analysis", "tokenReward"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "analyze_integrity_score" } };

    } else if (action === 'executive_summary') {
      systemPrompt = `당신은 경영 컨설턴트이자 데이터 분석 전문가입니다.
데이터 리포트를 경영진이 이해하기 쉽도록 핵심 결론을 도출하고, 
비즈니스 가치와 실행 가능한 전략을 제안합니다.
모든 응답은 전문적이고 간결하며 한국어로 작성하세요.`;

      userPrompt = `리포트 제목: ${reportTitle || '데이터 리포트'}

리포트 컨텍스트:
- 총 응답자 수: ${reportContext?.totalRespondents || '15,000'}명
- 연령대: ${reportContext?.ageGroups?.join(', ') || '20-40세'}
- 주요 인사이트: ${reportContext?.mainInsights?.join('; ') || '소비 패턴 변화'}

위 데이터 리포트를 바탕으로 경영진 보고용 요약을 생성하세요:
1. 핵심 결론 3가지 (각 1-2문장, 비즈니스 임팩트 중심)
2. 예상 ROI (마케팅 적용 시 수익 상승률, %)
3. 다음 단계 액션 플랜 3가지 (구체적이고 실행 가능한 제안)`;

      tools = [{
        type: "function",
        function: {
          name: "generate_executive_summary",
          description: "경영진 보고용 데이터 리포트 요약을 생성합니다",
          parameters: {
            type: "object",
            properties: {
              keyTakeaway: {
                type: "array",
                items: { type: "string" },
                description: "핵심 결론 3가지 (각 1-2문장)"
              },
              roiEstimate: {
                type: "number",
                description: "예상 ROI 퍼센트 (예: 23.5)"
              },
              platinumRatio: {
                type: "number",
                description: "Platinum 인증 데이터 비율 (90-100 사이)"
              },
              nextSteps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "액션 플랜 제목" },
                    description: { type: "string", description: "구체적인 실행 방안" },
                    priority: { type: "string", enum: ["high", "medium", "low"], description: "우선순위" }
                  },
                  required: ["title", "description", "priority"]
                },
                description: "비즈니스 액션 플랜 3가지"
              }
            },
            required: ["keyTakeaway", "roiEstimate", "platinumRatio", "nextSteps"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "generate_executive_summary" } };

    } else if (action === 'generate_detail_trap') {
      // 디테일 함정 질문 동적 생성
      if (!previousAnswer || !previousQuestion) {
        return new Response(JSON.stringify({ error: 'Previous answer and question are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      systemPrompt = `당신은 데이터 무결성 검증 전문가입니다.
사용자의 이전 답변을 분석하여, 그 답변이 사실인지 검증할 수 있는 아주 구체적인 팩트체크 질문을 생성합니다.

예시:
- 이전 질문: "당신이 사용하는 가전제품 브랜드는?"
- 이전 답변: "삼성 냉장고를 사용합니다"
- 생성할 질문: "삼성 냉장고의 냉동실 서랍 개수와 야채실 위치가 왼쪽인지 오른쪽인지 알려주세요"

이렇게 실제 경험이 있어야만 알 수 있는 구체적인 사실을 묻는 질문을 만드세요.
반드시 한국어로 작성하세요.`;

      userPrompt = `이전 질문: ${previousQuestion}
이전 답변: ${previousAnswer}

위 답변이 실제 경험/사실에 기반한 것인지 검증할 수 있는 매우 구체적인 팩트체크 질문을 생성하세요.
답변자가 실제로 해당 경험이 있어야만 알 수 있는 세부 사항을 물어야 합니다.`;

      tools = [{
        type: "function",
        function: {
          name: "generate_detail_trap_question",
          description: "이전 답변을 검증하는 구체적인 팩트체크 질문을 생성합니다",
          parameters: {
            type: "object",
            properties: {
              question: {
                type: "object",
                properties: {
                  id: { type: "number", description: "질문 ID (100 이상)" },
                  question: { type: "string", description: "구체적인 팩트체크 질문" },
                  type: { type: "string", enum: ["detail_trap"], description: "질문 유형" },
                  targetField: { type: "string", description: "검증 대상" },
                  basedOnPreviousAnswer: { type: "string", description: "기반이 된 이전 답변 요약" }
                },
                required: ["id", "question", "type", "targetField", "basedOnPreviousAnswer"]
              }
            },
            required: ["question"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "generate_detail_trap_question" } };

    } else {
      return new Response(JSON.stringify({ error: 'Unknown action type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`VeriNode AI - Action: ${action}, User: ${user.id}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools,
        tool_choice: toolChoice
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`AI Gateway error: ${status}`);
      return new Response(JSON.stringify({ error: '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('AI Response received successfully');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content = data.choices?.[0]?.message?.content;
    return new Response(JSON.stringify({ success: true, data: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('VeriNode AI Error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ 
      error: 'An error occurred during processing' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
