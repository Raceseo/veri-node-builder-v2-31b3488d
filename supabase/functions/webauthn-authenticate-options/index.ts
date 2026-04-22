import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: '이메일이 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // 이메일로 사용자 찾기
    const { data: userData, error: userError } = await adminClient.auth.admin.listUsers()
    
    if (userError) {
      console.error('사용자 조회 오류:', userError)
      return new Response(
        JSON.stringify({ error: '사용자 조회 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = userData.users.find(u => u.email === email)

    // NOTE:
    // - '등록된 생체 인증이 없습니다' 는 정상적인 상태(미등록)일 수 있습니다.
    // - 여기서 400을 반환하면 클라이언트(supabase-js)가 FunctionsHttpError 로 취급하여
    //   런타임 에러/블랭크 스크린로 표시되는 경우가 있어 200으로 통일합니다.
    // - 사용자 존재 여부는 노출하지 않기 위해, user 미존재/미등록 모두 동일 응답을 사용합니다.
    if (!user) {
      return new Response(
        JSON.stringify({
          hasPasskey: false,
          options: null,
          error: '등록된 생체 인증이 없습니다',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 해당 사용자의 passkey 조회
    const { data: passkeys, error: passkeysError } = await adminClient
      .from('user_passkeys')
      .select('credential_id, transports')
      .eq('user_id', user.id)

    if (passkeysError || !passkeys || passkeys.length === 0) {
      return new Response(
        JSON.stringify({
          hasPasskey: false,
          options: null,
          error: '등록된 생체 인증이 없습니다',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Challenge 생성
    const challenge = generateChallenge()

    // Challenge 저장
    const { error: challengeError } = await adminClient
      .from('passkey_challenges')
      .insert({
        user_id: user.id,
        email,
        challenge,
        type: 'authentication'
      })

    if (challengeError) {
      console.error('Challenge 저장 오류:', challengeError)
      return new Response(
        JSON.stringify({ error: 'Challenge 생성 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // WebAuthn 인증 옵션 생성
    const options = {
      challenge,
      timeout: 60000,
      rpId: new URL(req.headers.get('origin') || supabaseUrl).hostname,
      userVerification: 'preferred',
      allowCredentials: passkeys.map(p => ({
        id: p.credential_id,
        type: 'public-key',
        transports: p.transports || ['internal']
      }))
    }

    console.log('WebAuthn 인증 옵션 생성 완료:', email)

    return new Response(
      JSON.stringify({ hasPasskey: true, options, userId: user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('WebAuthn 인증 옵션 오류:', error)
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
