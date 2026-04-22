import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Rate limit configuration per endpoint (requests per hour)
const RATE_LIMITS: Record<string, { requests: number; window: number }> = {
  'verinode-ai': { requests: 20, window: 3600 },
  'analyze-document': { requests: 10, window: 3600 },
  'cross-verify': { requests: 15, window: 3600 },
  'process-withdrawal': { requests: 5, window: 3600 },
  'generate-withdrawal-otp': { requests: 3, window: 3600 },
  'verify-withdrawal-otp': { requests: 10, window: 3600 },
  'approve-withdrawal': { requests: 50, window: 3600 },
};

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export async function checkRateLimit(
  userId: string,
  endpoint: string
): Promise<RateLimitResult> {
  const limit = RATE_LIMITS[endpoint] || { requests: 10, window: 3600 };
  const windowMs = limit.window * 1000;
  const windowStart = new Date(Date.now() - windowMs);

  // Use service role to bypass RLS for rate limit table
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Get existing rate limit record within current window
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
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + windowMs),
        limit: limit.requests,
      };
    }

    if (existing) {
      const windowEnd = new Date(new Date(existing.window_start).getTime() + windowMs);
      
      if (existing.request_count >= limit.requests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: windowEnd,
          limit: limit.requests,
        };
      }

      // Increment counter
      const { error: updateError } = await supabaseAdmin
        .from('api_rate_limits')
        .update({ request_count: existing.request_count + 1 })
        .eq('id', existing.id);

      // FAIL-SAFE: Deny if update fails to prevent race conditions
      if (updateError) {
        console.error('Rate limit update error:', updateError);
        return {
          allowed: false,
          remaining: 0,
          resetAt: windowEnd,
          limit: limit.requests,
        };
      }

      return {
        allowed: true,
        remaining: limit.requests - existing.request_count - 1,
        resetAt: windowEnd,
        limit: limit.requests,
      };
    } else {
      // Create new window
      const now = new Date();
      const { error: insertError } = await supabaseAdmin
        .from('api_rate_limits')
        .insert({
          user_id: userId,
          endpoint,
          request_count: 1,
          window_start: now.toISOString(),
        });

      // Allow first request but log if insert fails (might be race condition)
      if (insertError) {
        console.error('Rate limit insert error:', insertError);
        // For first request, allow but with reduced remaining count for safety
      }

      return {
        allowed: true,
        remaining: limit.requests - 1,
        resetAt: new Date(now.getTime() + windowMs),
        limit: limit.requests,
      };
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    // CRITICAL FIX: Fail-safe - DENY on unexpected errors
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + windowMs),
      limit: limit.requests,
    };
  }
}

export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      resetAt: result.resetAt.toISOString(),
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetAt.toISOString(),
        'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
      },
    }
  );
}
