import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ArrowLeft, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService } from "@/services/authService";
import { notificationService } from "@/services/notificationService";
import { subscriptionService } from "@/services/subscriptionService";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type Notification = Database["public"]["Tables"]["notifications"]["Row"];

interface SubscriptionWithReminder extends Subscription {
  reminder_enabled: boolean;
  reminder_days: number;
  next_reminder_date: string;
  nextRenewalDate: string;
  daysUntilRenewal: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithReminder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        const [notifData, subsData] = await Promise.all([
          notificationService.getNotifications(),
          subscriptionService.getUserSubscriptions()
        ]);

        setNotifications(notifData || []);
        
        if (!subsData || subsData.length === 0) {
          setSubscriptions([]);
          setLoading(false);
          return;
        }

        // MINIMAL PROCESSING - Use safe values
        const processed = subsData.map(sub => {
          // Safe synchronous calculation
          const nextRenewal = subscriptionService.getNextRenewalDate(
             sub.billing_cycle || "monthly", 
             sub.next_billing_date
          );
          
          // 2. Calculate renewal dates (now synchronous)
          const now = new Date();
          const renewalDate = new Date(nextRenewal);
          const daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          return {
            ...sub,
            reminder_enabled: sub.reminder_enabled || false,
            reminder_days: sub.reminder_days || 7,
            next_reminder_date: sub.next_billing_date,
            nextRenewalDate: nextRenewal,
            daysUntilRenewal: daysUntil
          };
        });

        setSubscriptions(processed);
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
  }, [toast]);

  const toggleReminder = async (subscriptionId: string, currentState: boolean) => {
    try {
      await subscriptionService.updateSubscription(subscriptionId, {
        reminder_enabled: !currentState
      });

      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscriptionId
            ? { ...sub, reminder_enabled: !currentState }
            : sub
        )
      );

      toast({
        title: "สำเร็จ",
        description: !currentState ? "เปิดการแจ้งเตือนแล้ว" : "ปิดการแจ้งเตือนแล้ว"
      });
    } catch (error) {
      console.error("Error toggling reminder:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตการแจ้งเตือนได้",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeReminders = subscriptions.filter(sub => sub.reminder_enabled);

  return (
    <>
      <SEO 
        title="การแจ้งเตือน - Submo.ai"
        description="จัดการการแจ้งเตือนของคุณ"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Bell className="h-8 w-8 text-blue-600" />
                  การแจ้งเตือน
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  จัดการการแจ้งเตือนการต่ออายุของคุณ
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="active">
                การแจ้งเตือนที่เปิดใช้งาน ({activeReminders.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                ประวัติการแจ้งเตือน ({notifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeReminders.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Bell className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 text-center">
                      ไม่มีการแจ้งเตือนที่เปิดใช้งาน
                    </p>
                  </CardContent>
                </Card>
              ) : (
                activeReminders.map((sub) => (
                  <Card key={sub.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{sub.name}</span>
                        <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
                          ใน {sub.daysUntilRenewal} วัน
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            วันต่ออายุถัดไป
                          </p>
                          <p className="font-medium">
                            {new Date(sub.nextRenewalDate).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => toggleReminder(sub.id, sub.reminder_enabled)}
                        >
                          ปิดการแจ้งเตือน
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Bell className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 text-center">
                      ยังไม่มีประวัติการแจ้งเตือน
                    </p>
                  </CardContent>
                </Card>
              ) : (
                notifications.map((notif) => (
                  <Card key={notif.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notif.title}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(notif.created_at).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}