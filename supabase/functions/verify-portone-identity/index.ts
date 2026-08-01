import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://verinode.kr',
  'https://www.verinode.kr',
  'https://veri-node-builder-8ffef160.lovable.app',
  'https://veri-node-builder.lovable.app',
];
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allAllowed = [...ALLOWED_ORIGINS, ...DEV_ORIGINS];
  const origin = requestOrigin && allAllowed.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[1];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

async function sha256hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req.headers.get('Origin')) });
  }
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '\uc778\uc99d\uc774 \ud544\uc694\ud569\ub2c8\ub2e4' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { identityVerificationId } = await req.json();

    if (!identityVerificationId) {
      return new Response(
        JSON.stringify({ error: 'identityVerificationId\uac00 \ud544\uc694\ud569\ub2c8\ub2e4' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiSecret = Deno.env.get('PORTONE_API_SECRET');
    if (!apiSecret) {
      return new Response(
        JSON.stringify({ error: 'PG\uc0ac \uc5f0\ub3d9 \uc624\ub958' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const verifyRes = await fetch(
      `https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `PortOne ${apiSecret}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!verifyRes.ok) {
      const errBody = await verifyRes.text();
      console.error('PortOne lookup failed:', verifyRes.status, errBody);
      return new Response(
        JSON.stringify({ error: '\ubcf8\uc778\uc778\uc99d \uc815\ubcf4\ub97c \uc870\ud68c\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const verifyInfo = await verifyRes.json();

    if (verifyInfo.status !== 'VERIFIED') {
      return new Response(
        JSON.stringify({ error: '\ubcf8\uc778\uc778\uc99d\uc774 \uc644\ub8cc\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4', status: verifyInfo.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, birthDate, gender, phone, ci, di } = verifyInfo;

    // CI 해시 계산 (원본 CI 저장 금지 — SHA-256 해시만 저장)
    let ciHash: string | null = null;
    if (ci) {
      ciHash = await sha256hex(ci);

      // 동일인 중복 참여 체크
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('ci_hash', ciHash)
        .neq('id', user.id)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({
            error: '\uc774\ubbf8 \ucc38\uc5ec\ud558\uc168\uc2b5\ub2c8\ub2e4.',
            code: 'DUPLICATE_PARTICIPATION',
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 프로필 업데이트 (ci_hash 포함)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        identity_verified: true,
        identity_verified_at: new Date().toISOString(),
        verified_name: name,
        verified_birth_date: birthDate,
        verified_gender: gender,
        verified_phone: phone,
        identity_verification_id: identityVerificationId,
        ci_hash: ciHash,
      })
      .eq('id', user.id);

    if (updateError) {
      console.warn('Profile update warning:', updateError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        identityVerificationId,
        name,
        birthDate,
        gender,
        phone,
        ci: ci ? '***' : null,
        di: di ? '***' : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Identity verification error:', error);
    return new Response(
      JSON.stringify({ error: '\ubcf8\uc778\uc778\uc99d \ucc98\ub9ac \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
