import { useState } from "react";
import { Check, Upload, Link2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import DocumentUploadSheet from "@/components/sheets/DocumentUploadSheet";
import SNSLinkageSheet, { SNSData } from "@/components/sheets/SNSLinkageSheet";
import CrossVerificationSheet, { CrossVerificationResult } from "@/components/sheets/CrossVerificationSheet";

interface VerificationItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "pending" | "locked";
  action: string;
}

interface AnalysisResult {
  success: boolean;
  trustScore: number;
  verdict: string;
  analysis: {
    documentValidity: string;
    completeness: string;
    recommendation: string;
  };
  tokenReward: number;
}

interface DocumentDataForCrossVerify {
  fileName: string;
  analysisResult: {
    trustScore: number;
    verdict: string;
    analysis: {
      documentValidity: string;
      completeness: string;
      recommendation: string;
    };
  };
}

const CredibilityCard = () => {
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [isSNSSheetOpen, setIsSNSSheetOpen] = useState(false);
  const [isCrossVerifyOpen, setIsCrossVerifyOpen] = useState(false);
  
  const [documentData, setDocumentData] = useState<DocumentDataForCrossVerify | null>(null);
  const [snsData, setSnsData] = useState<SNSData | null>(null);
  const [totalBonusScore, setTotalBonusScore] = useState(0);

  const [items, setItems] = useState<VerificationItem[]>([
    {
      id: "identity",
      title: "Identity Verification",
      description: "Verified via Government ID",
      status: "completed",
      action: "Verified",
    },
    {
      id: "document",
      title: "Document Upload",
      description: "Proof of residence required",
      status: "pending",
      action: "Upload",
    },
    {
      id: "sns",
      title: "SNS Linkage",
      description: "Connect LinkedIn or Twitter",
      status: "pending",
      action: "Connect",
    },
    {
      id: "crossVerify",
      title: "Cross Verification",
      description: "AI data comparison",
      status: "locked",
      action: "Verify",
    },
  ]);

  const completedCount = items.filter((item) => item.status === "completed").length;
  const progress = Math.round((completedCount / items.length) * 100);

  const checkCrossVerifyReady = (newDocData: DocumentDataForCrossVerify | null, newSnsData: SNSData | null) => {
    if (newDocData && newSnsData) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === "crossVerify"
            ? { ...item, status: "pending" as const }
            : item
        )
      );
    }
  };

  const handleDocumentUploadSuccess = (result: AnalysisResult) => {
    const newDocData: DocumentDataForCrossVerify = {
      fileName: "uploaded_document",
      analysisResult: {
        trustScore: result.trustScore,
        verdict: result.verdict,
        analysis: result.analysis,
      },
    };
    
    setDocumentData(newDocData);
    
    setItems((prev) =>
      prev.map((item) =>
        item.id === "document"
          ? { ...item, status: "completed" as const, action: "Verified" }
          : item
      )
    );

    toast({
      title: `✅ 문서 검증 완료! (신뢰도: ${result.trustScore}점)`,
      description: `${result.analysis.documentValidity} +${result.tokenReward.toLocaleString()} KRW 획득!`,
    });

    checkCrossVerifyReady(newDocData, snsData);
  };

  const handleSNSLinkSuccess = (data: SNSData) => {
    setSnsData(data);
    
    setItems((prev) =>
      prev.map((item) =>
        item.id === "sns"
          ? { ...item, status: "completed" as const, action: "Verified" }
          : item
      )
    );

    checkCrossVerifyReady(documentData, data);
  };

  const handleCrossVerifyComplete = (result: CrossVerificationResult) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === "crossVerify"
          ? { ...item, status: "completed" as const, action: "Verified" }
          : item
      )
    );

    if (result.isMatch) {
      setTotalBonusScore(prev => prev + result.bonusPoints);
      toast({
        title: `🎉 교차 검증 완료!`,
        description: `신뢰 점수 +${result.bonusPoints}점 추가! 맞춤 설문도 완료되었습니다.`,
      });
    } else {
      toast({
        title: "⚠️ 추가 확인 필요",
        description: result.analysis.discrepancies || "일부 정보가 일치하지 않습니다.",
        variant: "destructive",
      });
    }
  };

  const handleAction = (id: string) => {
    if (id === "document") {
      setIsUploadSheetOpen(true);
      return;
    }
    
    if (id === "sns") {
      setIsSNSSheetOpen(true);
      return;
    }

    if (id === "crossVerify") {
      if (!documentData || !snsData) {
        toast({
          title: "검증 불가",
          description: "먼저 문서 업로드와 SNS 연동을 완료해주세요.",
          variant: "destructive",
        });
        return;
      }
      setIsCrossVerifyOpen(true);
      return;
    }

    // Default action
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "completed" as const, action: "Verified" }
          : item
      )
    );
    toast({
      title: "Verification Complete",
      description: "Your credibility score has increased!",
    });
  };

  const getIcon = (id: string, status: string) => {
    if (status === "completed") {
      return (
        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
          <Check className="w-5 h-5 text-success" />
        </div>
      );
    }
    if (id === "document") {
      return (
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary" />
        </div>
      );
    }
    if (id === "sns") {
      return (
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-primary" />
        </div>
      );
    }
    if (id === "crossVerify") {
      return (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          status === "locked" ? "bg-muted" : "bg-primary/10"
        }`}>
          <Shield className={`w-5 h-5 ${status === "locked" ? "text-muted-foreground" : "text-primary"}`} />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
        <Link2 className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  };

  const getButtonStyle = (id: string, status: string) => {
    if (status === "locked") {
      return "bg-muted text-muted-foreground cursor-not-allowed";
    }
    if (id === "document" || id === "sns" || id === "crossVerify") {
      return "bg-primary hover:bg-primary/90 text-primary-foreground";
    }
    return "bg-muted hover:bg-muted/80 text-foreground";
  };

  return (
    <>
      <div className="bg-card rounded-2xl p-6 shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Boost Your Credibility</h3>
            <p className="text-sm text-muted-foreground">Complete steps to unlock higher tiers</p>
            {totalBonusScore > 0 && (
              <p className="text-xs text-success mt-1">+{totalBonusScore} 보너스 점수 획득!</p>
            )}
          </div>
          
          {/* Circular Progress */}
          <div className="relative w-14 h-14">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="hsl(220 14% 92%)"
                strokeWidth="4"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="hsl(217 91% 55%)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Verification Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                item.status === "locked" ? "bg-muted/30" : "bg-secondary/50"
              }`}
            >
              {getIcon(item.id, item.status)}
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  item.status === "locked" ? "text-muted-foreground" : "text-foreground"
                }`}>
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {item.status === "pending" ? (
                <Button
                  size="sm"
                  onClick={() => handleAction(item.id)}
                  className={getButtonStyle(item.id, item.status)}
                >
                  {item.action}
                </Button>
              ) : item.status === "locked" ? (
                <span className="text-xs text-muted-foreground">🔒 Locked</span>
              ) : (
                <span className="text-xs text-success font-medium">✓ Verified</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Document Upload Sheet */}
      <DocumentUploadSheet
        isOpen={isUploadSheetOpen}
        onClose={() => setIsUploadSheetOpen(false)}
        onUpload={handleDocumentUploadSuccess}
      />

      {/* SNS Linkage Sheet */}
      <SNSLinkageSheet
        open={isSNSSheetOpen}
        onOpenChange={setIsSNSSheetOpen}
        onLink={handleSNSLinkSuccess}
      />

      {/* Cross Verification Sheet */}
      <CrossVerificationSheet
        open={isCrossVerifyOpen}
        onOpenChange={setIsCrossVerifyOpen}
        documentData={documentData}
        snsData={snsData}
        onComplete={handleCrossVerifyComplete}
      />
    </>
  );
};

export default CredibilityCard;
