import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type PaymentStatus = 'loading' | 'success' | 'failed';

const PaymentComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  const impUid = searchParams.get('imp_uid');
  const merchantUid = searchParams.get('merchant_uid');
  const success = searchParams.get('success');
  const errorMsg = searchParams.get('error_msg');

  useEffect(() => {
    const verifyPayment = async () => {
      // 결제 실패 파라미터가 있는 경우
      if (success === 'false' || errorMsg) {
        setStatus('failed');
        setMessage(errorMsg || '결제가 취소되었습니다.');
        return;
      }

      // imp_uid가 없는 경우
      if (!impUid || !merchantUid) {
        setStatus('failed');
        setMessage('결제 정보가 올바르지 않습니다.');
        return;
      }

      try {
        // 서버에서 결제 검증
        const { data, error } = await supabase.functions.invoke('verify-portone-payment', {
          body: {
            impUid,
            merchantUid,
          },
        });

        if (error || !data?.success) {
          setStatus('failed');
          setMessage(data?.error || '결제 검증에 실패했습니다.');
          return;
        }

        setStatus('success');
        setMessage('결제가 성공적으로 완료되었습니다!');
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('failed');
        setMessage('결제 검증 중 오류가 발생했습니다.');
      }
    };

    verifyPayment();
  }, [impUid, merchantUid, success, errorMsg]);

  // 자동 리다이렉트 카운트다운
  useEffect(() => {
    if (status === 'loading') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <h2 className="text-xl font-semibold mb-2">결제 확인 중...</h2>
              <p className="text-muted-foreground">잠시만 기다려주세요.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">결제 완료!</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {countdown}초 후 자동으로 이동합니다.
              </p>
              <Button onClick={handleGoHome} className="w-full">
                홈으로 이동
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">결제 실패</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {countdown}초 후 자동으로 이동합니다.
              </p>
              <Button onClick={handleGoHome} variant="outline" className="w-full">
                홈으로 이동
              </Button>
            </>
          )}

          {/* VeriNode 철학 */}
          <p className="text-xs text-muted-foreground mt-6 pt-4 border-t border-border w-full">
            데이터 주인은 나, 무상 제공 금지 — VeriNode
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentComplete;
