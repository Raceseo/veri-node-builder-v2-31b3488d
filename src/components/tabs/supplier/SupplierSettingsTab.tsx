import { 
  User, Bell, Shield, Lock, HelpCircle, FileText, 
  LogOut, ChevronRight, Smartphone, Fingerprint, Trash2, Plus,
  Linkedin, Twitter, Youtube, Facebook, CheckCircle2, Link2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { usePasskey } from "@/hooks/usePasskey";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SNSLinkageSheet, { SNSData } from "@/components/sheets/SNSLinkageSheet";
import { Badge } from "@/components/ui/badge";

interface SupplierSettingsTabProps {
  displayName: string;
  email: string;
}

const SupplierSettingsTab = ({
  displayName,
  email,
}: SupplierSettingsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passkeyToDelete, setPasskeyToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // SNS 연동 상태
  const [linkedSNS, setLinkedSNS] = useState<SNSData[]>([]);
  const [isSNSSheetOpen, setIsSNSSheetOpen] = useState(false);
  const [snsToDelete, setSnsToDelete] = useState<SNSData | null>(null);
  const [snsDeleteDialogOpen, setSnsDeleteDialogOpen] = useState(false);

  const {
    isSupported,
    isLoading,
    registeredDevices,
    registerPasskey,
    deletePasskey,
  } = usePasskey();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleRegisterPasskey = async () => {
    const result = await registerPasskey();
    
    if (result.success) {
      toast({
        title: "등록 완료",
        description: "생체 인증이 성공적으로 등록되었습니다.",
      });
    } else {
      toast({
        title: "등록 실패",
        description: result.error || "생체 인증 등록에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePasskey = async () => {
    if (!passkeyToDelete) return;

    const result = await deletePasskey(passkeyToDelete.id);
    
    if (result.success) {
      toast({
        title: "삭제 완료",
        description: "생체 인증 기기가 삭제되었습니다.",
      });
    } else {
      toast({
        title: "삭제 실패",
        description: result.error || "삭제에 실패했습니다.",
        variant: "destructive",
      });
    }

    setDeleteDialogOpen(false);
    setPasskeyToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // SNS 연동 핸들러
  const handleSNSLink = (snsData: SNSData) => {
    setLinkedSNS(prev => {
      // 이미 연동된 플랫폼이면 업데이트
      const existing = prev.findIndex(s => s.platform === snsData.platform);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = snsData;
        return updated;
      }
      return [...prev, snsData];
    });
    toast({
      title: "✅ SNS 연동 완료",
      description: `${snsData.platform} 계정이 연동되었습니다.`,
    });
  };

  const handleSNSUnlink = () => {
    if (!snsToDelete) return;
    setLinkedSNS(prev => prev.filter(s => s.platform !== snsToDelete.platform));
    toast({
      title: "연동 해제 완료",
      description: `${snsToDelete.platform} 계정 연동이 해제되었습니다.`,
    });
    setSnsDeleteDialogOpen(false);
    setSnsToDelete(null);
  };

  // SNS 플랫폼 설정
  const snsPlatforms = [
    { name: "LinkedIn", icon: <Linkedin className="w-5 h-5" />, color: "bg-[#0077B5]", monthlyVN: 5000 },
    { name: "Twitter", icon: <Twitter className="w-5 h-5" />, color: "bg-[#1DA1F2]", monthlyVN: 3000 },
    { name: "YouTube", icon: <Youtube className="w-5 h-5" />, color: "bg-[#FF0000]", monthlyVN: 4000 },
    { name: "Instagram", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/></svg>, color: "bg-gradient-to-br from-[#FCAF45] via-[#E4405F] to-[#833AB4]", monthlyVN: 3000 },
    { name: "TikTok", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>, color: "bg-black", monthlyVN: 3500 },
    { name: "Facebook", icon: <Facebook className="w-5 h-5" />, color: "bg-[#1877F2]", monthlyVN: 2500 },
  ];

  const getLinkedSNS = (platformName: string) => linkedSNS.find(s => s.platform === platformName);

  const settingsSections = [
    {
      title: "계정",
      items: [
        { 
          label: "프로필 수정", 
          icon: User, 
          action: () => {},
          value: displayName,
        },
        { 
          label: "보안 설정", 
          icon: Lock, 
          action: () => {},
        },
      ]
    },
    {
      title: "알림",
      items: [
        { 
          label: "푸시 알림", 
          icon: Bell, 
          toggle: true,
          value: notifications,
          onChange: setNotifications,
        },
      ]
    },
    {
      title: "개인정보",
      items: [
        { 
          label: "데이터 보호 설정", 
          icon: Shield, 
          action: () => {},
        },
        { 
          label: "개인정보 처리방침", 
          icon: FileText, 
          action: () => {},
        },
      ]
    },
    {
      title: "지원",
      items: [
        { 
          label: "도움말", 
          icon: HelpCircle, 
          action: () => {},
        },
      ]
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {displayName.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          <Button variant="outline" size="sm">
            편집
          </Button>
        </div>
      </Card>

      {/* SNS 계정 연동 섹션 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground px-1 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          SNS 계정 연동
        </h3>
        <Card className="p-4 space-y-3">
          {/* 연동 현황 요약 */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">
                {linkedSNS.length}개 계정 연동됨
              </p>
              <p className="text-xs text-muted-foreground">
                SNS 연동으로 신뢰도 +{linkedSNS.length * 5}점
              </p>
            </div>
            <Badge className="bg-success/20 text-success border-0">
              월 +{linkedSNS.reduce((acc, s) => {
                const platform = snsPlatforms.find(p => p.name === s.platform);
                return acc + (platform?.monthlyVN || 0);
              }, 0).toLocaleString()} VN
            </Badge>
          </div>

          {/* SNS 플랫폼 목록 */}
          <div className="space-y-2">
            {snsPlatforms.map((platform) => {
              const linked = getLinkedSNS(platform.name);
              return (
                <div 
                  key={platform.name}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${platform.color} flex items-center justify-center text-white`}>
                      {platform.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{platform.name}</p>
                        {linked && (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {linked 
                          ? `@${linked.profileName} • +${platform.monthlyVN.toLocaleString()} VN/월`
                          : `연동 시 +${platform.monthlyVN.toLocaleString()} VN/월`}
                      </p>
                    </div>
                  </div>
                  {linked ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setSnsToDelete(linked);
                        setSnsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => setIsSNSSheetOpen(true)}
                    >
                      연동
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 새 계정 연동 버튼 */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsSNSSheetOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            새 SNS 계정 연동하기
          </Button>
        </Card>
      </div>

      {/* Biometric Authentication Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground px-1">
          생체 인증
        </h3>
        <Card className="p-4 space-y-4">
          {/* Support Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isSupported ? 'bg-green-500/10' : 'bg-muted'
              }`}>
                <Fingerprint className={`w-5 h-5 ${
                  isSupported ? 'text-green-500' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">
                  {isSupported ? '생체 인증 지원됨' : '생체 인증 미지원'}
                </span>
                <p className="text-xs text-muted-foreground">
                  {isSupported 
                    ? '이 기기에서 지문/Face ID를 사용할 수 있습니다'
                    : '이 기기는 생체 인증을 지원하지 않습니다'}
                </p>
              </div>
            </div>
          </div>

          {/* Registered Devices */}
          {registeredDevices.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">등록된 기기</p>
              <div className="space-y-2">
                {registeredDevices.map((device) => (
                  <div 
                    key={device.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {device.device_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(device.created_at)} 등록
                          {device.last_used_at && ` • 최근 사용: ${formatDate(device.last_used_at)}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setPasskeyToDelete({ id: device.id, name: device.device_name });
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Register Button */}
          {isSupported && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleRegisterPasskey}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  등록 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  현재 기기 등록하기
                </span>
              )}
            </Button>
          )}
        </Card>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">
            {section.title}
          </h3>
          <Card className="divide-y divide-border">
            {section.items.map((item) => (
              <div 
                key={item.label}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => !item.toggle && item.action?.()}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    {item.value && typeof item.value === 'string' && (
                      <p className="text-xs text-muted-foreground">{item.value}</p>
                    )}
                  </div>
                </div>
                
                {item.toggle ? (
                  <Switch 
                    checked={item.value as boolean} 
                    onCheckedChange={item.onChange}
                  />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </Card>
        </div>
      ))}

      {/* Logout Button */}
      <Card className="p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          로그아웃
        </Button>
      </Card>

      {/* App Version */}
      <p className="text-center text-xs text-muted-foreground py-4">
        VeriNode v1.0.0
      </p>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>생체 인증 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{passkeyToDelete?.name}" 기기의 생체 인증을 삭제하시겠습니까?
              <br />
              삭제 후 해당 기기에서는 생체 인증으로 로그인할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeletePasskey}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SNS 연동 해제 확인 다이얼로그 */}
      <AlertDialog open={snsDeleteDialogOpen} onOpenChange={setSnsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>SNS 연동 해제</AlertDialogTitle>
            <AlertDialogDescription>
              "{snsToDelete?.platform}" 계정 연동을 해제하시겠습니까?
              <br />
              해제 시 월간 수익이 감소하고 신뢰 점수가 -5점 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleSNSUnlink}
            >
              연동 해제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SNS Linkage Sheet */}
      <SNSLinkageSheet
        open={isSNSSheetOpen}
        onOpenChange={setIsSNSSheetOpen}
        onLink={handleSNSLink}
      />
    </div>
  );
};

export default SupplierSettingsTab;
