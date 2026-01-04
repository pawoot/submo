import SEO from "@/components/SEO";
import MobileHeader from "@/components/MobileHeader";
import { AuthGuard } from "@/components/AuthGuard";
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
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CreditCard, Calendar, DollarSign, Users, Plus, TrendingUp, AlertCircle, Edit, Trash2, ArrowUpDown, LogOut, Settings, Bell, User as UserIcon } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
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
  const { preferredCurrency, convertAmount, formatAmount } = useCurrency();
  const { t } = useLanguage();

  useEffect(() => {
    loadUserData();
    loadSubscriptions();

    // Add scroll event listener
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Process subscriptions when data or currency changes
  useEffect(() => {
    const processSubscriptions = async () => {
      if (subscriptions.length === 0) {
        setDisplaySubscriptions([]);
        setSortedSubscriptions([]);
        setTotals({ monthly: 0, yearly: 0 });
        return;
      }

      setProcessing(true);
      try {
        const processed = await Promise.all(
          subscriptions.map(async (sub) => {
            const convertedAmount = await convertAmount(sub.amount, sub.currency || "USD");
            return {
              ...sub,
              amount: convertedAmount,
              currency: preferredCurrency,
              originalAmount: sub.amount,
              originalCurrency: sub.currency || "USD"
            };
          })
        );

        setDisplaySubscriptions(processed);

        // Calculate totals
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
  }, [subscriptions, preferredCurrency, convertAmount]);

  useEffect(() => {
    let result = [...displaySubscriptions];

    // 1. Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(sub => 
        sub.name.toLowerCase().includes(query) || 
        sub.category.toLowerCase().includes(query)
      );
    }

    // 2. Sort
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
    setCurrentPage(1); // Reset to page 1 when filter/sort changes
  }, [displaySubscriptions, sortOption, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedSubscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubscriptions = sortedSubscriptions.slice(startIndex, endIndex);

  // Reset to page 1 when sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of subscription list
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
        title: "🗑️ ลบ Subscription สำเร็จ",
        description: "รายการถูกลบออกจากระบบแล้ว",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบรายการได้",
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
        title: "👋 ออกจากระบบสำเร็จ",
        description: "แล้วพบกันใหม่",
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
    design: "Design",
    development: "Development",
    productivity: "Productivity",
    entertainment: "Entertainment",
    storage: "Storage",
    communication: "Communication",
    marketing: "Marketing",
    education: "Education",
    other: "Other"
  };

  const billingCycleLabels: { [key: string]: string } = {
    monthly: "ต่อเดือน",
    quarterly: "ราย 3 เดือน",
    "half-yearly": "ราย 6 เดือน",
    yearly: "ต่อปี"
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
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
                      title="Admin Panel"
                    >
                      <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="hidden sm:inline text-purple-600 dark:text-purple-400 font-medium">Admin Panel</span>
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
                    <span className="hidden sm:inline">เพิ่ม Subscription</span>
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
                        <p className="text-sm font-medium leading-none">{profile?.full_name || "ผู้ใช้"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <UserIcon className="w-4 h-4 mr-2" />
                        โปรไฟล์
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      ออกจากระบบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
            <Card className="border-l-4 border-l-indigo-500 shadow-sm">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
                  <DollarSign className="w-3.5 h-3.5 shrink-0" />
                  {t("dashboard.totalCost")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">
                  {formatCurrency(totals.monthly, preferredCurrency)}
                </div>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t("dashboard.perMonth")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  {t("dashboard.totalCost")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">
                  {formatCurrency(totals.yearly, preferredCurrency)}
                </div>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t("dashboard.perYear")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  {t("dashboard.activeSubscriptions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {subscriptions.length}
                </div>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t("dashboard.items")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 shadow-sm">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {t("dashboard.upcomingRenewals")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {subscriptions.filter(s => getDaysUntilRenewal(s.next_billing_date) <= 7).length}
                </div>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t("dashboard.within30Days")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search Section */}
          <div className="mb-8">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <label className="text-sm font-medium mb-2 block">{t("common.search")}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder={t("subscriptions.searchPlaceholder") || "ค้นหาชื่อ Subscription..."} 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    {t("common.search")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* กราฟสถิติ */}
          <SubscriptionCharts subscriptions={displaySubscriptions} />

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
                    
                    return (
                      <div 
                        key={sub.id}
                        className="bg-white dark:bg-slate-800 rounded-xl border p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                      >
                         {/* Left colored accent bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          categoryLabels[sub.category] === "Entertainment" ? "bg-purple-500" :
                          categoryLabels[sub.category] === "Productivity" ? "bg-blue-500" : "bg-indigo-500"
                        }`} />

                        <div className="flex items-start justify-between pl-2">
                           {/* Icon & Main Info */}
                           <div className="flex gap-3">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                                {sub.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{sub.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-slate-50">
                                    {categoryLabels[sub.category] || sub.category}
                                  </Badge>
                                </div>
                              </div>
                           </div>

                           {/* Price (Top Right) */}
                           <div className="text-right">
                              <div className="text-lg font-bold text-slate-900 dark:text-white">
                                {formatCurrency(Number(sub.amount), preferredCurrency)}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {sub.billing_cycle === "monthly" ? t("subscriptions.perMonth") : 
                                 sub.billing_cycle === "yearly" ? t("subscriptions.perYear") : 
                                 billingCycleLabels[sub.billing_cycle]}
                              </div>
                           </div>
                        </div>

                        {/* Details Grid (Bottom) */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3 pl-2">
                            <div>
                                <p className="text-[10px] text-slate-500 mb-0.5">{t("subscriptions.nextBilling")}</p>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                  {new Date(sub.next_billing_date).toLocaleDateString("th-TH", { 
                                    day: "numeric", 
                                    month: "short",
                                    year: "2-digit"
                                  })}
                                </div>
                                {isUrgent && (
                                  <span className="inline-block mt-1 text-[10px] text-white bg-red-500 px-1.5 py-0.5 rounded-sm">
                                    เหลือ {daysUntil} วัน
                                  </span>
                                )}
                            </div>
                            
                            <div>
                                <p className="text-[10px] text-slate-500 mb-0.5">{t("addSub.paymentMethod")}</p>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                  <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                                  <span className="truncate max-w-[100px]">
                                    {sub.payment_method.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                  </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons (Absolute Bottom Right) */}
                        <div className="absolute bottom-3 right-3 flex gap-1">
                          <Link href={`/edit-subscription/${sub.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setDeleteId(sub.id)}
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
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