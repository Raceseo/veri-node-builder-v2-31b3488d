import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Fingerprint,
  Building2,
  Shield,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, UserType } from '@/hooks/useAuth';
import { usePasskey } from '@/hooks/usePasskey';
import { z } from 'zod';

import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { PreorderHero } from '@/components/marketing/PreorderHero';
import { BenefitRow } from '@/components/marketing/BenefitRow';

const emailSchema = z.string().email('유효한 이메일 주소를 입력하세요');
const passwordSchema = z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다');

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  // 이미 로그인된 사용자는 홈으로 보냄 (온보딩/대시보드)
  useEffect(() => {
    if (!user) return;
    navigate('/', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      <MarketingHeader />

      <PreorderHero
        size="compact"
        secondaryCta={
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="border-b border-border px-4 py-3.5 text-[15px] font-medium text-foreground hover:text-trust"
          >
            이미 가입하셨나요? 로그인
          </button>
        }
      />

      {/* 사전 신청 혜택 3줄 요약 */}
      <section className="bg-secondary px-6 py-10 md:px-12">
        <div className="grid gap-4 md:grid-cols-3">
          <BenefitRow
            icon={<Shield className="h-[18px] w-[18px] text-trust-dark" />}
            title="런칭 직후 우선 초대"
            desc="유료 설문을 이메일로 가장 먼저 받아봅니다."
          />
          <BenefitRow
            icon={<Coins className="h-[18px] w-[18px] text-trust-dark" />}
            title="건당 5,000원 즉시 지급"
            desc="응답 완료 시 정산 — 사후 협상 없음."
          />
          <BenefitRow
            icon={<Shield className="h-[18px] w-[18px] text-trust-dark" />}
            title="중복·허위 응답 원천 차단"
            desc={"공공 마이데이터 본인 인증으로 진짜 '나'만 응답, 응답 가치 보장."}
          />
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-7 text-[11.5px] text-muted-foreground md:px-12">
        <span>© {new Date().getFullYear()} VeriNode. All rights reserved.</span>
        <span>
          사전 신청은 Google Form으로 수집되며, 런칭 전 서비스 안내 수신에 동의하는 것으로 간주됩니다.
        </span>
      </footer>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// LoginDialog — 기존 Auth.tsx 폼 로직을 모달로 보존
// (email/password, passkey, signup with userType + displayName)
// ─────────────────────────────────────────────────────────────

function LoginDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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

  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const {
    isSupported,
    isLoading: isPasskeyLoading,
    authenticateWithPasskey,
    checkPasskeyExists,
  } = usePasskey();

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
    return () => {
      clearTimeout(timer);
      setIsCheckingPasskey(false);
    };
  }, [email, checkPasskeyExists]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success)
      newErrors.password = passwordResult.error.errors[0].message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasskeyLogin = async () => {
    if (!email) {
      setErrors({ email: '이메일을 먼저 입력하세요' });
      return;
    }
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }
    const result = await authenticateWithPasskey(email);
    if (result.success) {
      toast({ title: '로그인 성공', description: '생체 인증으로 로그인되었습니다!' });
      onOpenChange(false);
    } else {
      toast({
        title: '인증 실패',
        description: result.error || '생체 인증에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: '로그인 실패',
            description: error.message.includes('Invalid login credentials')
              ? '이메일 또는 비밀번호가 올바르지 않습니다.'
              : error.message.includes('Email not confirmed')
                ? '이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.'
                : '인증 서버가 혼잡합니다. 잠시 후 다시 시도해 주세요.',
            variant: 'destructive',
          });
        } else {
          toast({ title: '로그인 성공', description: 'VeriNode에 오신 것을 환영합니다!' });
          onOpenChange(false);
        }
      } else {
        const { error } = await signUp(
          email,
          password,
          displayName || undefined,
          userType,
        );
        if (error) {
          toast({
            title: '회원가입 실패',
            description: error.message.includes('already registered')
              ? '이미 가입된 이메일 주소입니다.'
              : '인증 서버가 혼잡합니다. 잠시 후 다시 시도해 주세요.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: '회원가입 성공',
            description: '인증 이메일이 발송되었습니다. 메일함을 확인해주세요.',
          });
          onOpenChange(false);
        }
      }
    } catch {
      toast({
        title: '오류 발생',
        description: '인증 서버가 혼잡합니다. 잠시 후 다시 시도해 주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canUsePasskey =
    isSupported && isLogin && hasPasskeyForEmail && !isCheckingPasskey;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            BETA 전용
          </div>
          <DialogTitle className="text-lg font-bold text-navy">
            {isLogin ? '로그인' : '회원가입'}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Switch */}
        <div className="flex rounded-xl bg-muted p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              isLogin
                ? 'bg-trust text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              !isLogin
                ? 'bg-trust text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label className="text-foreground">가입 유형</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUserType('individual')}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                    userType === 'individual'
                      ? 'border-trust bg-trust/5 text-trust'
                      : 'border-border text-muted-foreground hover:border-trust/50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  개인 (공급자)
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('enterprise')}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                    userType === 'enterprise'
                      ? 'border-trust bg-trust/5 text-trust'
                      : 'border-border text-muted-foreground hover:border-trust/50'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
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
                  <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                ) : (
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                )}
                <Input
                  id="displayName"
                  type="text"
                  placeholder={userType === 'enterprise' ? '주식회사 OOO' : '홍길동'}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="border-border bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus:border-trust focus:ring-trust"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              이메일
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`border-border bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus:border-trust focus:ring-trust ${
                  errors.email ? 'border-destructive' : ''
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              비밀번호
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`border-border bg-muted pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:border-trust focus:ring-trust ${
                  errors.password ? 'border-destructive' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-trust py-6 font-medium text-white hover:bg-trust-dark"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                처리 중...
              </span>
            ) : isLogin ? (
              '로그인'
            ) : (
              '회원가입'
            )}
          </Button>

          {isLogin && isSupported && (
            <>
              <div className="relative my-2 flex items-center">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-xs text-muted-foreground">또는</span>
                <div className="flex-1 border-t border-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handlePasskeyLogin}
                disabled={!canUsePasskey || isPasskeyLoading}
                className="h-12 w-full rounded-xl border-border text-foreground hover:bg-muted"
              >
                {isPasskeyLoading ? (
                  <span className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 animate-pulse" />
                    인증 중...
                  </span>
                ) : isCheckingPasskey ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                    확인 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5" />
                    지문 / Face ID로 로그인
                  </span>
                )}
              </Button>
              {!hasPasskeyForEmail && email && !isCheckingPasskey && (
                <p className="text-center text-xs text-muted-foreground">
                  💡 로그인 후 설정에서 생체 인증을 등록할 수 있습니다
                </p>
              )}
            </>
          )}
        </form>

        <div className="rounded-xl bg-muted p-3 text-[11.5px] leading-relaxed text-muted-foreground">
          정식 로그인은 현재 <b>베타 테스터 전용</b>입니다. 일반 사용자는 상단{' '}
          <b className="text-trust">사전 신청</b>을 이용해주세요.
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Auth;
