import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Base64URL 인코딩/디코딩 헬퍼
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function generateChallenge(): string {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  return base64URLEncode(challenge)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // 사용자 인증 확인
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 세션입니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 서비스 클라이언트로 DB 작업
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // 기존 등록된 passkey 확인
    const { data: existingPasskeys } = await adminClient
      .from('user_passkeys')
      .select('credential_id')
      .eq('user_id', user.id)

    // Challenge 생성
    const challenge = generateChallenge()

    // Challenge 저장
    const { error: challengeError } = await adminClient
      .from('passkey_challenges')
      .insert({
        user_id: user.id,
        email: user.email,
        challenge,
        type: 'registration'
      })

    if (challengeError) {
      console.error('Challenge 저장 오류:', challengeError)
      return new Response(
        JSON.stringify({ error: 'Challenge 생성 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 프로필에서 display_name 가져오기
    const { data: profile } = await adminClient
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const displayName = profile?.display_name || user.email?.split('@')[0] || 'VeriNode User'

    // WebAuthn 등록 옵션 생성
    const options = {
      challenge,
      rp: {
        name: 'VeriNode',
        id: new URL(req.headers.get('origin') || supabaseUrl).hostname
      },
      user: {
        id: base64URLEncode(new TextEncoder().encode(user.id)),
        name: user.email,
        displayName
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }  // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        userVerification: 'preferred'
      },
      excludeCredentials: (existingPasskeys || []).map(p => ({
        id: p.credential_id,
        type: 'public-key',
        transports: ['internal']
      }))
    }

    console.log('WebAuthn 등록 옵션 생성 완료:', user.id)

    return new Response(
      JSON.stringify({ options }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('WebAuthn 등록 옵션 오류:', error)
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
