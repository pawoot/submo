import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SEO from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import MobileNav from "@/components/MobileNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { subscriptionService } from "@/services/subscriptionService";
import { authService } from "@/services/authService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { formatCurrency } from "@/lib/utils";
import { 
  Plus, 
  Search,
  Bell,
  Calendar,
  TrendingUp,
  DollarSign,
  CheckCircle,
  CheckCircle2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import { SubscriptionCharts } from "@/components/SubscriptionCharts";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [upcomingPayments, setUpcomingPayments] = useState<ServiceSubscription[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [subscriptions, preferredCurrency]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [currentUser, subsData] = await Promise.all([
        authService.getCurrentUser(),
        subscriptionService.getUserSubscriptions()
      ]);
      
      setUser(currentUser);
      setSubscriptions(subsData || []);
      
      // Calculate upcoming payments (next 30 days)
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const upcoming = (subsData || [])
        .filter(sub => {
          const nextBilling = new Date(sub.next_billing_date);
          return sub.is_active && nextBilling >= now && nextBilling <= thirtyDaysLater;
        })
        .sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime());
      
      setUpcomingPayments(upcoming);
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

  const calculateStats = async () => {
    const activeSubscriptions = subscriptions.filter(s => s.is_active);
    
    let monthlyTotal = 0;
    
    for (const sub of activeSubscriptions) {
      const price = sub.amount || 0;
      const currency = sub.currency || "THB";
      
      const priceInPreferred = await convertAmount(price, currency);
      
      let monthlyCost = priceInPreferred;
      if (sub.billing_cycle === "yearly") {
        monthlyCost = priceInPreferred / 12;
      } else if (sub.billing_cycle === "quarterly") {
        monthlyCost = priceInPreferred / 3;
      } else if (sub.billing_cycle === "half-yearly") {
        monthlyCost = priceInPreferred / 6;
      }
      
      monthlyTotal += monthlyCost;
    }
    
    setTotalMonthly(monthlyTotal);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (searchQuery && !sub.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const activeSubscriptions = filteredSubscriptions.filter(s => s.is_active);
  const activeCount = activeSubscriptions.length;

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

  return (
    <AuthGuard>
      <SEO
        title={t("nav.dashboard")}
        description={t("dashboard.subtitle")}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader user={user} />
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block border-b bg-white dark:bg-gray-800">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Submo</h1>
                <p className="text-sm text-muted-foreground">Subscription Monitoring</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="w-5 h-5" />
                </Button>
                <Button onClick={() => router.push("/add-subscription")}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("subscription.add")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats & Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search & Quick Stats */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("common.search")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t("dashboard.today")}</p>
                      <p className="text-2xl font-bold">฿0</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t("dashboard.thisWeek")}</p>
                      <p className="text-2xl font-bold">฿0</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t("dashboard.thisMonth")}</p>
                      <p className="text-2xl font-bold">{formatPrice(totalMonthly)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Total */}
              <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 mb-2">{t("dashboard.monthlyTotal")}</p>
                      <p className="text-4xl font-bold">{formatPrice(totalMonthly)}</p>
                      <p className="text-sm opacity-90 mt-2">{t("dashboard.perMonth")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm">
                        {t("common.details")}
                      </Button>
                      <Button variant="secondary" size="icon">
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t("dashboard.spendingByCategory")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SubscriptionCharts />
                </CardContent>
              </Card>

              {/* All Subscriptions List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t("subscription.all")} ({activeCount})</CardTitle>
                    <Button variant="outline" size="sm">
                      {t("common.sortBy")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeSubscriptions.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground mb-4">{t("subscription.noSubscriptions")}</p>
                        <Button onClick={() => router.push("/add-subscription")}>
                          <Plus className="w-4 h-4 mr-2" />
                          {t("subscription.addFirst")}
                        </Button>
                      </div>
                    ) : (
                      activeSubscriptions.map(sub => (
                        <div 
                          key={sub.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:border-primary cursor-pointer transition-colors"
                          onClick={() => router.push(`/edit-subscription/${sub.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <SubscriptionIcon
                              name={sub.name}
                              iconUrl={sub.icon_url}
                              websiteUrl={sub.website_url}
                              size="md"
                            />
                            <div>
                              <h3 className="font-semibold">{sub.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {t(`subscription.${sub.billing_cycle}`)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(sub.amount, sub.currency)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(sub.next_billing_date).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Upcoming Payments & Active Subscriptions */}
            <div className="space-y-6">
              {/* Upcoming Payments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    {t("subscription.upcomingPayments")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingPayments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("subscription.noUpcomingPayments")}
                      </p>
                    ) : (
                      upcomingPayments.map(sub => {
                        const nextBilling = new Date(sub.next_billing_date);
                        const daysUntil = Math.ceil((nextBilling.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div key={sub.id} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{sub.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {daysUntil === 0 ? t("common.today") : `${daysUntil} ${t("common.days")}`}
                              </p>
                            </div>
                            <p className="font-bold text-sm whitespace-nowrap">
                              {formatCurrency(sub.amount, sub.currency)}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Active Subscriptions Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    {t("subscription.active")} ({activeCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeSubscriptions.slice(0, 5).map(sub => (
                      <div 
                        key={sub.id}
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:border-primary transition-colors"
                        onClick={() => router.push(`/edit-subscription/${sub.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <SubscriptionIcon
                            name={sub.name}
                            iconUrl={sub.icon_url}
                            websiteUrl={sub.website_url}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-sm">{sub.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t(`subscription.${sub.billing_cycle}`)}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-sm">
                          {formatCurrency(sub.amount, sub.currency)}
                        </p>
                      </div>
                    ))}
                    
                    {activeCount > 5 && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {/* Scroll to all subscriptions */}}
                      >
                        {t("common.viewAll")} ({activeCount})
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm opacity-90">{t("subscription.count")}</span>
                      <span className="text-2xl font-bold">{activeCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm opacity-90">{t("dashboard.avgPerMonth")}</span>
                      <span className="text-xl font-bold">
                        {activeCount > 0 ? formatPrice(totalMonthly / activeCount) : "฿0"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <MobileNav user={user} />
        </div>
      </div>
    </AuthGuard>
  );
}