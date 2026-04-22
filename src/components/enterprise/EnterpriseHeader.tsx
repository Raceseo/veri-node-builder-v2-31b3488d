import { Bell, Building2, Coins, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useNotifications } from '@/hooks/useNotifications';

const EnterpriseHeader = () => {
  const { profile, vnBalance } = useProfileContext();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const companyName = profile?.company || '기업 계정';

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
      {/* 좌측: 기업명 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-white">{companyName}</h2>
          <p className="text-xs text-slate-400">데이터 구매 대시보드</p>
        </div>
      </div>

      {/* 우측: VN 잔액, 알림 */}
      <div className="flex items-center gap-4">
        {/* VN 잔액 */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">
            {vnBalance.toLocaleString()} VN
          </span>
          <Button size="sm" variant="outline" className="ml-2 h-7 text-xs border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
            충전
          </Button>
        </div>

        {/* 알림 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-700">
            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
              <span className="font-semibold text-white">알림</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  모두 읽음
                </Button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  알림이 없습니다
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-3 cursor-pointer ${
                      !notification.is_read ? 'bg-slate-800/50' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{notification.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 프로필 드롭다운 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {companyName.charAt(0)}
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
            <DropdownMenuItem className="text-slate-300">
              계정 설정
            </DropdownMenuItem>
            <DropdownMenuItem className="text-slate-300">
              결제 수단 관리
            </DropdownMenuItem>
            <DropdownMenuItem className="text-slate-300">
              팀 멤버 관리
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default EnterpriseHeader;
