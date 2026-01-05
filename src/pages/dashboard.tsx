import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SEO from "@/components/SEO";
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
import { subscriptionService } from "@/services/subscriptionService";
import { authService } from "@/services/authService";
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
  Shield
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import { InsightPanel } from "@/components/InsightPanel";
import { SavingsRecommendation } from "@/components/SavingsRecommendation";
import { SubscriptionCharts } from "@/components/SubscriptionCharts";
import { UpcomingRenewals } from "@/components/UpcomingRenewals";
import { TotalSpending } from "@/components/TotalSpending";
import type { Database } from "@/integrations/supabase/types";

type ServiceSubscription = Awaited<ReturnType<typeof subscriptionService.getUserSubscriptions>>[number];

export default function Dashboard() {
  const router = useRouter();
  const { preferredCurrency, convertAmount, formatPrice } = useCurrency();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(key as any, language);

  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<ServiceSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
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
        description={t("dashboard.subtitle")}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="border-b bg-white dark:bg-gray-800 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <rect x="3" y="3" width="18" height="18" rx="3" fill="white"/>
                    <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Submo</h1>
                  <p className="text-sm text-muted-foreground">Subscription Monitoring</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Admin Button */}
                {user?.is_admin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin")}
                    className="gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </Button>
                )}
                
                {/* Notification Bell */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => router.push("/notifications")}
                >
                  <Bell className="w-5 h-5" />
                </Button>
                
                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.avatar_url} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.full_name || t("common.user")}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>{t("nav.profile")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{t("common.settings")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t("auth.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Add Subscription Button */}
                <Button onClick={() => router.push("/add-subscription")}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("subscription.add")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-6">
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
        </div>
      </div>
    </AuthGuard>
  );
}