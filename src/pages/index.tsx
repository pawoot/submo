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

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type SortOption = "name-asc" | "name-desc" | "cost-asc" | "cost-desc" | "date-asc" | "date-desc" | "category";

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [sortedSubscriptions, setSortedSubscriptions] = useState<Subscription[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("date-asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadUserData();
    loadSubscriptions();
  }, []);

  useEffect(() => {
    sortSubscriptions(sortOption);
  }, [subscriptions, sortOption]);

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
    const sorted = [...subscriptions];
    
    switch (option) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "cost-asc":
        sorted.sort((a, b) => {
          const costA = calculateMonthlyCost(a);
          const costB = calculateMonthlyCost(b);
          return costA - costB;
        });
        break;
      case "cost-desc":
        sorted.sort((a, b) => {
          const costA = calculateMonthlyCost(a);
          const costB = calculateMonthlyCost(b);
          return costB - costA;
        });
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

  const calculateMonthlyCost = (sub: Subscription): number => {
    switch (sub.billing_cycle) {
      case "yearly": return sub.amount / 12;
      case "quarterly": return sub.amount / 3;
      case "half-yearly": return sub.amount / 6;
      default: return sub.amount;
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

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + calculateMonthlyCost(sub), 0);
  const totalYearly = totalMonthly * 12;

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
      <MobileHeader user={user} isAdmin={isAdmin} unreadCount={unreadNotifications} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscription Mo</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">จัดการค่าใช้จ่าย Software</p>
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
                  ${totalMonthly.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ≈ ฿{(totalMonthly * 35).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                </p>
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
                  ${totalYearly.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ≈ ฿{(totalYearly * 35).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                </p>
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
          <SubscriptionCharts subscriptions={subscriptions} />

          {sortedSubscriptions.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">รายการ Subscription</CardTitle>
                    <Badge variant="secondary">{sortedSubscriptions.length} รายการ</Badge>
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
                  {sortedSubscriptions.map((sub) => {
                    const daysUntil = getDaysUntilRenewal(sub.next_billing_date);
                    const isUrgent = daysUntil <= 7;
                    const monthlyCost = calculateMonthlyCost(sub);

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
                              ${Number(sub.amount).toFixed(2)}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {billingCycleLabels[sub.billing_cycle]}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              ≈ ${monthlyCost.toFixed(2)}/เดือน
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