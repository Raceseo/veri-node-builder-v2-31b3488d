import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Eye, EyeOff, Lock, Unlock, Building2, AlertTriangle,
  CheckCircle2, Info, ChevronDown, ChevronUp, Coins, Save, Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CategoryPrivacy {
  id: string;
  name: string;
  icon: React.ElementType;
  source: 'financial' | 'government';
  isConnected: boolean;
  vnValue: number;
  // Privacy settings
  isPublic: boolean;
  anonymizationLevel: 'none' | 'partial' | 'full';
  allowedUseCases: string[];
}

interface PrivacyControlPanelProps {
  categories: {
    id: string;
    name: string;
    icon: React.ElementType;
    source: 'financial' | 'government';
    isConnected: boolean;
    vnValue: number;
  }[];
  onPrivacyChange?: (settings: Map<string, CategoryPrivacy>) => void;
}

const USE_CASES = [
  { id: 'survey', label: '설문조사', description: '기업 설문 참여 시 활용' },
  { id: 'marketing', label: '마케팅 분석', description: '소비 패턴 분석에 활용' },
  { id: 'research', label: '학술 연구', description: '익명화된 학술 연구 목적' },
  { id: 'policy', label: '정책 연구', description: '정부 정책 수립 기초 자료' },
];

const ANONYMIZATION_LEVELS = [
  { id: 'none', label: '원본', description: '데이터 그대로 제공', risk: 'high', multiplier: 1.5 },
  { id: 'partial', label: '부분 익명화', description: '핵심 정보만 마스킹', risk: 'medium', multiplier: 1.0 },
  { id: 'full', label: '완전 익명화', description: '개인 식별 불가', risk: 'low', multiplier: 0.7 },
] as const;

