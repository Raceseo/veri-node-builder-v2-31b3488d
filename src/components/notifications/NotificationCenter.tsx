import { Bell, Check, CheckCheck, Coins, ShoppingBag, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_buyer':
      return <ShoppingBag className="w-5 h-5 text-blue-500" />;
    case 'revenue':
    case 'reward':
      return <Coins className="w-5 h-5 text-yellow-500" />;
    case 'sale_complete':
    case 'approval_completed':
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    case 'approval_request':
      return <Bell className="w-5 h-5 text-orange-500" />;
    case 'approval_rejected':
      return <X className="w-5 h-5 text-red-500" />;
    default:
      return <Bell className="w-5 h-5 text-muted-foreground" />;
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div
      className={cn(
        'p-4 border-b last:border-b-0 transition-colors',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 rounded-full bg-muted">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn('text-sm font-medium', !notification.is_read && 'text-primary')}>
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
            </div>
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-8 w-8"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter = () => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center text-xs px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              알림
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}개 안읽음
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                <CheckCheck className="w-4 h-4 mr-1" />
                모두 읽음
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">알림이 없습니다</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                데이터 판매 시 알림을 받게 됩니다
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
