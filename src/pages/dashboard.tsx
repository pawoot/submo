import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
import { AppShell } from "@/components/AppShell";
import { subscriptionService } from "@/services/subscriptionService";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Plus, 
  Bell,
  Settings,
  User,
  LogOut,
  Shield,
  Home,
  UserCircle,
  ArrowUpDown,
  Calendar as CalendarIcon,
  DollarSign,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import { InsightPanel } from "@/components/InsightPanel";
import { SavingsRecommendation } from "@/components/SavingsRecommendation";
import { SubscriptionCharts } from "@/components/SubscriptionCharts";
import { UpcomingRenewals } from "@/components/UpcomingRenewals";
import { TotalSpending } from "@/components/TotalSpending";
import { ConvertedCurrencyAmount } from "@/components/ConvertedCurrencyAmount";
import type { Database } from "@/integrations/supabase/types";
import Link from "next/link";

type ServiceSubscription = Awaited<ReturnType<typeof subscriptionService.getUserSubscriptions>>[number];
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc' | 'name-asc';

export default function Dashboard() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<ServiceSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sortOption, setSortOption] = useState<SortOption>('default');

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
        description:
          error instanceof Error
            ? error.message
            : typeof error === "object" && error && "message" in error && typeof error.message === "string"
              ? error.message
              : t("common.error_occurred"),
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
          ? t("subscriptions.reminderDisabled")
          : t("subscriptions.reminderEnabled")
      });
    } catch (error) {
      console.error("Error toggling reminder:", error);
      toast({
        title: t("common.error"),
        description: t("common.error_occurred"),
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

  // Sorting Logic
  const sortedSubscriptions = [...activeSubscriptions].sort((a, b) => {
    switch (sortOption) {
      case 'price-desc':
        return (b.amount || 0) - (a.amount || 0);
      case 'price-asc':
        return (a.amount || 0) - (b.amount || 0);
      case 'date-asc':
        // Next billing date: soonest first
        return new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime();
      case 'date-desc':
        // Next billing date: furthest first
        return new Date(b.next_billing_date).getTime() - new Date(a.next_billing_date).getTime();
      case 'name-asc':
        return a.name.localeCompare(b.name);
      default:
        // Default: usually by created_at desc or next_billing (original order from DB)
        return 0;
    }
  });

  const getSortLabel = () => {
    switch (sortOption) {
      case 'price-desc': return t("subscriptions.sortPriceHigh");
      case 'price-asc': return t("subscriptions.sortPriceLow");
      case 'date-asc': return t("subscriptions.sortNextBilling");
      case 'date-desc': return t("subscriptions.sortNextBillingDesc");
      case 'name-asc': return t("subscriptions.sortNameAZ");
      default: return t("subscriptions.sort");
    }
  };

  return (
    <AuthGuard>
      <SEO
        title={t("nav.dashboard")}
        description="จัดการ Subscriptions ของคุณ"
      />
      <AppShell
        user={user}
        isAdmin={isAdmin}
        unreadCount={unreadCount}
        desktopHeader={
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2.5" aria-label="Submo home">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-sm">
                    S
                  </span>
                  <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Submo<span className="text-base">.ai</span>
                  </span>
                </Link>
                <LanguageSwitcher />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/notifications")}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {t("nav.notifications")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/profile")}
                >
                  <User className="h-4 w-4 mr-2" />
                  {t("nav.profile")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("auth.signOut")}
                </Button>
              </div>
            </div>
          </div>
        }
      >

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold">
                    {t("subscription.all")} ({activeSubscriptions.length})
                  </h2>
                  
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto justify-between">
                          <span className="flex items-center">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            {getSortLabel()}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>{t("subscriptions.sort")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSortOption('date-asc')}>
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {t("subscriptions.sortNextBilling")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption('price-desc')}>
                          <ArrowDown className="w-4 h-4 mr-2" />
                          {t("subscriptions.sortPriceHigh")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption('price-asc')}>
                          <ArrowUp className="w-4 h-4 mr-2" />
                          {t("subscriptions.sortPriceLow")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption('name-asc')}>
                          <span className="w-4 h-4 mr-2 font-bold text-xs flex items-center justify-center">AZ</span>
                          {t("subscriptions.sortNameAZ")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button 
                      size="sm"
                      onClick={() => router.push("/add-subscription")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("subscription.add")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {sortedSubscriptions.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">{t("subscriptions.empty")}</p>
                      <Button onClick={() => router.push("/add-subscription")}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t("subscription.add")}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {sortedSubscriptions.map(sub => (
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
                                  {t(sub.billing_cycle === "yearly" ? "subscription.yearly" : "subscription.monthly")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <ConvertedCurrencyAmount
                              amount={sub.amount}
                              currency={sub.currency}
                              className="font-bold"
                            />
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
      </AppShell>
    </AuthGuard>
  );
}
