/**
 * VerificationBadge - 인증 배지 공통 컴포넌트
 * 
 * 다양한 인증 상태를 일관된 UI로 표시합니다.
 * - 본인인증, 생체인증, 문서인증, AI 검증 등
 */
import { 
  Shield, CheckCircle2, XCircle, Clock, 
  Fingerprint, FileCheck, Brain, Lock,
  Smartphone, Building2, CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type VerificationType = 
  | "identity"      // 본인인증
  | "biometric"     // 생체인증
  | "document"      // 문서인증
  | "ai"            // AI 검증
  | "phone"         // 휴대폰 인증
  | "bank"          // 계좌 인증
  | "company";      // 기업 인증

type VerificationStatus = "verified" | "pending" | "failed" | "none";

interface VerificationBadgeProps {
  type: VerificationType;
  status: VerificationStatus;
  variant?: "default" | "compact" | "icon-only";
  showLabel?: boolean;
  className?: string;
}

const typeConfig: Record<VerificationType, { icon: typeof Shield; label: string }> = {
  identity: { icon: Shield, label: "본인인증" },
  biometric: { icon: Fingerprint, label: "생체인증" },
  document: { icon: FileCheck, label: "문서인증" },
  ai: { icon: Brain, label: "AI 검증" },
  phone: { icon: Smartphone, label: "휴대폰" },
  bank: { icon: CreditCard, label: "계좌인증" },
  company: { icon: Building2, label: "기업인증" },
};

const statusConfig: Record<VerificationStatus, { 
  icon: typeof CheckCircle2; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  label: string 
}> = {
  verified: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    label: "완료",
  },
  pending: {
    icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    label: "진행중",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    label: "실패",
  },
  none: {
    icon: Lock,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted",
    label: "미인증",
  },
};

const VerificationBadge = ({
  type,
  status,
  variant = "default",
  showLabel = true,
  className,
}: VerificationBadgeProps) => {
  const typeInfo = typeConfig[type];
  const statusInfo = statusConfig[status];
  const TypeIcon = typeInfo.icon;
  const StatusIcon = statusInfo.icon;

  if (variant === "icon-only") {
    return (
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          statusInfo.bgColor,
          className
        )}
        title={`${typeInfo.label} ${statusInfo.label}`}
      >
        <TypeIcon className={cn("w-4 h-4", statusInfo.color)} />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md text-xs",
          statusInfo.bgColor,
          className
        )}
      >
        <TypeIcon className={cn("w-3 h-3", statusInfo.color)} />
        {showLabel && (
          <span className={cn("font-medium", statusInfo.color)}>
            {typeInfo.label}
          </span>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 py-1 px-2.5",
        statusInfo.bgColor,
        statusInfo.borderColor,
        className
      )}
    >
      <TypeIcon className={cn("w-3.5 h-3.5", statusInfo.color)} />
      {showLabel && (
        <span className={cn("text-xs font-medium", statusInfo.color)}>
          {typeInfo.label}
        </span>
      )}
      <StatusIcon className={cn("w-3 h-3 ml-0.5", statusInfo.color)} />
    </Badge>
  );
};

// Convenience component for showing multiple badges
interface VerificationBadgeGroupProps {
  verifications: Array<{ type: VerificationType; status: VerificationStatus }>;
  variant?: "default" | "compact" | "icon-only";
  className?: string;
}

export const VerificationBadgeGroup = ({
  verifications,
  variant = "icon-only",
  className,
}: VerificationBadgeGroupProps) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {verifications.map((v, index) => (
        <VerificationBadge
          key={`${v.type}-${index}`}
          type={v.type}
          status={v.status}
          variant={variant}
          showLabel={false}
        />
      ))}
    </div>
  );
};

export default VerificationBadge;
