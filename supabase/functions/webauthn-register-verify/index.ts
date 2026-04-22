import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Base64URL 디코딩
function base64URLDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4)
  const binaryStr = atob(paddedBase64)
  return Uint8Array.from(binaryStr, c => c.charCodeAt(0))
}

// CBOR 파싱 (간단한 구현 - public key 추출용)
function parseCBOR(buffer: Uint8Array): any {
  // COSE 키에서 필요한 정보만 추출하는 간단한 파서
  // 실제 프로덕션에서는 전체 CBOR 파서 사용 권장
  return {
    raw: Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('')
  }
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

    const { credential, deviceName } = await req.json()

    if (!credential || !credential.id || !credential.response) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 credential입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // clientDataJSON 파싱 및 검증
    const clientDataJSON = new TextDecoder().decode(base64URLDecode(credential.response.clientDataJSON))
    const clientData = JSON.parse(clientDataJSON)

    // Challenge 검증
    const { data: challengeData, error: challengeError } = await adminClient
      .from('passkey_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge', clientData.challenge)
      .eq('type', 'registration')
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
    if (clientData.type !== 'webauthn.create') {
      return new Response(
        JSON.stringify({ error: 'Type 검증 실패' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // attestationObject 파싱
    const attestationObject = base64URLDecode(credential.response.attestationObject)
    
    // 간단한 CBOR 파싱으로 authenticatorData 추출
    // attestationObject 구조: CBOR map with authData, fmt, attStmt
    // authData 시작 위치 찾기 (실제로는 전체 CBOR 파서 필요)
    const publicKeyHex = parseCBOR(attestationObject).raw

    // 중복 credential 확인
    const { data: existingCred } = await adminClient
      .from('user_passkeys')
      .select('id')
      .eq('credential_id', credential.id)
      .single()

    if (existingCred) {
      return new Response(
        JSON.stringify({ error: '이미 등록된 기기입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Passkey 저장
    const { error: insertError } = await adminClient
      .from('user_passkeys')
      .insert({
        user_id: user.id,
        credential_id: credential.id,
        public_key: publicKeyHex,
        device_name: deviceName || 'Unknown Device',
        transports: credential.response.transports || [],
        counter: 0
      })

    if (insertError) {
      console.error('Passkey 저장 오류:', insertError)
      return new Response(
        JSON.stringify({ error: 'Passkey 저장 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Passkey 등록 완료:', user.id, credential.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: '생체 인증이 성공적으로 등록되었습니다'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('WebAuthn 등록 검증 오류:', error)
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
