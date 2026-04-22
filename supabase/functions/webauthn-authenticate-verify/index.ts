import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function base64URLDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4)
  const binaryStr = atob(paddedBase64)
  return Uint8Array.from(binaryStr, c => c.charCodeAt(0))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { credential, email } = await req.json()

    if (!credential || !credential.id || !credential.response || !email) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 요청입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // clientDataJSON 파싱
    const clientDataJSON = new TextDecoder().decode(base64URLDecode(credential.response.clientDataJSON))
    const clientData = JSON.parse(clientDataJSON)

    // 이메일로 사용자 찾기
    const { data: userData } = await adminClient.auth.admin.listUsers()
    const user = userData?.users.find(u => u.email === email)

    if (!user) {
      return new Response(
        JSON.stringify({ error: '사용자를 찾을 수 없습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Challenge 검증
    const { data: challengeData, error: challengeError } = await adminClient
      .from('passkey_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge', clientData.challenge)
      .eq('type', 'authentication')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (challengeError || !challengeData) {
      console.error('Challenge 검증 실패:', challengeError)
      return new Response(
        JSON.stringify({ error: 'Challenge가 만료되었거나 유효하지 않습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 사용된 challenge 삭제
    await adminClient
      .from('passkey_challenges')
      .delete()
      .eq('id', challengeData.id)

    // Origin 검증
    const expectedOrigin = req.headers.get('origin')
    if (clientData.origin !== expectedOrigin) {
      console.error('Origin 불일치:', clientData.origin, expectedOrigin)
      return new Response(
        JSON.stringify({ error: 'Origin 검증 실패' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Type 검증
    if (clientData.type !== 'webauthn.get') {
      return new Response(
        JSON.stringify({ error: 'Type 검증 실패' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Credential 검증 - DB에서 해당 credential 조회
    const { data: passkey, error: passkeyError } = await adminClient
      .from('user_passkeys')
      .select('*')
      .eq('credential_id', credential.id)
      .eq('user_id', user.id)
      .single()

    if (passkeyError || !passkey) {
      console.error('Passkey 조회 실패:', passkeyError)
      return new Response(
        JSON.stringify({ error: '등록되지 않은 기기입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // authenticatorData에서 counter 추출 및 검증
    const authenticatorData = base64URLDecode(credential.response.authenticatorData)
    const dataView = new DataView(authenticatorData.buffer)
    const counter = dataView.getUint32(33, false) // Big endian, offset 33

    // Counter 검증 (복제 공격 방지)
    if (counter <= passkey.counter) {
      console.error('Counter 검증 실패 - 복제 공격 의심:', counter, passkey.counter)
      return new Response(
        JSON.stringify({ error: '보안 검증 실패 - 기기 복제 의심' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Counter 업데이트 및 last_used_at 갱신
    await adminClient
      .from('user_passkeys')
      .update({
        counter,
        last_used_at: new Date().toISOString()
      })
      .eq('id', passkey.id)

    // 세션 생성을 위한 magic link 토큰 생성
    // Supabase에서 직접 세션을 발급하는 방법 사용
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: {
        redirectTo: `${expectedOrigin}/`
      }
    })

    if (linkError || !linkData) {
      console.error('세션 생성 오류:', linkError)
      return new Response(
        JSON.stringify({ error: '로그인 세션 생성 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // URL에서 토큰 추출
    const tokenUrl = new URL(linkData.properties.action_link)
    const token = tokenUrl.searchParams.get('token')
    const type = tokenUrl.searchParams.get('type')

    console.log('WebAuthn 인증 성공:', user.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        token,
        type,
        email: user.email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('WebAuthn 인증 검증 오류:', error)
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
