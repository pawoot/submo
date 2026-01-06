import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  ArrowLeft, 
  Loader2, 
  Check, 
  CheckCheck, 
  Trash2,
  Calendar,
  DollarSign,
  Info,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService } from "@/services/authService";
import { notificationService } from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

interface NotificationWithSubscription extends Notification {
  subscriptions?: {
    name: string;
    amount: number;
    currency: string;
  } | null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationWithSubscription[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        setUser(currentUser);

        const notifData = await notificationService.getNotifications();
        setNotifications(notifData || []);
      } catch (error) {
        console.error("Error loading notifications:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลการแจ้งเตือนได้",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast, router]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );

      toast({
        title: "สำเร็จ",
        description: "ทำเครื่องหมายว่าอ่านแล้ว"
      });
    } catch (error) {
      console.error("Error marking as read:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะได้",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );

      toast({
        title: "สำเร็จ",
        description: "ทำเครื่องหมายอ่านทั้งหมดแล้ว"
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะได้",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

      toast({
        title: "สำเร็จ",
        description: "ลบการแจ้งเตือนแล้ว"
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบการแจ้งเตือนได้",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "renewal_reminder":
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case "payment_due":
        return <DollarSign className="h-5 w-5 text-orange-600" />;
      case "price_change":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-slate-600" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "renewal_reminder":
        return "เตือนต่ออายุ";
      case "payment_due":
        return "ครบกำหนดชำระ";
      case "price_change":
        return "ราคาเปลี่ยนแปลง";
      default:
        return "ทั่วไป";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "unread") return !notif.is_read;
    if (filter === "read") return notif.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <SEO 
        title="การแจ้งเตือน - Submo.ai"
        description="จัดการการแจ้งเตือนของคุณ"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                className="rounded-full hover:bg-white/80 dark:hover:bg-slate-800/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
                  <div className="relative">
                    <Bell className="h-8 w-8 text-blue-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  การแจ้งเตือน
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  จัดการการแจ้งเตือนทั้งหมดของคุณ
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                อ่านทั้งหมด
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="all">
                ทั้งหมด ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                ยังไม่อ่าน ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                อ่านแล้ว ({notifications.length - unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Mark All as Read Button (Mobile) */}
          {unreadCount > 0 && (
            <div className="sm:hidden mb-4">
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                อ่านทั้งหมด
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200 dark:border-slate-800">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Bell className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 text-center">
                    {filter === "unread" && "ไม่มีการแจ้งเตือนที่ยังไม่อ่าน"}
                    {filter === "read" && "ไม่มีการแจ้งเตือนที่อ่านแล้ว"}
                    {filter === "all" && "ยังไม่มีการแจ้งเตือน"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notif) => (
                <Card 
                  key={notif.id} 
                  className={`
                    group transition-all duration-200 hover:shadow-lg
                    ${!notif.is_read 
                      ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900" 
                      : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                    }
                    backdrop-blur-sm
                  `}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notif.notification_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold ${!notif.is_read ? "text-slate-900 dark:text-slate-50" : "text-slate-700 dark:text-slate-300"}`}>
                              {notif.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {getNotificationTypeLabel(notif.notification_type)}
                            </Badge>
                            {!notif.is_read && (
                              <Badge className="bg-blue-600 text-white text-xs">
                                ใหม่
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {notif.message}
                        </p>

                        {/* Subscription Info */}
                        {notif.subscriptions && (
                          <div className="text-xs text-slate-500 dark:text-slate-500 mb-3 p-2 bg-slate-100/50 dark:bg-slate-800/50 rounded">
                            📦 {notif.subscriptions.name} • {notif.subscriptions.amount.toLocaleString()} {notif.subscriptions.currency}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          {/* Timestamp */}
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {new Date(notif.sent_at || notif.created_at).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!notif.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="h-8 px-2 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                อ่านแล้ว
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(notif.id)}
                              className="h-8 px-2 text-xs hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
}