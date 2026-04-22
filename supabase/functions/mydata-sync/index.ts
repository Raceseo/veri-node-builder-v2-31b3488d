import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 데모용 금융기관 목록
const DEMO_INSTITUTIONS = {
  banks: [
    { code: 'KB', name: 'KB국민은행', type: 'bank' },
    { code: 'SHINHAN', name: '신한은행', type: 'bank' },
    { code: 'WOORI', name: '우리은행', type: 'bank' },
    { code: 'HANA', name: '하나은행', type: 'bank' },
    { code: 'NH', name: 'NH농협은행', type: 'bank' },
    { code: 'IBK', name: 'IBK기업은행', type: 'bank' },
    { code: 'KAKAO', name: '카카오뱅크', type: 'bank' },
    { code: 'TOSS', name: '토스뱅크', type: 'bank' },
  ],
  cards: [
    { code: 'SAMSUNG', name: '삼성카드', type: 'card' },
    { code: 'HYUNDAI', name: '현대카드', type: 'card' },
    { code: 'KB_CARD', name: 'KB국민카드', type: 'card' },
    { code: 'SHINHAN_CARD', name: '신한카드', type: 'card' },
    { code: 'LOTTE', name: '롯데카드', type: 'card' },
    { code: 'BC', name: 'BC카드', type: 'card' },
  ]
}

// 데모용 거래 내역 생성
function generateDemoTransactions(userId: string, connectionId: string): any[] {
  const categories = [
    { name: '식비', subCategories: ['배달음식', '외식', '카페', '마트'], merchants: ['배달의민족', '쿠팡이츠', '스타벅스', '이마트', '홈플러스'] },
    { name: '교통', subCategories: ['대중교통', '택시', '주유', '주차'], merchants: ['카카오택시', 'GS칼텍스', 'SK에너지', '서울교통공사'] },
    { name: '쇼핑', subCategories: ['의류', '전자기기', '생활용품', '화장품'], merchants: ['무신사', '쿠팡', '올리브영', '다이소', '애플스토어'] },
    { name: '문화생활', subCategories: ['영화', '공연', '도서', '구독'], merchants: ['CGV', '인터파크', '교보문고', '넷플릭스', '유튜브프리미엄'] },
    { name: '의료/건강', subCategories: ['병원', '약국', '헬스'], merchants: ['강남세브란스', '올리브약국', '스포애니'] },
    { name: '통신', subCategories: ['휴대폰', '인터넷'], merchants: ['SKT', 'KT', 'LG U+'] },
    { name: '주거', subCategories: ['월세', '관리비', '공과금'], merchants: ['한국전력', '서울시수도', '도시가스'] },
    { name: '금융', subCategories: ['저축', '보험', '투자'], merchants: ['삼성생명', '신한투자증권', '토스증권'] }
  ]
  
  const transactions = []
  const today = new Date()
  
  // 최근 3개월 거래 내역 생성
  for (let i = 0; i < 90; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // 하루에 1-5건 거래
    const dailyCount = Math.floor(Math.random() * 5) + 1
    
    for (let j = 0; j < dailyCount; j++) {
      const category = categories[Math.floor(Math.random() * categories.length)]
      const subCategory = category.subCategories[Math.floor(Math.random() * category.subCategories.length)]
      const merchant = category.merchants[Math.floor(Math.random() * category.merchants.length)]
      
      // 카테고리별 금액 범위
      let amount: number
      switch (category.name) {
        case '식비': amount = Math.floor(Math.random() * 30000) + 5000; break
        case '교통': amount = Math.floor(Math.random() * 50000) + 1500; break
        case '쇼핑': amount = Math.floor(Math.random() * 150000) + 10000; break
        case '문화생활': amount = Math.floor(Math.random() * 30000) + 5000; break
        case '의료/건강': amount = Math.floor(Math.random() * 100000) + 5000; break
        case '통신': amount = Math.floor(Math.random() * 50000) + 30000; break
        case '주거': amount = Math.floor(Math.random() * 500000) + 100000; break
        case '금융': amount = Math.floor(Math.random() * 500000) + 50000; break
        default: amount = Math.floor(Math.random() * 50000) + 5000
      }
      
      transactions.push({
        user_id: userId,
        connection_id: connectionId,
        transaction_date: date.toISOString().split('T')[0],
        description: `${merchant} 결제`,
        category: category.name,
        sub_category: subCategory,
        amount,
        transaction_type: 'expense',
        merchant_name: merchant,
        is_recurring: ['통신', '주거', '금융'].includes(category.name) && Math.random() > 0.5
      })
    }
  }
  
  // 수입 추가 (월급)
  for (let m = 0; m < 3; m++) {
    const salaryDate = new Date(today)
    salaryDate.setMonth(salaryDate.getMonth() - m)
    salaryDate.setDate(25) // 월급일
    
    if (salaryDate <= today) {
      transactions.push({
        user_id: userId,
        connection_id: connectionId,
        transaction_date: salaryDate.toISOString().split('T')[0],
        description: '급여 입금',
        category: '수입',
        sub_category: '급여',
        amount: Math.floor(Math.random() * 2000000) + 3000000, // 300-500만원
        transaction_type: 'income',
        merchant_name: '회사',
        is_recurring: true
      })
    }
  }
  
  return transactions
}

