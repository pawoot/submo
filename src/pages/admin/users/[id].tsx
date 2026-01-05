import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import SEO from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { adminUserService } from "@/services/adminUserService";
import { profileService } from "@/services/profileService";
import { getCountryDisplay, getCountryFlag, formatFullName, getUserDisplayName } from "@/lib/countryUtils";
import type { Database } from "@/integrations/supabase/types";
import {
  ArrowLeft,
  Mail,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Globe,
  User,
  Shield,
  ShieldCheck,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

// Helper component for async price display
const PriceDisplay = ({ amount, currency }: { amount: number, currency: string }) => {
  const { convertAmount } = useCurrency();
  const [formattedPrice, setFormattedPrice] = useState<string>("...");

  useEffect(() => {
    const loadPrice = async () => {
      const converted = await convertAmount(amount, currency);
      const formatted = new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 2,
      }).format(converted);
      setFormattedPrice(formatted);
    };
    loadPrice();
  }, [amount, currency, convertAmount]);

  return <>{formattedPrice}</>;
};

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface UserDetail {
  profile: Database["public"]["Tables"]["profiles"]["Row"];
  subscriptions: Subscription[];
}

export default function UserDetailPage() {
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [pendingRole, setPendingRole] = useState<"admin" | "user" | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [costs, setCosts] = useState({ monthly: 0, yearly: 0 });
  const { toast } = useToast();
  const { convertAmount } = useCurrency();
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin && id) {
      loadUserDetail();
    }
  }, [isAdmin, id]);

  const checkAdminAccess = async () => {
    try {
      const profile = await profileService.getCurrentProfile();
      if (profile?.role === "admin") {
        setIsAdmin(true);
      } else {
        toast({
          title: "ไม่มีสิทธิ์เข้าถึง",
          description: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
          variant: "destructive",
        });
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/dashboard");
    }
  };

  const loadUserDetail = async () => {
    try {
      setIsLoading(true);
      const data = await adminUserService.getUserById(id as string);
      
      // Debug logging
      console.log("=== USER DETAIL DEBUG ===");
      console.log("User ID:", id);
      console.log("Profile data:", data?.profile);
      console.log("Subscriptions data:", data?.subscriptions);
      console.log("Subscriptions count:", data?.subscriptions?.length);
      console.log("========================");
      
      if (data) {
        setUserDetail(data);
      } else {
        toast({
          title: "ไม่พบข้อมูล",
          description: "ไม่พบข้อมูลผู้ใช้นี้",
          variant: "destructive",
        });
        router.push("/admin/users");
      }
    } catch (error) {
      console.error("Error loading user detail:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = (checked: boolean) => {
    const newRole = checked ? "admin" : "user";
    setPendingRole(newRole);
    setShowRoleDialog(true);
  };

  const confirmRoleChange = async () => {
    if (!pendingRole || !userDetail) return;

    try {
      setIsUpdatingRole(true);
      await adminUserService.toggleAdminRole(userDetail.profile.id, pendingRole === "admin");
      
      // Update local state
      setUserDetail({
        ...userDetail,
        profile: {
          ...userDetail.profile,
          role: pendingRole,
        },
      });

      toast({
        title: "อัปเดตสิทธิ์สำเร็จ",
        description: `เปลี่ยนสถานะเป็น ${pendingRole === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"} แล้ว`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสิทธิ์ได้",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
      setShowRoleDialog(false);
      setPendingRole(null);
    }
  };

  useEffect(() => {
    const calculateCosts = async () => {
      if (!userDetail) return;

      const activeSubscriptions = userDetail.subscriptions.filter(
        (sub) => sub.is_active
      );

      let totalMonthly = 0;
      
      for (const sub of activeSubscriptions) {
        const price = sub.amount || 0;
        const currency = sub.currency || "THB";
        
        // Convert to THB first
        const priceInTHB = await convertAmount(price, currency);
        
        const monthlyCost =
          sub.billing_cycle === "monthly"
            ? priceInTHB
            : sub.billing_cycle === "yearly"
            ? priceInTHB / 12
            : sub.billing_cycle === "quarterly"
            ? priceInTHB / 3
            : 0;
        totalMonthly += monthlyCost;
      }

      setCosts({
        monthly: totalMonthly,
        yearly: totalMonthly * 12,
      });
    };

    calculateCosts();
  }, [userDetail, convertAmount]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSubscriptionStats = () => {
    if (!userDetail) return { total: 0, active: 0, inactive: 0 };

    const total = userDetail.subscriptions.length;
    const active = userDetail.subscriptions.filter((sub) => sub.is_active).length;
    const inactive = total - active;

    return { total, active, inactive };
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AuthGuard>
    );
  }

  if (!userDetail) {
    return null;
  }

  const stats = getSubscriptionStats();

  // Helper for sync formatting of pre-calculated THB amounts
  const formatTHB = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <AuthGuard>
      <SEO
        title={`${userDetail.profile.full_name || "ผู้ใช้"} | จัดการผู้ใช้`}
        description="รายละเอียดผู้ใช้งาน"
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        {/* Header */}
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  กลับ
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  รายละเอียดผู้ใช้งาน
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  ข้อมูลและสถิติการใช้งาน
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* User Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                    {getCountryFlag(userDetail.profile.country) || 
                     userDetail.profile.full_name?.charAt(0).toUpperCase() || 
                     userDetail.profile.first_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {getUserDisplayName(
                        userDetail.profile.full_name,
                        userDetail.profile.first_name,
                        userDetail.profile.last_name,
                        userDetail.profile.email
                      )}
                    </h2>
                    {userDetail.profile.country && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 dark:text-slate-400">
                        <Globe className="w-4 h-4" />
                        <span>{getCountryDisplay(userDetail.profile.country)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  {userDetail.profile.role === "admin" ? (
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <User className="w-3 h-3 mr-1" />
                      User
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name & Last Name */}
                {(userDetail.profile.first_name || userDetail.profile.last_name) && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <User className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-slate-500">ชื่อ-นามสกุล</p>
                      <p className="text-sm font-medium">
                        {formatFullName(userDetail.profile.first_name, userDetail.profile.last_name)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-slate-500">อีเมล</p>
                    <p className="text-sm font-medium">
                      {userDetail.profile.email || "ไม่มีข้อมูล"}
                    </p>
                  </div>
                </div>

                {/* Country */}
                {userDetail.profile.country && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Globe className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-slate-500">ประเทศ</p>
                      <p className="text-sm font-medium">
                        {getCountryDisplay(userDetail.profile.country)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Created At */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-slate-500">วันที่สมัคร</p>
                    <p className="text-sm font-medium">
                      {formatDate(userDetail.profile.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Management Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                จัดการสิทธิ์การใช้งาน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {userDetail.profile.role === "admin" ? (
                    <ShieldCheck className="w-8 h-8 text-purple-600" />
                  ) : (
                    <User className="w-8 h-8 text-slate-600" />
                  )}
                  <div>
                    <p className="font-semibold text-lg">
                      {userDetail.profile.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {userDetail.profile.role === "admin" 
                        ? "มีสิทธิ์เข้าถึงระบบจัดการทั้งหมด" 
                        : "สิทธิ์การใช้งานระดับปกติ"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {userDetail.profile.role === "admin" ? "Admin" : "User"}
                  </span>
                  <Switch
                    checked={userDetail.profile.role === "admin"}
                    onCheckedChange={handleRoleToggle}
                    disabled={isUpdatingRole}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 px-4">
                ⚠️ การเปลี่ยนสิทธิ์จะมีผลทันที โปรดใช้ความระมัดระวัง
              </p>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Subscriptions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Subscriptions ทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Subscriptions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  กำลังใช้งาน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold">{stats.active}</span>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Cost */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  ค่าใช้จ่ายรายเดือน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">
                    {formatTHB(costs.monthly)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Yearly Cost */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  ค่าใช้จ่ายรายปี
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span className="text-2xl font-bold">
                    {formatTHB(costs.yearly)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscriptions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                รายการ Subscriptions ({userDetail.subscriptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userDetail.subscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">ยังไม่มี Subscription</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userDetail.subscriptions
                    .sort((a, b) => {
                      // Sort: active first, then by created_at
                      if (a.is_active && !b.is_active) return -1;
                      if (!a.is_active && b.is_active) return 1;
                      return (
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                      );
                    })
                    .map((subscription) => (
                      <div
                        key={subscription.id}
                        className={`border rounded-lg p-4 ${
                          subscription.is_active
                            ? "bg-white dark:bg-slate-800"
                            : "bg-slate-50 dark:bg-slate-900 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {subscription.name}
                              </h3>
                              {subscription.is_active ? (
                                <Badge className="bg-green-500 hover:bg-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  ใช้งาน
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  ไม่ใช้งาน
                                </Badge>
                              )}
                            </div>
                            {subscription.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {subscription.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                เริ่ม: {formatDate(subscription.start_date)}
                              </span>
                              {subscription.next_billing_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  ต่ออายุ: {formatDate(subscription.next_billing_date)}
                                </span>
                              )}
                              <span className="capitalize">
                                {subscription.billing_cycle === "monthly"
                                  ? "รายเดือน"
                                  : subscription.billing_cycle === "yearly"
                                  ? "รายปี"
                                  : subscription.billing_cycle === "quarterly"
                                  ? "รายไตรมาส"
                                  : subscription.billing_cycle}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-purple-600">
                              <PriceDisplay 
                                amount={subscription.amount || 0} 
                                currency={subscription.currency || "THB"} 
                              />
                            </div>
                            <div className="text-xs text-slate-500">
                              {subscription.billing_cycle === "monthly"
                                ? "ต่อเดือน"
                                : subscription.billing_cycle === "yearly"
                                ? "ต่อปี"
                                : subscription.billing_cycle === "quarterly"
                                ? "ต่อไตรมาส"
                                : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Role Change Confirmation Dialog */}
        <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                ยืนยันการเปลี่ยนสิทธิ์
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  คุณต้องการเปลี่ยนสิทธิ์ของ{" "}
                  <span className="font-semibold">
                    {getUserDisplayName(
                      userDetail?.profile.full_name,
                      userDetail?.profile.first_name,
                      userDetail?.profile.last_name,
                      userDetail?.profile.email
                    )}
                  </span>{" "}
                  เป็น
                </p>
                <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {pendingRole === "admin" ? (
                    <>
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-600">
                        ผู้ดูแลระบบ (Admin)
                      </span>
                    </>
                  ) : (
                    <>
                      <User className="w-5 h-5 text-slate-600" />
                      <span className="font-semibold text-slate-600">
                        ผู้ใช้ทั่วไป (User)
                      </span>
                    </>
                  )}
                </div>
                {pendingRole === "admin" && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 flex items-start gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      ผู้ดูแลระบบจะสามารถเข้าถึงข้อมูลและจัดการผู้ใช้ทั้งหมดในระบบได้
                    </span>
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isUpdatingRole}>
                ยกเลิก
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRoleChange}
                disabled={isUpdatingRole}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isUpdatingRole ? "กำลังอัปเดต..." : "ยืนยัน"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  );
}