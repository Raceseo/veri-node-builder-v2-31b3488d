/**
 * B-19 — 루트(/) 진입 게이트
 *
 * 배경: 기존에는 / 가 ProtectedRoute 로 감싸여 있어, 비로그인 방문자가
 *   서비스 설명을 보기도 전에 /auth(로그인 폼)로 강제 이동됐다.
 *   랜딩(IntroView)이 온보딩 1단계라 인증 장벽 안쪽에만 존재했기 때문이다.
 *
 * 이 컴포넌트가 하는 일 — 오직 분기 하나:
 *   · 세션 확인 중 → 스피너 (ProtectedRoute 와 동일한 모양)
 *   · 비로그인     → IntroView. "시작하기"는 /auth 로 보낸다
 *   · 로그인       → 기존과 동일하게 ProfileProvider + Index
 *
 * ⚠️ 설계 원칙: 로그인 사용자의 동선을 바꾸지 않는다.
 *   user 존재를 여기서 이미 확인하므로 Index 는 기존과 완전히 같은 조건에서
 *   마운트된다. Index·ProtectedRoute·IntroView 는 수정하지 않는다.
 *   (ProtectedRoute 는 /dashboard·/enterprise·/security-engine 이 계속 사용)
 *
 * ⚠️ 딥링크(/?surveyId=...)는 영향 없음 — 스태시 저장은 main.tsx 에서
 *   React 렌더 이전에 끝난다(구간H).
 */

import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ProfileProvider } from '@/contexts/ProfileContext';
import Index from './Index';
import IntroView from '@/components/views/IntroView';

/** ProtectedRoute 의 로딩 화면과 동일한 모양 — 기존 / 진입 시 보이던 화면을 유지한다. */
const AuthLoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-b from-navy-dark via-navy to-navy flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Shield className="w-16 h-16 text-trust animate-pulse" />
        <div className="absolute inset-0 bg-trust/20 blur-xl rounded-full" />
      </div>
      <p className="text-white/60 text-sm">로딩 중...</p>
    </div>
  </div>
);

const RootEntry = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  // 비로그인: 랜딩을 보여주고, CTA 는 인증 화면으로 보낸다.
  //   문구는 IntroView 원본 그대로 "시작하기" — 로그인 탭이 먼저 뜨는 /auth 와
  //   어긋나지 않고, 온보딩 미완료 사용자가 보는 문구와도 같아진다.
  if (!user) {
    return <IntroView onStart={() => navigate('/auth')} />;
  }

  // 로그인: 기존 경로 그대로.
  return (
    <ProfileProvider>
      <Index />
    </ProfileProvider>
  );
};

export default RootEntry;
