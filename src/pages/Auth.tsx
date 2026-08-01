import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, Eye, EyeOff, Fingerprint, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth, UserType } from '@/hooks/useAuth';
import { usePasskey } from '@/hooks/usePasskey';
import { z } from 'zod';
import { DATA_USAGE_NOTICE } from '@/lib/consentTexts';

const emailSchema = z.string().email('유효한 이메일 주소를 입력하세요');
const passwordSchema = z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userType, setUserType] = useState<UserType>('individual');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [hasPasskeyForEmail, setHasPasskeyForEmail] = useState(false);
  const [isCheckingPasskey, setIsCheckingPasskey] = useState(false);
  // J-1-b: 회원가입 개인정보 수집·이용 동의 (필수) + 고지 펼침
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  // §10-2: 가입 성공 후 "인증 대기" 화면. 값이 있으면 그 주소로 메일을 보낸 상태.
  //   이메일 인증이 켜지면 signUp 은 세션을 주지 않아 화면이 그대로 멈추므로,
  //   폼을 감추고 다음 행동(메일함 확인)을 명시한다. 폼 잔류 → 재클릭 사고도 함께 막는다.
  const [signupSentTo, setSignupSentTo] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  const { isSupported, isLoading: isPasskeyLoading, authenticateWithPasskey, checkPasskeyExists } = usePasskey();

  // 온보딩 플로우를 거치도록 루트로 리다이렉트
  useEffect(() => {
    if (!user) return;
    navigate('/', { replace: true });
  }, [user, navigate]);

  // passkey 체크
  useEffect(() => {
    if (!email || !emailSchema.safeParse(email).success) {
      setHasPasskeyForEmail(false);
      return;
    }
    setIsCheckingPasskey(true);
    const timer = setTimeout(async () => {
      try {
        const exists = await checkPasskeyExists(email);
        setHasPasskeyForEmail(exists);
      } catch {
        setHasPasskeyForEmail(false);
      } finally {
        setIsCheckingPasskey(false);
      }
    }, 800);
    return () => { clearTimeout(timer); setIsCheckingPasskey(false); };
  }, [email]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasskeyLogin = async () => {
    if (!email) { setErrors({ email: '이메일을 먼저 입력하세요' }); return; }
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) { setErrors({ email: emailResult.error.errors[0].message }); return; }
    const result = await authenticateWithPasskey(email);
    if (result.success) {
      toast({ title: '로그인 성공', description: '생체 인증으로 로그인되었습니다!' });
    } else {
      toast({ title: '인증 실패', description: result.error || '생체 인증에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    // J-1-b: 회원가입 시 개인정보 동의 미체크면 조기 차단(버튼 disabled와 이중). 로그인은 무관.
    if (!isLogin && !agreedPrivacy) return;
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          // §10-2: 이메일 미인증 판정은 error.code('email_not_confirmed') 우선.
          //   code 는 @supabase/auth-js 의 ErrorCode 유니온에 정의된 안정적 식별자이고,
          //   error.message 영문 문구는 서버 변경 시 조용히 깨진다(→ '혼잡합니다'로 오분류).
          //   구버전 서버 등으로 code 가 비어 오는 경우만 기존 문자열 매칭으로 폴백한다.
          const isEmailNotConfirmed =
            error.code === 'email_not_confirmed' ||
            (!error.code && error.message.includes('Email not confirmed'));
          toast({
            title: '로그인 실패',
            description: error.message.includes('Invalid login credentials')
              ? '이메일 또는 비밀번호가 올바르지 않습니다.'
              : isEmailNotConfirmed
                ? '이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.'
                : '인증 서버가 혼잡합니다. 잠시 후 다시 시도해 주세요.',
            variant: 'destructive',
          });
        } else {
          toast({ title: '로그인 성공', description: 'VeriNode에 오신 것을 환영합니다!' });
        }
      } else {
        const { error } = await signUp(email, password, displayName || undefined, userType, DATA_USAGE_NOTICE.version);
        if (error) {
          toast({
            title: '회원가입 실패',
            description: error.message.includes('already registered')
              ? '이미 가입된 이메일 주소입니다.'
              : '인증 서버가 혼잡합니다. 잠시 후 다시 시도해 주세요.',
            variant: 'destructive',
          });
        } else {
          // §10-2: 상세 안내는 아래 인증 대기 화면이 담당 → 토스트는 짧게.
          setSignupSentTo(email);
          toast({ title: '회원가입 성공', description: '인증 메일을 보냈습니다.' });
        }
      }
    } catch {
      toast({ title: '오류 발생', description: '인증 서버가 혼잡합니다. 잠시 후 다시 시도해 주세요.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** §10-2: 인증 대기 화면 → 로그인 탭 복귀. 가입 폼 입력값을 전부 비운다. */
  const backToLogin = () => {
    setSignupSentTo(null);
    setIsLogin(true);
    setEmail('');
    setPassword('');
    setDisplayName('');
    setUserType('individual');
    setShowPassword(false);
    setAgreedPrivacy(false);
    setNoticeOpen(false);
    setErrors({});
  };

  const canUsePasskey = isSupported && isLogin && hasPasskeyForEmail && !isCheckingPasskey;

  return (
    <div className="min-h-screen bg-[#F2F4F6] flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <Shield className="w-16 h-16 text-[#3182F6]" />
          <div className="absolute inset-0 bg-[#3182F6]/20 blur-xl rounded-full" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">VeriNode</h1>
        <p className="text-muted-foreground text-sm mt-1">나의 데이터 주권을 지키다</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm bg-card rounded-2xl p-6 border border-border shadow-sm">
        {signupSentTo ? (
          /* §10-2: 인증 대기 화면. 이메일 인증이 켜지면 가입 직후 세션이 없어
             화면이 그대로 멈추므로, 폼을 감추고 다음 행동을 명시한다. */
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#3182F6]/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-[#3182F6]" />
            </div>

            <h2 className="text-xl font-bold text-foreground">인증 메일을 보냈습니다</h2>

            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground break-all">{signupSentTo}</span>
              {' '}로 보냈습니다
            </p>

            <div className="w-full text-left text-sm text-muted-foreground bg-muted rounded-xl p-4 space-y-2 border border-border">
              <p>메일 속 링크를 눌러야 로그인할 수 있습니다.</p>
              <p>메일이 보이지 않으면 스팸함을 확인해 주세요.</p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={backToLogin}
              className="w-full h-12 rounded-xl border-border text-foreground hover:bg-muted"
            >
              로그인 화면으로
            </Button>
          </div>
        ) : (
        <>
        {/* Tab Switch */}
        <div className="flex mb-6 bg-muted rounded-xl p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              isLogin ? 'bg-[#3182F6] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              !isLogin ? 'bg-[#3182F6] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 회원가입 전용: 사용자 유형 선택 */}
          {!isLogin && (
            <div className="space-y-2">
              <Label className="text-foreground">가입 유형</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUserType('individual')}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    userType === 'individual'
                      ? 'border-[#3182F6] bg-[#3182F6]/5 text-[#3182F6]'
                      : 'border-border text-muted-foreground hover:border-[#3182F6]/50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  개인 (공급자)
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('enterprise')}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    userType === 'enterprise'
                      ? 'border-[#3182F6] bg-[#3182F6]/5 text-[#3182F6]'
                      : 'border-border text-muted-foreground hover:border-[#3182F6]/50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  기업 (수요자)
                </button>
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground">
                {userType === 'enterprise' ? '기업명' : '이름'} (선택)
              </Label>
              <div className="relative">
                {userType === 'enterprise' ? (
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                ) : (
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                )}
                <Input
                  id="displayName"
                  type="text"
                  placeholder={userType === 'enterprise' ? '주식회사 OOO' : '홍길동'}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-[#3182F6] focus:ring-[#3182F6]"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                className={`pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-[#3182F6] focus:ring-[#3182F6] ${errors.email ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                className={`pl-10 pr-10 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-[#3182F6] focus:ring-[#3182F6] ${errors.password ? 'border-destructive' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
          </div>

          {/* J-1-b: 회원가입 전용 개인정보 수집·이용 동의 (필수). 로그인 탭에는 노출 안 함. */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  checked={agreedPrivacy}
                  onCheckedChange={(c) => setAgreedPrivacy(c === true)}
                  className="mt-0.5"
                />
                <span className="text-sm text-foreground">[필수] 개인정보 수집·이용에 동의합니다</span>
              </label>
              {/* 수집 항목 상시 노출 (아코디언 접힘·펼침과 무관). 문안 단일 출처 = consentTexts.ts */}
              <p className="text-[11px] text-muted-foreground pl-6">
                수집 항목: {DATA_USAGE_NOTICE.collected.join(', ')}
              </p>
              <button
                type="button"
                onClick={() => setNoticeOpen((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground pl-6"
              >
                수집·이용 내용 보기 {noticeOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {noticeOpen && (
                <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 space-y-1 border border-border ml-6">
                  <p><span className="font-medium text-foreground">수집 항목</span>: {DATA_USAGE_NOTICE.collected.join(', ')}</p>
                  <p><span className="font-medium text-foreground">이용 목적</span>: {DATA_USAGE_NOTICE.purpose.join(', ')}</p>
                  <p><span className="font-medium text-foreground">미수집</span>: {DATA_USAGE_NOTICE.notCollected.join(', ')}</p>
                  <p><span className="font-medium text-foreground">보유 기간</span>: {DATA_USAGE_NOTICE.retentionPeriod}</p>
                  <p className="text-amber-600">{DATA_USAGE_NOTICE.refusalConsequence}</p>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || (!isLogin && !agreedPrivacy)}
            className="w-full bg-[#3182F6] hover:bg-[#2563EB] text-white font-medium py-6 rounded-xl"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                처리 중...
              </span>
            ) : isLogin ? '로그인' : '회원가입'}
          </Button>

          {/* 생체 인증 */}
          {isLogin && isSupported && (
            <>
              <div className="relative flex items-center my-2">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-xs text-muted-foreground">또는</span>
                <div className="flex-1 border-t border-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handlePasskeyLogin}
                disabled={!canUsePasskey || isPasskeyLoading}
                className="w-full h-12 rounded-xl border-border text-foreground hover:bg-muted"
              >
                {isPasskeyLoading ? (
                  <span className="flex items-center gap-2"><Fingerprint className="w-5 h-5 animate-pulse" />인증 중...</span>
                ) : isCheckingPasskey ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    확인 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><Fingerprint className="w-5 h-5" />지문 / Face ID로 로그인</span>
                )}
              </Button>
              {!hasPasskeyForEmail && email && !isCheckingPasskey && (
                <p className="text-xs text-muted-foreground text-center">
                  💡 로그인 후 설정에서 생체 인증을 등록할 수 있습니다
                </p>
              )}
            </>
          )}
        </form>
        </>
        )}
      </div>

      <p className="text-muted-foreground text-xs mt-8">© {new Date().getFullYear()} VeriNode. All rights reserved.</p>
    </div>
  );
};

export default Auth;
