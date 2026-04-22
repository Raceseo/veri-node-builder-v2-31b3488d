import { useState } from 'react';
import { Building2, Users, CreditCard, Bell, Shield, FileText, Mail, Phone, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// 샘플 팀 멤버
const sampleTeamMembers = [
  { id: '1', name: '김대표', email: 'ceo@company.com', role: 'admin', department: '경영진' },
  { id: '2', name: '이마케터', email: 'marketing@company.com', role: 'member', department: '마케팅' },
  { id: '3', name: '박분석', email: 'analyst@company.com', role: 'member', department: '데이터분석' },
];

const EnterpriseSettingsTab = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    purchaseComplete: true,
    subscriptionRenewal: true,
    newDataAvailable: false,
  });

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-white">설정</h1>
        <p className="text-slate-400 mt-1">기업 계정 및 팀 설정을 관리하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 좌측: 기업 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기업 정보 */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                기업 정보
              </CardTitle>
              <CardDescription className="text-slate-400">
                세금계산서 발행에 사용되는 정보입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">회사명</Label>
                  <Input 
                    defaultValue="주식회사 데이터인사이트" 
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">사업자등록번호</Label>
                  <Input 
                    defaultValue="123-45-67890" 
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">대표자명</Label>
                  <Input 
                    defaultValue="김대표" 
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">업종</Label>
                  <Input 
                    defaultValue="정보통신업" 
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">사업장 주소</Label>
                <Input 
                  defaultValue="서울특별시 강남구 테헤란로 123" 
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">세금계산서 수신 이메일</Label>
                <Input 
                  defaultValue="tax@company.com" 
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                정보 저장
              </Button>
            </CardContent>
          </Card>

          {/* 팀 멤버 관리 */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    팀 멤버
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    데이터 구매 권한이 있는 팀원을 관리합니다
                  </CardDescription>
                </div>
                <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  멤버 초대
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleTeamMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{member.name}</p>
                        <p className="text-sm text-slate-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className="border-slate-600 text-slate-300"
                      >
                        {member.department}
                      </Badge>
                      <Badge 
                        className={member.role === 'admin' 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }
                      >
                        {member.role === 'admin' ? '관리자' : '멤버'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-slate-400 hover:text-white"
                      >
                        편집
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 결제 수단 */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                결제 수단
              </CardTitle>
              <CardDescription className="text-slate-400">
                데이터 구매에 사용할 결제 수단을 등록하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 등록된 카드 */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">**** **** **** 1234</p>
                      <p className="text-sm text-slate-400">만료: 12/26</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    기본
                  </Badge>
                </div>
              </div>
              
              <Button variant="outline" className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" />
                새 결제 수단 추가
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 우측: 알림 설정 */}
        <div className="space-y-6">
          {/* 알림 설정 */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">이메일 알림</Label>
                  <Switch 
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">푸시 알림</Label>
                  <Switch 
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
                  />
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-400">알림 받을 항목</p>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">구매 완료</Label>
                  <Switch 
                    checked={notifications.purchaseComplete}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, purchaseComplete: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">구독 갱신 알림</Label>
                  <Switch 
                    checked={notifications.subscriptionRenewal}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, subscriptionRenewal: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm">신규 데이터 알림</Label>
                  <Switch 
                    checked={notifications.newDataAvailable}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newDataAvailable: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 보안 */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                보안
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 justify-start">
                비밀번호 변경
              </Button>
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 justify-start">
                2단계 인증 설정
              </Button>
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 justify-start">
                로그인 기록 확인
              </Button>
            </CardContent>
          </Card>

          {/* 법적 문서 */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                법적 문서
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white">
                이용약관
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white">
                개인정보처리방침
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white">
                데이터 이용 동의서
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseSettingsTab;
