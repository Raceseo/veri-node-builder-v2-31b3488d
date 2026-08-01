import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { resolveActiveSurveyId } from '@/lib/pendingSurvey';

export type UserType = 'individual' | 'enterprise';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string, userType: UserType = 'individual', consentVersion?: string) => {
    // §10-2: 확인 메일 링크는 origin/ 로만 돌아오므로, 딥링크로 들어온 가입자는
    //   메일을 다른 기기(휴대폰 메일앱 등)에서 열면 localStorage 스태시가 없어 설문을 잃는다.
    //   → 가입 시점에 살아있는 surveyId 를 링크 쿼리에 실어 기기 간에도 생존시킨다.
    //   읽기는 resolveActiveSurveyId(URL → 스태시 엿보기) — 소비/삭제하지 않음.
    //   ※ Supabase Redirect URLs 허용목록은 쿼리스트링을 포함해 매칭하므로,
    //     이 경로가 동작하려면 대시보드에 origin/* 형태의 와일드카드 등록이 필요하다.
    const activeSurveyId = resolveActiveSurveyId();
    const redirectUrl = activeSurveyId
      ? `${window.location.origin}/?surveyId=${encodeURIComponent(activeSurveyId)}`
      : `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
          user_type: userType,
          // J-1-b: 가입 시 개인정보 수집·이용 동의 버전. 서버 트리거(handle_new_user)가
          //        raw_user_meta_data 에서 읽어 data_usage_consents 에 기록. agreed_at 은 서버 now().
          consent_version: consentVersion,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  /** profiles 테이블에서 user_type 조회 */
  const getUserType = async (userId: string): Promise<UserType> => {
    const { data } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', userId)
      .maybeSingle();
    return (data?.user_type as UserType) || 'individual';
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    getUserType,
  };
};