// 소비 페르소나 분석
function analyzePersona(transactions: any[]): { type: string; description: string } {
  const expenses = transactions.filter(t => t.transaction_type === 'expense')
  const categoryTotals: Record<string, number> = {}
  
  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
  })
  
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat)
  
  // 페르소나 결정 로직
  if (sortedCategories.includes('쇼핑') && sortedCategories.includes('문화생활')) {
    return { type: '트렌디한 얼리어답터', description: '최신 트렌드에 민감하고 새로운 경험을 즐기는 소비자' }
  } else if (sortedCategories.includes('식비') && sortedCategories[0] === '식비') {
    return { type: '미식가 라이프', description: '맛있는 음식과 다양한 식도락을 즐기는 소비자' }
  } else if (sortedCategories.includes('금융') && sortedCategories.includes('주거')) {
    return { type: '안정 추구형', description: '미래를 위한 저축과 안정적인 생활을 중시하는 소비자' }
  } else if (sortedCategories.includes('교통')) {
    return { type: '활동적인 외출러', description: '다양한 장소를 방문하며 활동적인 생활을 하는 소비자' }
  } else if (sortedCategories.includes('의료/건강')) {
    return { type: '헬시 라이프', description: '건강과 웰빙을 중시하며 자기 관리에 투자하는 소비자' }
  } else {
    return { type: '실속형 소비자', description: '합리적인 소비와 가성비를 중시하는 현명한 소비자' }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 사용자 인증 확인
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, institutionCode, institutionType } = await req.json()

    if (action === 'get_institutions') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          institutions: DEMO_INSTITUTIONS 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'connect') {
      // 기관 정보 찾기
      const allInstitutions = [...DEMO_INSTITUTIONS.banks, ...DEMO_INSTITUTIONS.cards]
      const institution = allInstitutions.find(i => i.code === institutionCode)
      
      if (!institution) {
        return new Response(
          JSON.stringify({ error: 'Invalid institution code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 연결 정보 저장
      const { data: connection, error: connError } = await supabase
        .from('mydata_connections')
        .insert({
          user_id: user.id,
          institution_type: institutionType,
          institution_code: institutionCode,
          institution_name: institution.name,
          account_number_masked: `****-****-****-${Math.floor(1000 + Math.random() * 9000)}`,
          is_connected: true,
          connected_at: new Date().toISOString(),
          sync_status: 'syncing'
        })
        .select()
        .single()

      if (connError) {
        return new Response(
          JSON.stringify({ error: connError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 데모 거래 내역 생성 및 저장
      const transactions = generateDemoTransactions(user.id, connection.id)
      
      const { error: txError } = await supabase
        .from('mydata_transactions')
        .insert(transactions)

      if (txError) {
        console.error('Transaction insert error:', txError)
      }

      // 연결 상태 업데이트
      await supabase
        .from('mydata_connections')
        .update({ 
          sync_status: 'completed',
          last_synced_at: new Date().toISOString()
        })
        .eq('id', connection.id)

      // 소비 분석 수행
      const persona = analyzePersona(transactions)
      const expenses = transactions.filter(t => t.transaction_type === 'expense')
      
      const categoryBreakdown: Record<string, number> = {}
      expenses.forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount
      })

      const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0)
      const monthlyAverage = Math.round(totalExpense / 3) // 3개월 평균

      // 데이터 가치 계산 (더 많은 거래 = 더 높은 가치)
      const dataValueRaw = 100
      const refinedMultiplier = 5 + (transactions.length / 50) // 거래 많을수록 가치 증가
      const dataValueRefined = Math.round(dataValueRaw * refinedMultiplier)

      // 분석 결과 저장 (upsert)
      const { error: analysisError } = await supabase
        .from('consumption_analysis')
        .upsert({
          user_id: user.id,
          persona_type: persona.type,
          persona_description: persona.description,
          category_breakdown: categoryBreakdown,
          monthly_average: monthlyAverage,
          data_value_raw: dataValueRaw,
          data_value_refined: dataValueRefined,
          analysis_date: new Date().toISOString().split('T')[0]
        }, { onConflict: 'user_id' })

      if (analysisError) {
        console.error('Analysis save error:', analysisError)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          connection,
          transactionCount: transactions.length,
          persona
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get_connections') {
      const { data: connections, error } = await supabase
        .from('mydata_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, connections }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get_analysis') {
      const { data: analysis, error } = await supabase
        .from('consumption_analysis')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, analysis }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'disconnect') {
      const { connectionId } = await req.json()
      
      const { error } = await supabase
        .from('mydata_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', user.id)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
