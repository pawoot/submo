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
import { useLanguage } from "@/contexts/LanguageContext";

type NotificationSettings = Database["public"]["Tables"]["notification_settings"]["Row"];
type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
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
        title: t("toast.errorLoading"),
        description: t("toast.errorLoadingDesc"),
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
        title: t("notif.saved"),
        description: t("notif.settingsSaved"),
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: t("common.error"),
        description: t("profile.error"),
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
          title: t("notif.pushEnabled"),
          description: t("notif.pushEnabledDesc"),
        });
      } else {
        toast({
          title: t("notif.pushError"),
          description: t("notif.pushDeniedDesc"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error enabling push:", error);
      toast({
        title: t("common.error"),
        description: t("notif.pushError"),
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
        title: t("common.success"),
        description: t("notif.markedAllRead"),
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: t("common.error"),
        description: t("toast.updateError"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast({
        title: t("notif.saved"),
        description: t("notif.deleted"),
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: t("common.error"),
        description: t("toast.deleteError"),
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

    if (diffInMinutes < 1) return t("time.justNow");
    if (diffInMinutes < 60) return `${diffInMinutes} ${t("time.minutesAgo")}`;
    if (diffInHours < 24) return `${diffInHours} ${t("time.hoursAgo")}`;
    if (diffInDays < 7) return `${diffInDays} ${t("time.daysAgo")}`;
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
        title={t("notif.title") + " - Submo.ai"}
        description={t("notif.pageDesc")}
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
              {t("notif.backToHome")}
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {t("notif.pageTitle")}
                </h1>
                <p className="text-gray-600">
                  {t("notif.pageDesc")}
                </p>
              </div>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  {unreadCount} {t("notif.new")}
                </Badge>
              )}
            </div>
          </div>

          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">
                <Bell className="w-4 h-4 mr-2" />
                {t("nav.settings")}
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="w-4 h-4 mr-2" />
                {t("notif.history")} ({notifications.length})
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
                      <CardTitle>{t("notif.email")}</CardTitle>
                      <CardDescription>
                        {t("notif.emailDesc")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_enabled" className="text-base font-medium">
                      {t("notif.enableEmail")}
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
                        <p className="text-sm font-medium text-gray-700">{t("notif.beforeDue")}</p>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_7_days_before">{t("notif.7days")}</Label>
                          <Switch
                            id="email_7_days_before"
                            checked={settings.email_7_days_before || false}
                            onCheckedChange={(checked) => handleSettingChange("email_7_days_before", checked)}
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_3_days_before">{t("notif.3days")}</Label>
                          <Switch
                            id="email_3_days_before"
                            checked={settings.email_3_days_before || false}
                            onCheckedChange={(checked) => handleSettingChange("email_3_days_before", checked)}
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_1_day_before">{t("notif.1day")}</Label>
                          <Switch
                            id="email_1_day_before"
                            checked={settings.email_1_day_before || false}
                            onCheckedChange={(checked) => handleSettingChange("email_1_day_before", checked)}
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_on_due_date">{t("notif.onDueDate")}</Label>
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
                        <p className="text-sm font-medium text-gray-700">{t("notif.otherNotifs")}</p>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_monthly_summary">{t("notif.monthlySummary")}</Label>
                          <Switch
                            id="email_monthly_summary"
                            checked={settings.email_monthly_summary || false}
                            onCheckedChange={(checked) => handleSettingChange("email_monthly_summary", checked)}
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email_price_changes">{t("notif.priceChanges")}</Label>
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
                      <CardTitle>{t("notif.push")}</CardTitle>
                      <CardDescription>
                        {t("notif.pushDesc")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!notificationService.isPushSupported() ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ {t("notif.pushUnsupported")}
                      </p>
                    </div>
                  ) : pushPermission === "denied" ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 mb-2">
                        🚫 {t("notif.pushDenied")}
                      </p>
                      <p className="text-xs text-red-600">
                        {t("notif.pushDeniedDesc")}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="push_enabled" className="text-base font-medium">
                            {t("notif.enablePush")}
                          </Label>
                          {pushPermission === "granted" && (
                            <p className="text-xs text-green-600 mt-1">✓ {t("notif.pushGranted")}</p>
                          )}
                        </div>
                        {pushPermission !== "granted" ? (
                          <Button onClick={handleEnablePush} size="sm">
                            {t("notif.enable")}
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
                            <p className="text-sm font-medium text-gray-700">{t("notif.beforeDue")}</p>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="push_7_days_before">{t("notif.7days")}</Label>
                              <Switch
                                id="push_7_days_before"
                                checked={settings.push_7_days_before || false}
                                onCheckedChange={(checked) => handleSettingChange("push_7_days_before", checked)}
                                disabled={saving}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="push_3_days_before">{t("notif.3days")}</Label>
                              <Switch
                                id="push_3_days_before"
                                checked={settings.push_3_days_before || false}
                                onCheckedChange={(checked) => handleSettingChange("push_3_days_before", checked)}
                                disabled={saving}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="push_1_day_before">{t("notif.1day")}</Label>
                              <Switch
                                id="push_1_day_before"
                                checked={settings.push_1_day_before || false}
                                onCheckedChange={(checked) => handleSettingChange("push_1_day_before", checked)}
                                disabled={saving}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="push_on_due_date">{t("notif.onDueDate")}</Label>
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
                      <CardTitle>{t("notif.preferences")}</CardTitle>
                      <CardDescription>
                        {t("notif.preferencesDesc")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="notification_time">
                      <Clock className="w-4 h-4 inline mr-2" />
                      {t("notif.time")}
                    </Label>
                    <input
                      type="time"
                      id="notification_time"
                      value={settings.notification_time || "09:00:00"}
                      onChange={(e) => handleSettingChange("notification_time", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500">
                      {t("notif.timeDesc")}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>
                      <Moon className="w-4 h-4 inline mr-2" />
                      {t("notif.quietHours")}
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quiet_hours_start" className="text-sm">{t("notif.start")}</Label>
                        <input
                          type="time"
                          id="quiet_hours_start"
                          value={settings.quiet_hours_start || ""}
                          onChange={(e) => handleSettingChange("quiet_hours_start", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quiet_hours_end" className="text-sm">{t("notif.end")}</Label>
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
                      {t("notif.quietHoursDesc")}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="timezone">
                      <Globe className="w-4 h-4 inline mr-2" />
                      {t("notif.timezone")}
                    </Label>
                    <input
                      type="text"
                      id="timezone"
                      value={settings.timezone || "UTC"}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      {t("notif.timezoneDesc")}
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
                      <CardTitle>{t("notif.historyTitle")}</CardTitle>
                      <CardDescription>
                        {t("notif.showing")} {notifications.length} {t("notif.recent")}
                      </CardDescription>
                    </div>
                    {unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                      >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        {t("notif.markAllRead")}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <BellOff className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-2">{t("notif.empty")}</p>
                      <p className="text-sm text-gray-400">
                        {t("notif.emptyDesc")}
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
                                  {notification.channel === "email" && `📧 ${t("notif.email")}`}
                                  {notification.channel === "push" && `📱 ${t("notif.push")}`}
                                  {notification.channel === "in_app" && `🔔 ${t("notif.inApp")}`}
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