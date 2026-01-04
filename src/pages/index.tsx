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
    sortSubscriptions(sortOption);
  }, [displaySubscriptions, sortOption]); // Depend on displaySubscriptions instead

  const loadUserData = async () => {
    // Use supabase.auth.getUser() directly to get full User object compatible with state
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (currentUser) {
      setUser(currentUser);
      setUserEmail(currentUser.email || "");
      
      // Check if user is admin and load profile
      try {
        const profileData = await profileService.getCurrentProfile();
        setProfile(profileData);
        setIsAdmin(profileData?.role === "admin");
      } catch (error) {
        console.error("Error checking admin status:", error);
      }

      // Load unread notifications
      try {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id)
          .eq("is_read", false);
        setUnreadNotifications(count || 0);
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    }
  };

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getAll();
      setSubscriptions(data);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูล Subscription ได้",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const sortSubscriptions = (option: SortOption) => {
    const sorted = [...displaySubscriptions];
    
    // Helper for monthly cost (synchronous since amounts are already converted)
    const getMonthlyCost = (sub: Subscription) => {
      switch (sub.billing_cycle) {
        case "yearly": return sub.amount / 12;
        case "quarterly": return sub.amount / 3;
        case "half-yearly": return sub.amount / 6;
        default: return sub.amount;
      }
    };

    switch (option) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "cost-asc":
        sorted.sort((a, b) => getMonthlyCost(a) - getMonthlyCost(b));
        break;
      case "cost-desc":
        sorted.sort((a, b) => getMonthlyCost(b) - getMonthlyCost(a));
        break;
      case "date-asc":
        sorted.sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime());
        break;
      case "date-desc":
        sorted.sort((a, b) => new Date(b.next_billing_date).getTime() - new Date(a.next_billing_date).getTime());
        break;
      case "category":
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }
    
    setSortedSubscriptions(sorted);
  };

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
        title="Subscription Manager - จัดการค่าใช้จ่าย Software"
        description="ระบบบริหารจัดการค่าใช้จ่าย Software Subscription ติดตามวันหมดอายุ แบ่งปันค่าใช้จ่าย และดูภาพรวมการใช้เงิน"
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
                  }`}>Subscription Mo</h1>
                  <p className={`text-sm text-slate-600 dark:text-slate-400 transition-all duration-300 ${
                    scrolled ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
                  }`}>จัดการค่าใช้จ่าย Software</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  รายเดือน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(totals.monthly, preferredCurrency)}
                </div>
                {preferredCurrency !== 'THB' && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ≈ ฿{(totals.monthly * 35).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  รายปี
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(totals.yearly, preferredCurrency)}
                </div>
                {preferredCurrency !== 'THB' && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ≈ ฿{(totals.yearly * 35).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Subscription ทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {subscriptions.length}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ใช้งานอยู่
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  ต่ออายุเร็วๆ นี้
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {subscriptions.filter(s => getDaysUntilRenewal(s.next_billing_date) <= 7).length}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ภายใน 7 วัน
                </p>
              </CardContent>
            </Card>
          </div>

          {/* กราฟสถิติ */}
          <SubscriptionCharts subscriptions={displaySubscriptions} />

          {sortedSubscriptions.length > 0 ? (
            <Card id="subscription-list">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">รายการ Subscription</CardTitle>
                    <Badge variant="secondary">{sortedSubscriptions.length} รายการ</Badge>
                    {totalPages > 1 && (
                      <Badge variant="outline" className="text-xs">
                        หน้า {currentPage} จาก {totalPages}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="เรียงลำดับ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-asc">วันหมดอายุ: ใกล้ → ไกล</SelectItem>
                        <SelectItem value="date-desc">วันหมดอายุ: ไกล → ใกล้</SelectItem>
                        <SelectItem value="cost-desc">ราคา: มาก → น้อย</SelectItem>
                        <SelectItem value="cost-asc">ราคา: น้อย → มาก</SelectItem>
                        <SelectItem value="name-asc">ชื่อ: A → Z</SelectItem>
                        <SelectItem value="name-desc">ชื่อ: Z → A</SelectItem>
                        <SelectItem value="category">หมวดหมู่</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paginatedSubscriptions.map((sub) => {
                    const daysUntil = getDaysUntilRenewal(sub.next_billing_date);
                    const isUrgent = daysUntil <= 7;
                    const monthlyCost = sub.billing_cycle === "yearly" ? sub.amount / 12 :
                                      sub.billing_cycle === "quarterly" ? sub.amount / 3 :
                                      sub.billing_cycle === "half-yearly" ? sub.amount / 6 : 
                                      sub.amount;

                    return (
                      <div 
                        key={sub.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {sub.name.charAt(0)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white">{sub.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {categoryLabels[sub.category] || sub.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                ต่ออายุ: {new Date(sub.next_billing_date).toLocaleDateString("th-TH", { 
                                  year: "numeric", 
                                  month: "short", 
                                  day: "numeric" 
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-4 h-4" />
                                {sub.payment_method.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                              </span>
                              {sub.shared_with && sub.shared_with.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  แบ่งกับ {sub.shared_with.length} คน
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                              {formatCurrency(Number(sub.amount), preferredCurrency)}
                            </div>
                            
                            {sub.originalCurrency !== preferredCurrency && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                ({formatCurrency(sub.originalAmount, sub.originalCurrency)})
                              </div>
                            )}

                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {billingCycleLabels[sub.billing_cycle]}
                            </div>
                            <div className="text-xs text-slate-400">
                              ≈ {formatCurrency(monthlyCost, preferredCurrency)}/เดือน
                            </div>
                            {isUrgent && (
                              <Badge variant="destructive" className="mt-2 text-xs">
                                เหลือ {daysUntil} วัน
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Link href={`/edit-subscription/${sub.id}`}>
                              <Button variant="outline" size="icon">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => setDeleteId(sub.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      แสดง {startIndex + 1}-{Math.min(endIndex, sortedSubscriptions.length)} จาก {sortedSubscriptions.length} รายการ
                    </div>
                    
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          const showPage = 
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1);
                          
                          // Show ellipsis
                          const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                          const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;
                          
                          if (showEllipsisBefore || showEllipsisAfter) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          
                          if (!showPage) return null;
                          
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">ยังไม่มี Subscription</h3>
                  <p className="mb-6">เริ่มต้นติดตามค่าใช้จ่าย Software ของคุณวันนี้</p>
                  <Link href="/add-subscription">
                    <Button size="lg" className="gap-2">
                      <Plus className="w-5 h-5" />
                      เพิ่ม Subscription แรก
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
            <AlertDialogTitle>ยืนยันการลบ Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthGuard>
  );
}