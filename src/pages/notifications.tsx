import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SEO from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import { notificationService } from "@/services/notificationService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Moon, 
  Globe,
  ArrowLeft,
  Check,
  Trash2,
  BellOff,
  CheckCheck,
  Loader2
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type NotificationSettings = Database["public"]["Tables"]["notification_settings"]["Row"];
type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    loadData();
    checkPushPermission();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, notificationsData, unreadCountData] = await Promise.all([
        notificationService.getSettings(),
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setSettings(settingsData);
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPushPermission = () => {
    const permission = notificationService.getPushPermission();
    setPushPermission(permission);
  };

  const handleSettingChange = async (field: keyof NotificationSettings, value: boolean | string) => {
    if (!settings) return;

    try {
      setSaving(true);
      const updatedSettings = await notificationService.updateSettings({
        [field]: value,
      });
      setSettings(updatedSettings);
      toast({
        title: "✅ บันทึกสำเร็จ",
        description: "การตั้งค่าถูกบันทึกเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      const granted = await notificationService.requestPushPermission();
      if (granted) {
        await handleSettingChange("push_enabled", true);
        checkPushPermission();
        toast({
          title: "✅ เปิดใช้งาน Push Notifications",
          description: "คุณจะได้รับการแจ้งเตือนบนเบราว์เซอร์",
        });
      } else {
        toast({
          title: "ไม่สามารถเปิดใช้งานได้",
          description: "กรุณาอนุญาตการแจ้งเตือนในการตั้งค่าเบราว์เซอร์",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error enabling push:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเปิดใช้งาน Push Notifications ได้",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast({
        title: "✅ ทำเครื่องหมายทั้งหมดแล้ว",
        description: "ทำเครื่องหมายว่าอ่านแล้วทั้งหมด",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถทำเครื่องหมายได้",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast({
        title: "✅ ลบสำเร็จ",
        description: "ลบการแจ้งเตือนเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบการแจ้งเตือนได้",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return "เมื่อสักครู่";
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`;
    return date.toLocaleDateString("th-TH", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "billing_reminder": return "💰";
      case "due_date": return "📅";
      case "price_change": return "💵";
      case "monthly_summary": return "📊";
      default: return "🔔";
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </AuthGuard>
    );
  }

  if (!settings) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <p>ไม่พบข้อมูลการตั้งค่า</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <SEO 
        title="การตั้งค่าการแจ้งเตือน | Subscription Manager"
        description="จัดการการตั้งค่าการแจ้งเตือนและประวัติการแจ้งเตือน"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปหน้าหลัก
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  การตั้งค่าการแจ้งเตือน
                </h1>
                <p className="text-gray-600">
                  จัดการการแจ้งเตือนและดูประวัติการแจ้งเตือนทั้งหมด
                </p>
              </div>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  {unreadCount} ใหม่
                </Badge>
              )}
            </div>
          </div>

          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">
                <Bell className="w-4 h-4 mr-2" />
                ตั้งค่า
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="w-4 h-4 mr-2" />
                ประวัติ ({notifications.length})
              </TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              {/* Email Notifications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>การแจ้งเตือนทางอีเมล</CardTitle>
                      <CardDescription>
                        รับการแจ้งเตือนผ่านอีเมลของคุณ
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_enabled" className="text-base font-medium">
                      เปิดใช้งานการแจ้งเตือนทางอีเมล
                    </Label>
                    <Switch
                      id="email_enabled"
                      checked={settings.email_enabled || false}
                      onCheckedChange={(checked) => handleSettingChange("email_enabled", checked)}
                      disabled={saving}
                    />
                  </div>

                  {settings.email_enabled && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-gray-700">แจ้งเตือนก่อนครบกำหนดชำระ:</p>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_7_days_before">7 วันก่อนครบกำหนด</Label>
                          <Switch
                            id="email_7_days_before"
                            checked={settings.email_7_days_before || false}
                            onCheckedChange={(checked) => handleSettingChange("email_7_days_before", checked)}
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_3_days_before">3 วันก่อนครบกำหนด</Label>
                          <Switch
                            id="email_3_days_before"
                            checked={settings.email_3_days_before || false}
                            onCheckedChange={(checked) => handleSettingChange("email_3_days_before", checked)}
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_1_day_before">1 วันก่อนครบกำหนด</Label>
                          <Switch
                            id="email_1_day_before"
                            checked={settings.email_1_day_before || false}
                            onCheckedChange={(checked) => handleSettingChange("email_1_day_before", checked)}
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_on_due_date">วันครบกำหนด</Label>
                          <Switch
                            id="email_on_due_date"
                            checked={settings.email_on_due_date || false}
                            onCheckedChange={(checked) => handleSettingChange("email_on_due_date", checked)}
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <p className="text-sm font-medium text-gray-700">การแจ้งเตือนอื่นๆ:</p>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_monthly_summary">สรุปรายเดือน</Label>
                          <Switch
                            id="email_monthly_summary"
                            checked={settings.email_monthly_summary || false}
                            onCheckedChange={(checked) => handleSettingChange("email_monthly_summary", checked)}
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_price_changes">การเปลี่ยนแปลงราคา</Label>
                          <Switch
                            id="email_price_changes"
                            checked={settings.email_price_changes || false}
                            onCheckedChange={(checked) => handleSettingChange("email_price_changes", checked)}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Push Notifications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Push Notifications</CardTitle>
                      <CardDescription>
                        รับการแจ้งเตือนบนเบราว์เซอร์แบบ Real-time
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!notificationService.isPushSupported() ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ เบราว์เซอร์ของคุณไม่รองรับ Push Notifications
                      </p>
                    </div>
                  ) : pushPermission === "denied" ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 mb-2">
                        🚫 คุณได้ปิดการอนุญาต Push Notifications
                      </p>
                      <p className="text-xs text-red-600">
                        กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="push_enabled" className="text-base font-medium">
                            เปิดใช้งาน Push Notifications
                          </Label>
                          {pushPermission === "granted" && (
                            <p className="text-xs text-green-600 mt-1">✓ ได้รับอนุญาตแล้ว</p>
                          )}
                        </div>
                        {pushPermission !== "granted" ? (
                          <Button onClick={handleEnablePush} size="sm">
                            เปิดใช้งาน
                          </Button>
                        ) : (
                          <Switch
                            id="push_enabled"
                            checked={settings.push_enabled || false}
                            onCheckedChange={(checked) => handleSettingChange("push_enabled", checked)}
                            disabled={saving}
                          />
                        )}
                      </div>

                      {settings.push_enabled && (
                        <>
                          <Separator />
                          <div className="space-y-4">
                            <p className="text-sm font-medium text-gray-700">แจ้งเตือนก่อนครบกำหนดชำระ:</p>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="push_7_days_before">7 วันก่อนครบกำหนด</Label>
                              <Switch
                                id="push_7_days_before"
                                checked={settings.push_7_days_before || false}
                                onCheckedChange={(checked) => handleSettingChange("push_7_days_before", checked)}
                                disabled={saving}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="push_3_days_before">3 วันก่อนครบกำหนด</Label>
                              <Switch
                                id="push_3_days_before"
                                checked={settings.push_3_days_before || false}
                                onCheckedChange={(checked) => handleSettingChange("push_3_days_before", checked)}
                                disabled={saving}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="push_1_day_before">1 วันก่อนครบกำหนด</Label>
                              <Switch
                                id="push_1_day_before"
                                checked={settings.push_1_day_before || false}
                                onCheckedChange={(checked) => handleSettingChange("push_1_day_before", checked)}
                                disabled={saving}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="push_on_due_date">วันครบกำหนด</Label>
                              <Switch
                                id="push_on_due_date"
                                checked={settings.push_on_due_date || false}
                                onCheckedChange={(checked) => handleSettingChange("push_on_due_date", checked)}
                                disabled={saving}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle>ความชอบการแจ้งเตือน</CardTitle>
                      <CardDescription>
                        ตั้งค่าเวลาและช่วงเวลาการแจ้งเตือน
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="notification_time">
                      <Clock className="w-4 h-4 inline mr-2" />
                      เวลาที่ต้องการรับการแจ้งเตือน
                    </Label>
                    <input
                      type="time"
                      id="notification_time"
                      value={settings.notification_time || "09:00:00"}
                      onChange={(e) => handleSettingChange("notification_time", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500">
                      การแจ้งเตือนจะถูกส่งในช่วงเวลาที่กำหนด
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>
                      <Moon className="w-4 h-4 inline mr-2" />
                      Quiet Hours (ช่วงเวลาไม่รับการแจ้งเตือน)
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quiet_hours_start" className="text-sm">เริ่ม</Label>
                        <input
                          type="time"
                          id="quiet_hours_start"
                          value={settings.quiet_hours_start || ""}
                          onChange={(e) => handleSettingChange("quiet_hours_start", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quiet_hours_end" className="text-sm">สิ้นสุด</Label>
                        <input
                          type="time"
                          id="quiet_hours_end"
                          value={settings.quiet_hours_end || ""}
                          onChange={(e) => handleSettingChange("quiet_hours_end", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      ในช่วงเวลานี้จะไม่มีการแจ้งเตือน (ถ้าไม่ระบุจะรับการแจ้งเตือนตลอด 24 ชม.)
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="timezone">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Timezone
                    </Label>
                    <input
                      type="text"
                      id="timezone"
                      value={settings.timezone || "UTC"}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      Timezone จะถูกตั้งค่าอัตโนมัติตามเบราว์เซอร์ของคุณ
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>ประวัติการแจ้งเตือน</CardTitle>
                      <CardDescription>
                        แสดง {notifications.length} รายการล่าสุด
                      </CardDescription>
                    </div>
                    {unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                      >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        ทำเครื่องหมายทั้งหมด
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <BellOff className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-2">ยังไม่มีการแจ้งเตือน</p>
                      <p className="text-sm text-gray-400">
                        การแจ้งเตือนจะแสดงที่นี่เมื่อคุณได้รับ
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border transition-all ${
                            notification.is_read
                              ? "bg-white border-gray-200"
                              : "bg-blue-50 border-blue-300"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-2xl flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-medium text-gray-900">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {!notification.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{formatDate(notification.sent_at)}</span>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {notification.channel === "email" && "📧 Email"}
                                  {notification.channel === "push" && "📱 Push"}
                                  {notification.channel === "in_app" && "🔔 In-App"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}