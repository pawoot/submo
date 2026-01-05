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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subscriptionService } from "@/services/subscriptionService";
import { getAllCategories } from "@/services/adminCategoryService";
import { authService } from "@/services/authService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { formatCurrency } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Calendar,
  DollarSign,
  TrendingUp,
  Bell,
  BellOff,
  Edit,
  Trash2,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { SubscriptionCharts } from "@/components/SubscriptionCharts";
import { InsightPanel } from "@/components/InsightPanel";
import { SavingsRecommendation } from "@/components/SavingsRecommendation";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import type { Database } from "@/integrations/supabase/types";

// Use the exact type returned by subscriptionService to avoid mismatches
type ServiceSubscription = Awaited<ReturnType<typeof subscriptionService.getUserSubscriptions>>[number];
// Base Subscription type for components that expect the raw table row
type TableSubscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface Category {
  id: string;
  name_en: string;
  name_th: string;
  slug: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { preferredCurrency, convertAmount, formatPrice } = useCurrency();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(key as any, language);

  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<ServiceSubscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("next_billing");

  // Stats
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [totalYearly, setTotalYearly] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [subscriptions, preferredCurrency]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [currentUser, subsData, catsData] = await Promise.all([
        authService.getCurrentUser(),
        subscriptionService.getUserSubscriptions(),
        getAllCategories()
      ]);
      
      setUser(currentUser);
      setSubscriptions(subsData || []);
      setCategories(catsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    const activeSubscriptions = subscriptions.filter(s => s.status === "active");
    
    let monthlyTotal = 0;
    
    for (const sub of activeSubscriptions) {
      const price = sub.amount || 0;
      const currency = sub.currency || "THB";
      
      // Convert to preferred currency
      const priceInPreferred = await convertAmount(price, currency);
      
      // Calculate monthly cost based on billing cycle
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
    setTotalYearly(monthlyTotal * 12);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    // Search filter
    if (searchQuery && !sub.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filterStatus !== "all" && sub.status !== filterStatus) {
      return false;
    }
    
    // Category filter
    if (filterCategory !== "all" && sub.category_id !== filterCategory) {
      return false;
    }
    
    return true;
  });

  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    switch (sortBy) {
      case "next_billing":
        return new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime();
      case "cost_high":
        return b.amount - a.amount;
      case "cost_low":
        return a.amount - b.amount;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const activeCount = subscriptions.filter(s => s.status === "active").length;
  const inactiveCount = subscriptions.filter(s => s.status === "inactive").length;

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
        title: t("common.success"),
        description: !currentState 
          ? t("notifications.reminderEnabled")
          : t("notifications.reminderDisabled")
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive"
      });
    }
  };

  const deleteSubscription = async (subscriptionId: string, subscriptionName: string) => {
    if (!confirm(`${t("common.confirmDelete")} "${subscriptionName}"?`)) {
      return;
    }
    
    try {
      await subscriptionService.delete(subscriptionId);
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
      
      toast({
        title: t("common.success"),
        description: t("subscription.deleteSuccess")
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive"
      });
    }
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

  return (
    <AuthGuard>
      <SEO
        title={t("nav.dashboard")}
        description={t("dashboard.subtitle")}
      />
      
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader user={user} />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:block border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{t("nav.dashboard")}</h1>
              <Button onClick={() => router.push("/add-subscription")}>
                <Plus className="w-4 h-4 mr-2" />
                {t("subscription.add")}
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.totalMonthly")}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice(totalMonthly)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(totalYearly)} {t("dashboard.perYear")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.activeSubscriptions")}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCount}</div>
                <p className="text-xs text-muted-foreground">
                  {inactiveCount} {t("dashboard.inactive")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.totalSubscriptions")}
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscriptions.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="list" className="space-y-6">
            <TabsList className="grid w-full md:w-auto grid-cols-4">
              <TabsTrigger value="list">{t("dashboard.list")}</TabsTrigger>
              <TabsTrigger value="analytics">{t("dashboard.analytics")}</TabsTrigger>
              <TabsTrigger value="insights">{t("dashboard.insights")}</TabsTrigger>
              <TabsTrigger value="savings">{t("dashboard.savings")}</TabsTrigger>
            </TabsList>

            {/* List Tab */}
            <TabsContent value="list" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("common.search")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("subscription.status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        <SelectItem value="active">{t("subscription.active")}</SelectItem>
                        <SelectItem value="inactive">{t("subscription.inactive")}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("subscription.category")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {language === "th" ? cat.name_th : cat.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("common.sortBy")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="next_billing">{t("subscription.nextBilling")}</SelectItem>
                        <SelectItem value="cost_high">{t("subscription.costHigh")}</SelectItem>
                        <SelectItem value="cost_low">{t("subscription.costLow")}</SelectItem>
                        <SelectItem value="name">{t("subscription.name")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Subscriptions List */}
              {sortedSubscriptions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">{t("subscription.noSubscriptions")}</p>
                    <Button 
                      className="mt-4"
                      onClick={() => router.push("/add-subscription")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("subscription.addFirst")}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {sortedSubscriptions.map(sub => {
                    const category = categories.find(c => c.id === sub.category_id);
                    const nextBilling = new Date(sub.next_billing_date);
                    const daysUntil = Math.ceil((nextBilling.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <Card key={sub.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <SubscriptionIcon
                                name={sub.name}
                                iconUrl={sub.icon_url}
                                faviconUrl={sub.favicon_url}
                                size="md"
                              />
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg mb-1">{sub.name}</h3>
                                
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                                    {t(`subscription.${sub.status}`)}
                                  </Badge>
                                  
                                  {category && (
                                    <Badge variant="outline">
                                      {language === "th" ? category.name_th : category.name_en}
                                    </Badge>
                                  )}
                                  
                                  <Badge variant="outline">
                                    {t(`subscription.${sub.billing_cycle}`)}
                                  </Badge>
                                </div>
                                
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>
                                    {t("subscription.nextBilling")}: {nextBilling.toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                                    {daysUntil <= 7 && (
                                      <span className="text-orange-600 ml-2">
                                        ({daysUntil} {t("common.days")})
                                      </span>
                                    )}
                                  </p>
                                  
                                  {sub.notes && (
                                    <p className="line-clamp-1">{sub.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 ml-4">
                              <div className="text-right">
                                <div className="text-xl font-bold">
                                  {formatCurrency(sub.amount, sub.currency)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  / {t(`subscription.${sub.billing_cycle}`)}
                                </div>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => router.push(`/edit-subscription/${sub.id}`)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t("common.edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleReminder(sub.id, sub.reminder_enabled)}>
                                    {sub.reminder_enabled ? (
                                      <>
                                        <BellOff className="h-4 w-4 mr-2" />
                                        {t("notifications.disableReminder")}
                                      </>
                                    ) : (
                                      <>
                                        <Bell className="h-4 w-4 mr-2" />
                                        {t("notifications.enableReminder")}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => deleteSubscription(sub.id, sub.name)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t("common.delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <SubscriptionCharts />
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights">
              <InsightPanel subscriptions={subscriptions as unknown as TableSubscription[]} />
            </TabsContent>

            {/* Savings Tab */}
            <TabsContent value="savings">
              <SavingsRecommendation subscriptions={subscriptions as unknown as TableSubscription[]} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <MobileNav user={user} />
        </div>
      </div>
    </AuthGuard>
  );
}