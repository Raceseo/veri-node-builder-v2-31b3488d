import { useState, useRef } from "react";
import { Camera, Image, Upload, X, Info, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
interface DocumentUploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (result: AnalysisResult) => void;
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

type UploadStep = "select" | "preview" | "analyzing" | "result";

const DocumentUploadSheet = ({ isOpen, onClose, onUpload }: DocumentUploadSheetProps) => {
  const [step, setStep] = useState<UploadStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStep("select");
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "지원하지 않는 형식",
        description: "JPG, PNG, PDF 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "최대 10MB 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
    
    setStep("preview");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({
        title: "파일 없음",
        description: "먼저 파일을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setStep("analyzing");
    setErrorMessage(null);

    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get pure base64
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      console.log("Sending document to AI for analysis...");

      const { data: result, error: invokeError } = await supabase.functions.invoke('analyze-document', {
        body: {
          documentType: "proof_of_residence",
          documentData: base64Data,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'AI 분석에 실패했습니다.');
      }
      console.log("Gemini AI Analysis Result:", result);

      if (result.success && result.data) {
        const data = result.data;
        
        // Check if verdict is "verified" or "적합"
        const isVerified = data.verdict === "verified" || 
                          data.verdict === "적합" || 
                          data.trustScore >= 70;

        if (isVerified) {
          setAnalysisResult({
            success: true,
            trustScore: data.trustScore,
            verdict: data.verdict,
            analysis: data.analysis,
            tokenReward: data.tokenReward || 15000,
          });
          setStep("result");
        } else {
          // Document rejected
          setAnalysisResult({
            success: false,
            trustScore: data.trustScore,
            verdict: data.verdict,
            analysis: data.analysis,
            tokenReward: 0,
          });
          setErrorMessage(data.analysis?.recommendation || "문서가 요구 사항을 충족하지 않습니다.");
          setStep("result");
        }
      } else {
        throw new Error(result.error || "분석 결과를 받지 못했습니다.");
      }
    } catch (error) {
      console.error("Document analysis error:", error);
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
      setStep("preview");
      toast({
        title: "분석 실패",
        description: error instanceof Error ? error.message : "문서 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = () => {
    if (analysisResult && analysisResult.success) {
      onUpload(analysisResult);
    }
    handleClose();
  };

  const handleRetry = () => {
    setStep("select");
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-slide-up">
        <div className="bg-card rounded-t-3xl p-6 pb-8">
          {/* Handle */}
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

          {/* Step: Select File */}
          {step === "select" && (
            <>
              <h2 className="text-xl font-bold text-foreground text-center mb-2">
                서류 선택
              </h2>
              <p className="text-muted-foreground text-center text-sm mb-6">
                인증을 위해 서류를 업로드해주세요.
              </p>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="space-y-3 mb-4">
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">카메라로 촬영</p>
                    <p className="text-sm text-muted-foreground">신분증이나 서류를 직접 촬영합니다</p>
                  </div>
                  <span className="text-muted-foreground">›</span>
                </button>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Image className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">앨범에서 선택</p>
                    <p className="text-sm text-muted-foreground">저장된 이미지(JPG, PNG)를 선택합니다</p>
                  </div>
                  <span className="text-muted-foreground">›</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mb-4">
                <Info className="w-3.5 h-3.5" />
                <span>지원 형식: JPG, PNG, PDF (최대 10MB)</span>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 text-base"
                onClick={handleClose}
              >
                취소
              </Button>
            </>
          )}

          {/* Step: Preview */}
          {step === "preview" && selectedFile && (
            <>
              <h2 className="text-xl font-bold text-foreground text-center mb-2">
                파일 확인
              </h2>
              <p className="text-muted-foreground text-center text-sm mb-6">
                선택한 파일을 확인하고 업로드하세요.
              </p>

              {/* File Preview */}
              <div className="mb-6">
                {previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden bg-secondary">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
                  onClick={handleAnalyze}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  AI 분석 시작
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-base"
                  onClick={handleRetry}
                >
                  다른 파일 선택
                </Button>
              </div>
            </>
          )}

          {/* Step: Analyzing */}
          {step === "analyzing" && (
            <div className="py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                AI 분석 중...
              </h2>
              <p className="text-muted-foreground text-sm">
                Gemini AI가 문서를 분석하고 있습니다.
              </p>
              <p className="text-muted-foreground text-xs mt-2">
                잠시만 기다려주세요.
              </p>
            </div>
          )}

          {/* Step: Result */}
          {step === "result" && analysisResult && (
            <>
              {analysisResult.success ? (
                <div className="py-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    인증 성공!
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    문서가 성공적으로 검증되었습니다.
                  </p>

                  <div className="bg-secondary/50 rounded-xl p-4 mb-4 text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">신뢰도 점수</span>
                      <span className="font-bold text-primary">{analysisResult.trustScore}점</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">보상</span>
                      <span className="font-bold text-success">+{analysisResult.tokenReward.toLocaleString()} KRW</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">{analysisResult.analysis.documentValidity}</p>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
                    onClick={handleComplete}
                  >
                    확인
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-10 h-10 text-destructive" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    인증 실패
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    문서가 요구 사항을 충족하지 않습니다.
                  </p>

                  <div className="bg-destructive/10 rounded-xl p-4 mb-4 text-left">
                    <p className="text-sm text-destructive">
                      {analysisResult.analysis.recommendation || errorMessage}
                    </p>
                    {analysisResult.trustScore > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        신뢰도 점수: {analysisResult.trustScore}점
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
                      onClick={handleRetry}
                    >
                      다시 시도
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full h-12 text-base"
                      onClick={handleClose}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DocumentUploadSheet;