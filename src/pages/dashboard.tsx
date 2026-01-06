import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MobileHeader from "@/components/MobileHeader";
import { subscriptionService } from "@/services/subscriptionService";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { formatCurrency } from "@/lib/utils";
import { 
  Plus, 
  Bell,
  Settings,
  User,
  LogOut,
  Shield,
  Home,
  UserCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import { InsightPanel } from "@/components/InsightPanel";
import { SavingsRecommendation } from "@/components/SavingsRecommendation";
import { SubscriptionCharts } from "@/components/SubscriptionCharts";
import { UpcomingRenewals } from "@/components/UpcomingRenewals";
import { TotalSpending } from "@/components/TotalSpending";
import type { Database } from "@/integrations/supabase/types";
import Link from "next/link";

type ServiceSubscription = Awaited<ReturnType<typeof subscriptionService.getUserSubscriptions>>[number];

export default function Dashboard() {
  const router = useRouter();
  const { preferredCurrency, convertAmount, formatPrice } = useCurrency();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(key as any, language);

  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<ServiceSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();
    loadUserData();
    loadUnreadNotifications();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [currentUser, subsData] = await Promise.all([
        authService.getCurrentUser(),
        subscriptionService.getUserSubscriptions()
      ]);
      
      setUser(currentUser);
      setSubscriptions(subsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role, is_admin")
          .eq("id", currentUser.id)
          .single();
        
        if (profileData?.role === 'admin' || profileData?.is_admin === true) {
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id)
          .eq("is_read", false);
        
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleToggleReminder = async (id: string, currentEnabled: boolean) => {
    try {
      await subscriptionService.updateSubscription(id, {
        reminder_enabled: !currentEnabled
      });
      
      // Reload data
      await loadData();
      
      toast({
        title: t("common.success"),
        description: currentEnabled 
          ? t("subscription.reminderDisabled")
          : t("subscription.reminderEnabled")
      });
    } catch (error) {
      console.error("Error toggling reminder:", error);
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.is_active);

  return (
    <AuthGuard>
      <SEO
        title={t("nav.dashboard")}
        description="จัดการ Subscriptions ของคุณ"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Mobile Header */}
        <MobileHeader
          user={user}
          isAdmin={isAdmin}
          unreadCount={unreadCount}
        />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Main 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Insight Panel */}
                <InsightPanel 
                  subscriptions={subscriptions}
                  onToggleReminder={handleToggleReminder}
                />
                
                {/* Total Spending */}
                <TotalSpending subscriptions={subscriptions} />
                
                {/* Subscription Charts */}
                <SubscriptionCharts />
              </div>

              {/* Right Column (1/3 width) */}
              <div className="space-y-6">
                {/* Savings Recommendation */}
                <SavingsRecommendation 
                  subscriptions={subscriptions}
                  onToggleReminder={handleToggleReminder}
                />
                
                {/* Upcoming Renewals */}
                <UpcomingRenewals subscriptions={subscriptions} />
              </div>
            </div>

            {/* Subscription List */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    {t("subscription.all")} ({activeSubscriptions.length})
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push("/add-subscription")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("subscription.add")}
                  </Button>
                </div>

                <div className="space-y-4">
                  {activeSubscriptions.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">{t("subscription.noSubscriptions")}</p>
                      <Button onClick={() => router.push("/add-subscription")}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t("subscription.addFirst")}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {activeSubscriptions.map(sub => (
                        <div 
                          key={sub.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:border-primary cursor-pointer transition-colors bg-card"
                          onClick={() => router.push(`/edit-subscription/${sub.id}`)}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <SubscriptionIcon
                              name={sub.name}
                              iconUrl={sub.icon_url}
                              websiteUrl={sub.website_url}
                              size="md"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{sub.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {sub.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {sub.category}
                                  </Badge>
                                )}
                                <span className="text-sm text-muted-foreground">
                                  {t(`subscription.${sub.billing_cycle}`)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="font-bold">{formatCurrency(sub.amount, sub.currency)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(sub.next_billing_date).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}