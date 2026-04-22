import { Shield, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Compliance regulation types
export type ComplianceType = 'GDPR' | 'CCPA' | 'HIPAA' | 'ISO27001' | 'ISO27701';

interface ComplianceBadge {
  id: ComplianceType;
  name: string;
  fullName: string;
}

export const complianceRegulations: ComplianceBadge[] = [
  { id: 'GDPR', name: 'GDPR', fullName: 'General Data Protection Regulation' },
  { id: 'CCPA', name: 'CCPA', fullName: 'California Consumer Privacy Act' },
  { id: 'HIPAA', name: 'HIPAA', fullName: 'Health Insurance Portability and Accountability Act' },
  { id: 'ISO27001', name: 'ISO 27001', fullName: 'Information Security Management' },
  { id: 'ISO27701', name: 'ISO 27701', fullName: 'Privacy Information Management' },
];

// Small inline badge for data cards
export const ComplianceMicroBadge = ({ type }: { type: ComplianceType }) => {
  return (
    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-700/60 text-slate-400 rounded border border-slate-600/50">
      {type}
    </span>
  );
};

// Compliance badges row for data cards
interface ComplianceBadgesRowProps {
  compliances: ComplianceType[];
  className?: string;
}

export const ComplianceBadgesRow = ({ compliances, className }: ComplianceBadgesRowProps) => {
  if (compliances.length === 0) return null;
  
  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {compliances.slice(0, 3).map(type => (
        <ComplianceMicroBadge key={type} type={type} />
      ))}
      {compliances.length > 3 && (
        <span className="text-[8px] text-slate-500">+{compliances.length - 3}</span>
      )}
    </div>
  );
};

// V-Core Security Notice Component
export const VCoreSecurityNotice = ({ className }: { className?: string }) => {
  return (
    <div className={cn(
      "p-4 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/50",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <Lock className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h4 className="font-semibold text-white text-sm mb-1">V-Core 데이터 보안 확인</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            본 데이터는 <span className="text-emerald-400 font-medium">글로벌 데이터 3법</span> 및{' '}
            <span className="text-emerald-400 font-medium">GDPR 가이드라인</span>에 따라 완벽하게 익명화되었습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

// Global Trust & Compliance Footer
interface ComplianceFooterProps {
  className?: string;
  variant?: 'blue' | 'gold';
}

export const ComplianceFooter = ({ className, variant = 'blue' }: ComplianceFooterProps) => {
  const borderColor = variant === 'gold' ? 'border-amber-500/20' : 'border-blue-500/20';
  const bgGradient = variant === 'gold' 
    ? 'from-amber-950/50 via-zinc-950 to-amber-950/50' 
    : 'from-blue-950/50 via-slate-950 to-blue-950/50';
  const accentColor = variant === 'gold' ? 'text-amber-400' : 'text-blue-400';

  return (
    <footer className={cn(
      "border-t py-8 px-4",
      borderColor,
      `bg-gradient-to-r ${bgGradient}`,
      className
    )}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-slate-400" />
            <h3 className={cn("font-bold", accentColor)}>Global Trust & Compliance</h3>
          </div>
          <p className="text-xs text-slate-500">
            VeriNode는 글로벌 데이터 보호 규정을 준수합니다
          </p>
        </div>

        {/* Certification Logos */}
        <div className="flex items-center justify-center gap-4 flex-wrap mb-6">
          {complianceRegulations.map(reg => (
            <div 
              key={reg.id}
              className="group flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/30 flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-300">{reg.name}</span>
              </div>
              <span className="text-[8px] text-slate-500 text-center max-w-[80px] leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                {reg.fullName}
              </span>
            </div>
          ))}
        </div>

        {/* Trust Statement */}
        <div className="text-center p-4 rounded-xl bg-slate-800/20 border border-slate-700/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">V-Core 인증 데이터</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-lg mx-auto">
            모든 데이터는 V-Core AI의 다중 레이어 검증과 글로벌 규제 준수 검사를 통과했습니다.
            개인정보는 차등 프라이버시(Differential Privacy) 기술로 완벽히 보호됩니다.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default ComplianceFooter;
