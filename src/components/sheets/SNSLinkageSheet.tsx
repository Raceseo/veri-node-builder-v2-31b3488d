import { useState } from "react";
import { ArrowLeft, Linkedin, Twitter, CheckCircle2, Loader2, User, Building, FileText, Youtube, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";

interface SNSLinkageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLink: (snsData: SNSData) => void;
}

export interface SNSData {
  platform: string;
  profileName: string;
  profileUrl: string;
  occupation?: string;
  company?: string;
  bio?: string;
}

type LinkStep = "select" | "input" | "linking" | "success";

interface PlatformConfig {
  name: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  description: string;
  urlPlaceholder: string;
}

const platforms: PlatformConfig[] = [
  {
    name: "LinkedIn",
    color: "#0077B5",
    bgColor: "bg-[#0077B5]",
    icon: <Linkedin className="w-7 h-7 text-white" />,
    description: "비즈니스 프로필 연동",
    urlPlaceholder: "https://linkedin.com/in/username",
  },
  {
    name: "Twitter",
    color: "#1DA1F2",
    bgColor: "bg-[#1DA1F2]",
    icon: <Twitter className="w-7 h-7 text-white" />,
    description: "소셜 프로필 연동",
    urlPlaceholder: "https://twitter.com/username",
  },
  {
    name: "YouTube",
    color: "#FF0000",
    bgColor: "bg-[#FF0000]",
    icon: <Youtube className="w-7 h-7 text-white" />,
    description: "채널 프로필 연동",
    urlPlaceholder: "https://youtube.com/@username",
  },
  {
    name: "TikTok",
    color: "#000000",
    bgColor: "bg-gradient-to-r from-[#00f2ea] via-[#ff0050] to-[#000000]",
    icon: (
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    description: "숏폼 크리에이터 연동",
    urlPlaceholder: "https://tiktok.com/@username",
  },
  {
    name: "Facebook",
    color: "#1877F2",
    bgColor: "bg-[#1877F2]",
    icon: <Facebook className="w-7 h-7 text-white" />,
    description: "페이스북 프로필 연동",
    urlPlaceholder: "https://facebook.com/username",
  },
  {
    name: "Instagram",
    color: "#E4405F",
    bgColor: "bg-gradient-to-br from-[#FCAF45] via-[#E4405F] to-[#833AB4]",
    icon: (
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    description: "인스타그램 프로필 연동",
    urlPlaceholder: "https://instagram.com/username",
  },
];

const SNSLinkageSheet = ({ open, onOpenChange, onLink }: SNSLinkageSheetProps) => {
  const [step, setStep] = useState<LinkStep>("select");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null);
  const [profileData, setProfileData] = useState({
    profileName: "",
    profileUrl: "",
    occupation: "",
    company: "",
    bio: "",
  });

  const resetState = () => {
    setStep("select");
    setSelectedPlatform(null);
    setProfileData({
      profileName: "",
      profileUrl: "",
      occupation: "",
      company: "",
      bio: "",
    });
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handlePlatformSelect = (platform: PlatformConfig) => {
    setSelectedPlatform(platform);
    setStep("input");
  };

  const handleLink = async () => {
    if (!profileData.profileName || !profileData.profileUrl) {
      toast({
        title: "입력 오류",
        description: "프로필 이름과 URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setStep("linking");

    // Simulate linking process
    await new Promise(resolve => setTimeout(resolve, 1500));

    const snsData: SNSData = {
      platform: selectedPlatform?.name || "unknown",
      ...profileData,
    };

    setStep("success");

    setTimeout(() => {
      onLink(snsData);
      handleClose();
      toast({
        title: "✅ SNS 연동 완료",
        description: `${selectedPlatform?.name} 프로필이 성공적으로 연동되었습니다.`,
      });
    }, 1000);
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="flex flex-row items-center justify-between px-4 py-4 border-b border-border">
          <button 
            onClick={step === "input" ? () => setStep("select") : handleClose}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h2 className="text-lg font-bold text-foreground">SNS 연동</h2>
          <div className="w-10" />
        </SheetHeader>

        <div className="p-6 space-y-6 overflow-y-auto h-[calc(85vh-140px)]">
          {/* Step: Select Platform */}
          {step === "select" && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">플랫폼 선택</h3>
                <p className="text-muted-foreground text-sm">
                  연동할 SNS 플랫폼을 선택해주세요.
                </p>
              </div>

              <div className="space-y-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => handlePlatformSelect(platform)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-colors"
                    style={{ backgroundColor: `${platform.color}15` }}
                  >
                    <div className={`w-14 h-14 rounded-xl ${platform.bgColor} flex items-center justify-center`}>
                      {platform.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-foreground">{platform.name}</p>
                      <p className="text-sm text-muted-foreground">{platform.description}</p>
                    </div>
                    <span className="text-muted-foreground">›</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step: Input Profile */}
          {step === "input" && selectedPlatform && (
            <>
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${selectedPlatform.bgColor}`}>
                  {selectedPlatform.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{selectedPlatform.name} 정보 입력</h3>
                <p className="text-muted-foreground text-sm">
                  프로필 정보를 입력해주세요.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    프로필 이름 *
                  </label>
                  <Input
                    placeholder="홍길동"
                    value={profileData.profileName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, profileName: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    프로필 URL *
                  </label>
                  <Input
                    placeholder={selectedPlatform.urlPlaceholder}
                    value={profileData.profileUrl}
                    onChange={(e) => setProfileData(prev => ({ ...prev, profileUrl: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    직업/직함
                  </label>
                  <Input
                    placeholder="소프트웨어 개발자"
                    value={profileData.occupation}
                    onChange={(e) => setProfileData(prev => ({ ...prev, occupation: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    회사/조직
                  </label>
                  <Input
                    placeholder="테크 회사"
                    value={profileData.company}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    자기소개
                  </label>
                  <Input
                    placeholder="간단한 자기소개"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step: Linking */}
          {step === "linking" && (
            <div className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">연동 중...</h3>
              <p className="text-muted-foreground text-sm">
                {selectedPlatform?.name} 프로필을 확인하고 있습니다.
              </p>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">연동 완료!</h3>
              <p className="text-muted-foreground text-sm">
                프로필이 성공적으로 연동되었습니다.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Buttons */}
        {step === "input" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <Button
              onClick={handleLink}
              disabled={!profileData.profileName || !profileData.profileUrl}
              className="w-full h-14 rounded-xl text-base bg-primary hover:bg-primary/90"
            >
              연동하기
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SNSLinkageSheet;
