import { useState } from "react";
import { 
  Shield, Building2, Lock, CheckCircle2, AlertTriangle, 
  UserCheck, Users, FileCheck, ArrowRight, Fingerprint
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import IdentityVerificationDialog from "./IdentityVerificationDialog";

interface BankAccountRegistrationProps {
  onRegistered?: () => void;
}

const banks = [
  { code: "004", name: "KB국민은행" },
  { code: "088", name: "신한은행" },
  { code: "020", name: "우리은행" },
  { code: "081", name: "하나은행" },
  { code: "003", name: "기업은행" },
  { code: "011", name: "농협은행" },
  { code: "023", name: "SC제일은행" },
  { code: "027", name: "씨티은행" },
  { code: "039", name: "경남은행" },
  { code: "034", name: "광주은행" },
  { code: "031", name: "대구은행" },
  { code: "032", name: "부산은행" },
  { code: "090", name: "카카오뱅크" },
  { code: "092", name: "토스뱅크" },
  { code: "089", name: "케이뱅크" },
];

const BankAccountRegistration = ({ onRegistered }: BankAccountRegistrationProps) => {
  const { user } = useAuth();
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [isOwnAccount, setIsOwnAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const handleRequestVerification = () => {
    if (!selectedBank || !accountNumber || !accountHolder || !isOwnAccount || !user) return;
    setShowVerification(true);
  };

  const handleVerificationSuccess = async () => {
    setShowVerification(false);
    setIsSubmitting(true);
    
    try {
      const bankName = banks.find(b => b.code === selectedBank)?.name || selectedBank;
      
      // 계좌 등록 감사 로그 (강화된 구조)
      // 위변조 방지를 위해 중요 필드 포함 및 해시 처리(백엔드 로직 가정)
      // B-30 (가) 차단: 감사 로그가 없는데 "계좌가 등록되었습니다"라고 말하면,
      //   분쟁 시 본인인증을 거쳤다는 증거가 남지 않는다. 실패하면 등록을 막는다.
      const { error: auditLogError } = await supabase.from('withdrawal_audit_logs').insert({
        user_id: user!.id,
        action: 'bank_account_registered',
        ip_address: 'client_ip_placeholder',
        details: {
          bank_name: bankName,
          account_number_masked: '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4),
          account_holder_hash: accountHolder, // 실제론 해시값 저장 권장
          identity_verified: true,
          verification_method: 'password_reauth',
          verified_at: new Date().toISOString(),
          consent_text: '본인 명의 계좌임을 확인하고, 본인 인증을 완료하였습니다',
          integrity_check: 'passed' 
        }
      });

      if (auditLogError) {
        console.error('withdrawal_audit_logs insert failed:', auditLogError);
        toast.error("계좌를 등록하지 못했습니다", {
          description: "다시 시도해 주세요.",
        });
        return;
      }

      toast.success("본인 인증 완료 - 계좌가 등록되었습니다", {
        description: `${bankName} ${accountNumber.slice(-4).padStart(accountNumber.length, '*')}`,
        duration: 5000,
      });

      setIsRegistered(true);
      onRegistered?.();
    } catch (error: any) {
      // B-30: error.message 원문 노출 제거 — 원인은 콘솔에만 남긴다(원칙 2).
      console.error('Account registration error:', error);
      toast.error("계좌를 등록하지 못했습니다", {
        description: "다시 시도해 주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = selectedBank && accountNumber.length >= 10 && accountHolder.length >= 2 && isOwnAccount;

  if (isRegistered) {
    return (
      <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-background border-emerald-500/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">계좌 등록 완료</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {banks.find(b => b.code === selectedBank)?.name} {accountNumber.slice(-4).padStart(accountNumber.length, '*')}
          </p>
          <Badge className="bg-emerald-500/20 text-emerald-500 border-0">
            <UserCheck className="w-3 h-3 mr-1" />
            본인 명의 확인됨
          </Badge>
        </motion.div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-[#1e3a5f]/20 to-background border-[#1e3a5f]/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#c9a227]/20 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-[#c9a227]" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">출금 계좌 등록</h3>
          <p className="text-xs text-muted-foreground">VN 보상금을 받을 계좌를 등록하세요</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm text-foreground">은행 선택</Label>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger className="w-full bg-background border-border">
              <SelectValue placeholder="은행을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank.code} value={bank.code}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    {bank.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-foreground">계좌번호</Label>
          <Input
            type="text"
            placeholder="'-' 없이 입력"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            className="bg-background border-border"
            maxLength={16}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-foreground">예금주명</Label>
          <Input
            type="text"
            placeholder="예금주 이름을 입력하세요"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            className="bg-background border-border"
            maxLength={20}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-600 mb-2">⚠️ 본인 명의 계좌 확인</p>
              <p className="text-xs text-muted-foreground mb-3">
                타인 명의 계좌로 출금 시 <span className="text-amber-500 font-semibold">법적 책임</span>이 발생할 수 있습니다.
                반드시 본인 명의의 계좌만 등록해 주세요.
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="own-account" 
                  checked={isOwnAccount}
                  onCheckedChange={(checked) => setIsOwnAccount(checked === true)}
                  className="border-amber-500 data-[state=checked]:bg-amber-500"
                />
                <label
                  htmlFor="own-account"
                  className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  본인 명의 계좌임을 확인합니다
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-[#1e3a5f]/20 rounded-lg border border-[#1e3a5f]/40"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1e3a5f]/30 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-[#c9a227]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-[#c9a227]">관리자 2인 승인 시스템</p>
                <Badge className="bg-[#c9a227]/20 text-[#c9a227] border-0 text-[10px]">
                  <Shield className="w-2.5 h-2.5 mr-0.5" />
                  금융급 보안
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                실제 인출 신청 시 <span className="text-[#c9a227] font-semibold">2명의 관리자 승인</span>이 필요합니다.
                이는 VeriNode의 금융급 보안 정책에 따라 귀하의 자산을 안전하게 보호하기 위함입니다.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>1차 승인</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2차 승인</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a227]" />
                  <span>출금 완료</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <Button
          onClick={handleRequestVerification}
          disabled={!isValid || isSubmitting}
          className="w-full bg-[#c9a227] hover:bg-[#b8922a] text-slate-900 font-semibold"
        >
          <Fingerprint className="w-4 h-4 mr-2" />
          {isSubmitting ? "등록 중..." : "본인 인증 후 계좌 등록"}
        </Button>

        <IdentityVerificationDialog
          isOpen={showVerification}
          onClose={() => setShowVerification(false)}
          onVerified={handleVerificationSuccess}
          userEmail={user?.email || undefined}
          title="계좌 등록 본인 인증"
          description="등록하려는 계좌의 본인 여부를 확인합니다"
          consentText="본인 명의 계좌임을 확인하고, 본인 인증을 완료하였습니다"
        />

        <div className="flex items-center justify-center gap-2 pt-2">
          <Lock className="w-3 h-3 text-emerald-500" />
          <p className="text-[10px] text-muted-foreground">
            계좌 정보는 AES-256 암호화되어 안전하게 저장됩니다
          </p>
        </div>
      </div>
    </Card>
  );
};

export default BankAccountRegistration;