export default function PrivacyControlPanel({ categories, onPrivacyChange }: PrivacyControlPanelProps) {
  const { user } = useAuth();
  const [privacySettings, setPrivacySettings] = useState<Map<string, CategoryPrivacy>>(new Map());
  const [globalPublic, setGlobalPublic] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load privacy settings from database
  const loadSettings = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: savedSettings, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const initialSettings = new Map<string, CategoryPrivacy>();
      
      categories.forEach(cat => {
        const saved = savedSettings?.find(s => s.category === cat.id);
        initialSettings.set(cat.id, {
          ...cat,
          isPublic: saved?.is_public ?? true,
          anonymizationLevel: (saved?.anonymization_level as 'none' | 'partial' | 'full') ?? 'partial',
          allowedUseCases: saved?.allowed_uses ?? ['survey', 'research'],
        });
      });

      setPrivacySettings(initialSettings);
      
      // Update global toggle based on loaded settings
      const allPublic = Array.from(initialSettings.values())
        .filter(c => c.isConnected)
        .every(c => c.isPublic);
      setGlobalPublic(allPublic);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      toast.error('설정을 불러오는데 실패했습니다');
      
      // Initialize with defaults on error
      const initialSettings = new Map<string, CategoryPrivacy>();
      categories.forEach(cat => {
        initialSettings.set(cat.id, {
          ...cat,
          isPublic: true,
          anonymizationLevel: 'partial',
          allowedUseCases: ['survey', 'research'],
        });
      });
      setPrivacySettings(initialSettings);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, categories]);

  // Load settings on mount and when categories change
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save all settings to database
  const saveSettings = async () => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다');
      return;
    }

    try {
      setIsSaving(true);
      
      const settingsToSave = Array.from(privacySettings.values())
        .filter(cat => cat.isConnected)
        .map(cat => ({
          user_id: user.id,
          category: cat.id,
          is_public: cat.isPublic,
          anonymization_level: cat.anonymizationLevel,
          allowed_uses: cat.allowedUseCases,
        }));

      // Upsert each setting
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('privacy_settings')
          .upsert(setting, { 
            onConflict: 'user_id,category',
          });

        if (error) throw error;
      }

      toast.success('설정이 저장되었습니다');
      setHasChanges(false);
      onPrivacyChange?.(privacySettings);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      toast.error('설정 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublic = (categoryId: string) => {
    setPrivacySettings(prev => {
      const newSettings = new Map(prev);
      const current = newSettings.get(categoryId);
      if (current) {
        newSettings.set(categoryId, { ...current, isPublic: !current.isPublic });
      }
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleSetAnonymization = (categoryId: string, level: 'none' | 'partial' | 'full') => {
    setPrivacySettings(prev => {
      const newSettings = new Map(prev);
      const current = newSettings.get(categoryId);
      if (current) {
        newSettings.set(categoryId, { ...current, anonymizationLevel: level });
      }
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleToggleUseCase = (categoryId: string, useCaseId: string) => {
    setPrivacySettings(prev => {
      const newSettings = new Map(prev);
      const current = newSettings.get(categoryId);
      if (current) {
        const useCases = current.allowedUseCases.includes(useCaseId)
          ? current.allowedUseCases.filter(u => u !== useCaseId)
          : [...current.allowedUseCases, useCaseId];
        newSettings.set(categoryId, { ...current, allowedUseCases: useCases });
      }
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleGlobalToggle = (isPublic: boolean) => {
    setGlobalPublic(isPublic);
    setPrivacySettings(prev => {
      const newSettings = new Map(prev);
      newSettings.forEach((value, key) => {
        newSettings.set(key, { ...value, isPublic });
      });
      return newSettings;
    });
    setHasChanges(true);
  };

  // Calculate totals
  const publicCategories = Array.from(privacySettings.values()).filter(c => c.isPublic && c.isConnected);
  const totalPotentialEarnings = publicCategories.reduce((sum, c) => {
    const levelMultiplier = ANONYMIZATION_LEVELS.find(l => l.id === c.anonymizationLevel)?.multiplier || 1;
    return sum + Math.floor(c.vnValue * levelMultiplier);
  }, 0);
  const privacyScore = Math.floor(
    (publicCategories.filter(c => c.anonymizationLevel === 'full').length / Math.max(publicCategories.length, 1)) * 100
  );

  const connectedCategories = Array.from(privacySettings.values()).filter(c => c.isConnected);

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">설정을 불러오는 중...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 저장 버튼 영역 */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10"
        >
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm">저장되지 않은 변경사항이 있습니다</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSettings}
                  disabled={isSaving}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  되돌리기
                </Button>
                <Button
                  size="sm"
                  onClick={saveSettings}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 상단 요약 카드 */}
      <Card className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">개인정보 제어 센터</h3>
                <p className="text-xs text-muted-foreground">데이터 공개 범위를 직접 결정하세요</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">전체 공개</span>
              <Switch 
                checked={globalPublic} 
                onCheckedChange={handleGlobalToggle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/80 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">공개 카테고리</span>
              </div>
              <p className="text-lg font-bold">{publicCategories.length}개</p>
              <p className="text-xs text-muted-foreground">
                / {connectedCategories.length}개 연동됨
              </p>
            </div>
            <div className="bg-background/80 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">예상 월 수익</span>
              </div>
              <p className="text-lg font-bold text-primary">
                {totalPotentialEarnings.toLocaleString()} VN
              </p>
              <p className="text-xs text-muted-foreground">공개 설정 기준</p>
            </div>
          </div>

          {/* 프라이버시 점수 */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">프라이버시 보호 수준</span>
              <span className="text-sm font-medium">{privacyScore}%</span>
            </div>
            <Progress value={privacyScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              완전 익명화 데이터 비율이 높을수록 보호 수준이 높아집니다
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 카테고리별 상세 설정 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            카테고리별 공개 설정
            <Badge variant="outline" className="text-xs font-normal">
              {publicCategories.length}/{connectedCategories.length} 공개
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            각 데이터 카테고리별로 공개 여부와 익명화 수준을 설정하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {connectedCategories.map((cat) => {
              const Icon = cat.icon;
              const levelConfig = ANONYMIZATION_LEVELS.find(l => l.id === cat.anonymizationLevel);
              
              return (
                <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg px-3">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        cat.source === 'financial' 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : 'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          cat.source === 'financial' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium">{cat.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={cat.isPublic ? 'default' : 'secondary'}
                            className="text-xs h-5"
                          >
                            {cat.isPublic ? (
                              <><Eye className="w-3 h-3 mr-1" />공개</>
                            ) : (
                              <><EyeOff className="w-3 h-3 mr-1" />비공개</>
                            )}
                          </Badge>
                          {cat.isPublic && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs h-5 ${
                                levelConfig?.risk === 'low' ? 'border-green-200 text-green-600' :
                                levelConfig?.risk === 'medium' ? 'border-amber-200 text-amber-600' :
                                'border-red-200 text-red-600'
                              }`}
                            >
                              {levelConfig?.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right mr-2">
                        <p className="text-sm font-bold">
                          {Math.floor(cat.vnValue * (levelConfig?.multiplier || 1)).toLocaleString()} VN
                        </p>
                        <p className="text-xs text-muted-foreground">예상 수익</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-4 pt-2">
                      {/* 공개/비공개 토글 */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {cat.isPublic ? (
                            <Unlock className="w-4 h-4 text-green-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium">기업에게 공개</p>
                            <p className="text-xs text-muted-foreground">
                              {cat.isPublic ? '데이터 거래 시 수익 발생' : '데이터가 비공개 상태입니다'}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={cat.isPublic}
                          onCheckedChange={() => handleTogglePublic(cat.id)}
                        />
                      </div>

                      {cat.isPublic && (
                        <>
                          {/* 익명화 수준 */}
                          <div>
                            <p className="text-sm font-medium mb-2">익명화 수준</p>
                            <div className="grid grid-cols-3 gap-2">
                              {ANONYMIZATION_LEVELS.map(level => (
                                <button
                                  key={level.id}
                                  onClick={() => handleSetAnonymization(cat.id, level.id)}
                                  className={`p-2 rounded-lg border text-center transition-all ${
                                    cat.anonymizationLevel === level.id
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <p className="text-xs font-medium">{level.label}</p>
                                  <p className={`text-xs mt-0.5 ${
                                    level.risk === 'low' ? 'text-green-600' :
                                    level.risk === 'medium' ? 'text-amber-600' :
                                    'text-red-600'
                                  }`}>
                                    ×{level.multiplier} 수익
                                  </p>
                                </button>
                              ))}
                            </div>
                            {cat.anonymizationLevel === 'none' && (
                              <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-600 dark:text-red-400">
                                  원본 데이터 제공 시 개인정보가 그대로 노출될 수 있습니다. 
                                  높은 수익을 받지만 프라이버시 위험이 있습니다.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* 허용 용도 */}
                          <div>
                            <p className="text-sm font-medium mb-2">허용 용도</p>
                            <div className="space-y-2">
                              {USE_CASES.map(useCase => (
                                <div
                                  key={useCase.id}
                                  className="flex items-center justify-between p-2 rounded-lg border"
                                >
                                  <div>
                                    <p className="text-sm">{useCase.label}</p>
                                    <p className="text-xs text-muted-foreground">{useCase.description}</p>
                                  </div>
                                  <Switch
                                    checked={cat.allowedUseCases.includes(useCase.id)}
                                    onCheckedChange={() => handleToggleUseCase(cat.id, useCase.id)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {connectedCategories.length === 0 && (
            <div className="text-center py-8">
              <Lock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                연동된 데이터가 없습니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 안내 배너 */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                데이터 주권은 당신에게 있습니다
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                VeriNode에서는 어떤 데이터를 누구에게 공개할지 100% 당신이 결정합니다. 
                설정은 언제든지 변경할 수 있으며, 비공개로 전환하면 즉시 데이터 거래가 중단됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
