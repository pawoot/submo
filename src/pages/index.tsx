import SEO from "@/components/SEO";
import MobileHeader from "@/components/MobileHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { InsightPanel } from "@/components/InsightPanel";
import { SavingsRecommendation } from "@/components/SavingsRecommendation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CreditCard, Calendar, DollarSign, Users, Plus, TrendingUp, AlertCircle, Edit, Trash2, ArrowUpDown, LogOut, Settings, Bell, User as UserIcon, ListFilter, PieChart, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionCharts } from "@/components/SubscriptionCharts";
import { subscriptionService } from "@/services/subscriptionService";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { useRouter } from "next/router";
import type { Database } from "@/integrations/supabase/types";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type DisplaySubscription = Subscription & {
  originalAmount: number;
  originalCurrency: string;
};

type SortOption = "name-asc" | "name-desc" | "cost-asc" | "cost-desc" | "date-asc" | "date-desc" | "category";

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [sortedSubscriptions, setSortedSubscriptions] = useState<DisplaySubscription[]>([]);
  const [displaySubscriptions, setDisplaySubscriptions] = useState<DisplaySubscription[]>([]);
  const [totals, setTotals] = useState({ monthly: 0, yearly: 0 });
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [sortOption, setSortOption] = useState<SortOption>("date-asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();
  const router = useRouter();
  const { preferredCurrency, convertAmount, formatAmount, isLoading: currencyLoading } = useCurrency();
  const { t } = useLanguage();

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      entertainment: "#ef4444", // red-500
      music: "#22c55e", // green-500
      productivity: "#3b82f6", // blue-500
      utilities: "#eab308", // yellow-500
      design: "#a855f7", // purple-500
      education: "#f97316", // orange-500
      gaming: "#ec4899", // pink-500
      news: "#64748b", // slate-500
      health: "#14b8a6", // teal-500
      shopping: "#f43f5e", // rose-500
      social: "#06b6d4", // cyan-500
      other: "#94a3b8", // slate-400
    };
    return colors[category?.toLowerCase()] || "#94a3b8";
  };

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setUserEmail(user.email || "");
        
        const profileData = await profileService.getCurrentProfile();
        setProfile(profileData);
        
        if (profileData?.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getAll();
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      toast({
        title: t("common.error"),
        description: "Failed to load subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    loadSubscriptions();

    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const processSubscriptions = async () => {
      if (currencyLoading) {
        console.log("⏳ Waiting for currency to load...");
        return;
      }

      if (subscriptions.length === 0) {
        setDisplaySubscriptions([]);
        setSortedSubscriptions([]);
        setTotals({ monthly: 0, yearly: 0 });
        return;
      }

      setProcessing(true);
      try {
        console.log("🔄 Processing subscriptions...");
        console.log("📊 Preferred Currency:", preferredCurrency);
        
        const processed = await Promise.all(
          subscriptions.map(async (sub) => {
            console.log(`💰 Converting ${sub.name}: ${sub.amount} ${sub.currency} → ${preferredCurrency}`);
            const convertedAmount = await convertAmount(sub.amount, sub.currency || "USD");
            console.log(`✅ Converted: ${sub.amount} ${sub.currency} → ${convertedAmount} ${preferredCurrency}`);
            
            return {
              ...sub,
              amount: convertedAmount,
              currency: preferredCurrency,
              originalAmount: sub.amount,
              originalCurrency: sub.currency || "USD"
            };
          })
        );

        console.log("✅ Processed subscriptions:", processed);
        setDisplaySubscriptions(processed);

        const monthly = processed.reduce((sum, sub) => {
          let cost = sub.amount;
          switch (sub.billing_cycle) {
            case "yearly": cost = sub.amount / 12; break;
            case "quarterly": cost = sub.amount / 3; break;
            case "half-yearly": cost = sub.amount / 6; break;
          }
          return sum + cost;
        }, 0);

        setTotals({
          monthly,
          yearly: monthly * 12
        });

      } catch (error) {
        console.error("Error processing subscriptions:", error);
      } finally {
        setProcessing(false);
      }
    };

    processSubscriptions();
  }, [subscriptions, preferredCurrency, convertAmount, currencyLoading]);

  useEffect(() => {
    const result = [...displaySubscriptions];

    const getMonthlyCost = (sub: Subscription) => {
      switch (sub.billing_cycle) {
        case "yearly": return sub.amount / 12;
        case "quarterly": return sub.amount / 3;
        case "half-yearly": return sub.amount / 6;
        default: return sub.amount;
      }
    };

    switch (sortOption) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "cost-asc":
        result.sort((a, b) => getMonthlyCost(a) - getMonthlyCost(b));
        break;
      case "cost-desc":
        result.sort((a, b) => getMonthlyCost(b) - getMonthlyCost(a));
        break;
      case "date-asc":
        result.sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime());
        break;
      case "date-desc":
        result.sort((a, b) => new Date(b.next_billing_date).getTime() - new Date(a.next_billing_date).getTime());
        break;
      case "category":
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }
    
    setSortedSubscriptions(result);
    setCurrentPage(1);
  }, [displaySubscriptions, sortOption]);

  const totalPages = Math.ceil(sortedSubscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubscriptions = sortedSubscriptions.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const subscriptionList = document.getElementById('subscription-list');
    if (subscriptionList) {
      subscriptionList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await subscriptionService.delete(id);
      await loadSubscriptions();
      
      toast({
        title: t("toast.deleteSuccess"),
        description: t("toast.deleted"),
        duration: 3000,
      });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        title: t("common.error"),
        description: t("toast.deleteError"),
        variant: "destructive",
        duration: 3000,
      });
    }
    setDeleteId(null);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.push("/auth/login");
      toast({
        title: t("nav.logout"),
        description: t("common.success"),
        duration: 3000,
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getDaysUntilRenewal = (date: string) => {
    const today = new Date();
    const renewal = new Date(date);
    const diff = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const categoryLabels: { [key: string]: string } = {
    design: t("category.design"),
    development: t("category.development"),
    productivity: t("category.productivity"),
    entertainment: t("category.entertainment"),
    "cloud-storage": t("category.cloud-storage"),
    gaming: t("category.gaming"),
    education: t("category.education"),
    fitness: t("category.fitness"),
    news: t("category.news"),
    other: t("category.other")
  };

  const billingCycleLabels: { [key: string]: string } = {
    monthly: t("subscriptions.monthly"),
    quarterly: t("subscriptions.quarterly"),
    "half-yearly": t("subscriptions.halfYearly"),
    yearly: t("subscriptions.yearly")
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <SEO 
        title={t("home.seo.title")}
        description={t("home.seo.description")}
      />
      <div className={`lg:hidden sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white shadow-md" 
          : "bg-white/90 shadow-sm"
      }`}>
        <MobileHeader user={user} isAdmin={isAdmin} unreadCount={unreadNotifications} />
      </div>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <header className={`hidden lg:block bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b sticky top-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg" 
            : "py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
        }`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center transition-all duration-300 ${
                  scrolled ? "w-8 h-8" : "w-10 h-10"
                }`}>
                  <CreditCard className={`text-white transition-all duration-300 ${
                    scrolled ? "w-5 h-5" : "w-6 h-6"
                  }`} />
                </div>
                <div>
                  <h1 className={`font-bold text-slate-900 dark:text-white transition-all duration-300 ${
                    scrolled ? "text-xl" : "text-2xl"
                  }`}>{t("home.title")}</h1>
                  <p className={`text-sm text-slate-600 dark:text-slate-400 transition-all duration-300 ${
                    scrolled ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
                  }`}>{t("home.tagline")}</p>
                </div>
                {isAdmin && (
                  <Link href="/admin">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="ml-4 gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 dark:border-purple-800 dark:hover:bg-purple-950"
                      title={t("nav.admin")}
                    >
                      <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="hidden sm:inline text-purple-600 dark:text-purple-400 font-medium">{t("nav.admin")}</span>
                    </Button>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <Link href="/notifications">
                  <Button variant="outline" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs"
                      >
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/add-subscription">
                  <Button size="lg" className="gap-2">
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">{t("nav.addSubscription")}</span>
                  </Button>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-indigo-200">
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || userEmail} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                          {profile?.full_name?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name || t("profile.noName")}</p>
                        <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <UserIcon className="w-4 h-4 mr-2" />
                        {t("nav.profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Intelligence Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InsightPanel subscriptions={displaySubscriptions} />
              
              {/* Cost Toggle & Summary */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                   </div>
                   <div>
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {formatCurrency(viewMode === "monthly" ? totals.monthly : totals.yearly, preferredCurrency)}
                        </h2>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          / {viewMode === "monthly" ? t("dashboard.perMonth") : t("dashboard.perYear")}
                        </span>
                      </div>
                      
                      {/* Annual Cost Emphasis - Metaphor */}
                      {viewMode === "yearly" && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium flex items-center gap-1">
                          <span>≈</span>
                          {totals.yearly < 5000 ? (language === 'th' ? 'อาหารมื้อหรู 1 มื้อ' : 'A nice dinner') :
                           totals.yearly < 15000 ? (language === 'th' ? 'รองเท้าผ้าใบดีๆ 1 คู่' : 'A pair of premium sneakers') :
                           totals.yearly < 30000 ? (language === 'th' ? 'สมาร์ทโฟนเครื่องใหม่' : 'A new mid-range smartphone') :
                           (language === 'th' ? 'ทริปเที่ยวต่างประเทศระยะสั้น' : 'A short international trip')}
                        </p>
                      )}
                      
                      {viewMode === "monthly" && (
                        <p className="text-xs text-slate-500 mt-1">
                          {language === 'th' ? 'ค่าใช้จ่ายรวมทั้งหมด' : 'Total subscription spending'}
                        </p>
                      )}
                   </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode("monthly")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      viewMode === "monthly" 
                        ? "bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400" 
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {t("dashboard.perMonth")}
                  </button>
                  <button
                    onClick={() => setViewMode("yearly")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      viewMode === "yearly" 
                        ? "bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400" 
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {t("dashboard.perYear")}
                  </button>
                </div>
              </div>

              {/* Charts - Visual Breakdown */}
              <SubscriptionCharts />
            </div>

            <div className="space-y-6">
              <SavingsRecommendation subscriptions={displaySubscriptions} />
              
              {/* Stats Cards Vertical Stack */}
              <div className="grid grid-cols-1 gap-4">
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{t("dashboard.activeSubscriptions")}</p>
                      <div className="text-2xl font-bold">{subscriptions.length}</div>
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                       <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Upcoming Billing Timeline */}
                <Card className="border-l-4 border-l-orange-500 shadow-sm overflow-hidden">
                  <CardHeader className="p-4 pb-2 bg-orange-50/50">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-800">
                      <Calendar className="w-4 h-4" />
                      {t("dashboard.upcomingRenewals")} (30 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-orange-100 max-h-[300px] overflow-y-auto">
                      {subscriptions
                        .filter(s => {
                          const days = getDaysUntilRenewal(s.next_billing_date);
                          return days >= 0 && days <= 30;
                        })
                        .sort((a, b) => getDaysUntilRenewal(a.next_billing_date) - getDaysUntilRenewal(b.next_billing_date))
                        .map(sub => {
                          const days = getDaysUntilRenewal(sub.next_billing_date);
                          return (
                            <div key={sub.id} className="p-3 flex items-center gap-3 hover:bg-orange-50/30 transition-colors">
                              <div className="text-center min-w-[3rem]">
                                <span className={`text-lg font-bold ${days <= 7 ? "text-orange-600" : "text-slate-700"}`}>
                                  {days === 0 ? "Today" : days}
                                </span>
                                <p className="text-[10px] text-slate-500 leading-none">days</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">{sub.name}</p>
                                <p className="text-xs text-slate-500">
                                  {new Date(sub.next_billing_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {formatCurrency(Number(sub.amount), preferredCurrency)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {subscriptions.filter(s => getDaysUntilRenewal(s.next_billing_date) <= 30).length === 0 && (
                          <div className="p-4 text-center text-sm text-slate-500">
                            No upcoming renewals
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {sortedSubscriptions.length > 0 ? (
            <Card id="subscription-list" className="shadow-sm">
              <CardHeader className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg md:text-xl">{t("subscriptions.title")}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{sortedSubscriptions.length} {t("subscriptions.items")}</Badge>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t("subscriptions.sort")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-asc">{t("subscriptions.sortNextBilling")}</SelectItem>
                        <SelectItem value="cost-desc">{t("subscriptions.sortPriceHigh")}</SelectItem>
                        <SelectItem value="name-asc">{t("subscriptions.sortNameAZ")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <div className="space-y-3">
                  {paginatedSubscriptions.map((sub) => {
                    const daysUntil = getDaysUntilRenewal(sub.next_billing_date);
                    const isUrgent = daysUntil <= 7;
                    
                    // Intelligence Badges
                    const isHighCost = sub.amount > (totals.monthly * 0.2); // > 20% of total
                    const isYearly = sub.billing_cycle === "yearly";
                    
                    return (
                      <Link
                        key={sub.id}
                        href={`/edit-subscription/${sub.id}`}
                        className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-l-4 group"
                        style={{ borderLeftColor: getCategoryColor(sub.category) }}
                      >
                        <div className="relative">
                          <SubscriptionIcon
                            name={sub.name}
                            websiteUrl={sub.website_url}
                            size="lg"
                          />
                          {isUrgent && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                             <h3 className="font-bold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors">{sub.name}</h3>
                             {isUrgent && <Badge variant="outline" className="text-[10px] border-orange-200 text-orange-600 bg-orange-50">Renewing Soon</Badge>}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-slate-50">
                              {categoryLabels[sub.category] || sub.category}
                            </Badge>
                            {isHighCost && (
                               <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-red-100 text-red-600 bg-red-50">
                                 High Cost
                               </Badge>
                            )}
                            {isYearly && (
                               <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-blue-100 text-blue-600 bg-blue-50">
                                 Yearly
                               </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {formatCurrency(Number(sub.amount), preferredCurrency)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {sub.billing_cycle === "monthly" ? t("subscriptions.perMonth") : 
                             sub.billing_cycle === "yearly" ? t("subscriptions.perYear") : 
                             billingCycleLabels[sub.billing_cycle]}
                          </div>
                          <div className="text-[10px] font-medium text-slate-400 mt-1">
                             {new Date(sub.next_billing_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">{t("subscriptions.empty")}</h3>
                  <p className="mb-6">{t("subscriptions.emptyDesc")}</p>
                  <Link href="/add-subscription">
                    <Button size="lg" className="gap-2">
                      <Plus className="w-5 h-5" />
                      {t("nav.addSubscription")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("subscriptions.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("subscriptions.confirmDeleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("subscriptions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("subscriptions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthGuard>
  );
}