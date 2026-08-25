import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { adminUserService, UserWithSubscriptions } from "@/services/adminUserService";
import { profileService } from "@/services/profileService";
import { getCountryDisplay, formatFullName, getUserDisplayName } from "@/lib/countryUtils";
import {
  ArrowLeft,
  Search,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  ArrowUpDown,
  Globe,
} from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithSubscriptions[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithSubscriptions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchQuery, sortBy, subscriptionFilter, roleFilter]);

  const checkAdminAccess = async () => {
    try {
      const profile = await profileService.getCurrentProfile();
      if (!profile?.is_admin) {
        toast({
          title: "ไม่มีสิทธิ์เข้าถึง",
          description: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
          variant: "destructive",
        });
        router.push("/dashboard");
      } else {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถตรวจสอบสิทธิ์ได้",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await adminUserService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
      );
    }

    if (subscriptionFilter === "with-subscriptions") {
      filtered = filtered.filter((user) => user.subscription_count > 0);
    } else if (subscriptionFilter === "without-subscriptions") {
      filtered = filtered.filter((user) => user.subscription_count === 0);
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) =>
        roleFilter === "admin" ? user.is_admin || user.role === "admin" : !user.is_admin && user.role !== "admin"
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name":
          return (a.full_name || "").localeCompare(b.full_name || "");
        case "spending-high":
          return b.total_monthly_cost - a.total_monthly_cost;
        case "spending-low":
          return a.total_monthly_cost - b.total_monthly_cost;
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  };

  const formatCurrency = (amount: number, currency: string = "THB") => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <AuthGuard>
      <SEO
        title="จัดการผู้ใช้งาน | Admin Panel"
        description="จัดการผู้ใช้งานในระบบ"
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        {/* Header */}
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    กลับ
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    จัดการผู้ใช้งาน
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    คลิกที่ชื่อผู้ใช้เพื่อดูรายละเอียด
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  ผู้ใช้ทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold">{users.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Subscriptions ทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">
                    {users.reduce((sum, u) => sum + u.subscription_count, 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  รายได้รวม/เดือน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(
                      users.reduce((sum, u) => sum + u.total_monthly_cost, 0)
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle>รายการผู้ใช้งาน ({filteredUsers.length})</CardTitle>
                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
                  <div className="relative min-w-0 lg:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="ค้นหาชื่อหรืออีเมล"
                      className="pl-9"
                    />
                  </div>
                  <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                    <SelectTrigger><SelectValue placeholder="รายการสมาชิก" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">สมาชิกทั้งหมด</SelectItem>
                      <SelectItem value="with-subscriptions">มี Subscription</SelectItem>
                      <SelectItem value="without-subscriptions">ยังไม่มี Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger><SelectValue placeholder="สิทธิ์" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกสิทธิ์</SelectItem>
                      <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                      <SelectItem value="user">ผู้ใช้ทั่วไป</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger><SelectValue placeholder="เรียงลำดับ" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">สมัครใหม่ล่าสุด</SelectItem>
                      <SelectItem value="oldest">สมัครเก่าที่สุด</SelectItem>
                      <SelectItem value="name">ชื่อ A–Z</SelectItem>
                      <SelectItem value="spending-high">ค่าใช้จ่ายสูงสุด</SelectItem>
                      <SelectItem value="spending-low">ค่าใช้จ่ายต่ำสุด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">ไม่พบผู้ใช้งาน</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <Link
                      key={user.id}
                      href={`/admin/users/${user.id}`}
                      className="block"
                    >
                      <div className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">
                                {getUserDisplayName(
                                  user.full_name,
                                  user.first_name,
                                  user.last_name,
                                  user.email
                                )}
                              </h3>
                              {user.country && (
                                <Badge variant="outline" className="gap-1">
                                  <Globe className="w-3 h-3" />
                                  {getCountryDisplay(user.country)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {user.email || "ไม่มีข้อมูลติดต่อ"}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(user.created_at)}
                              </span>
                              <span>{user.subscription_count} Subscriptions</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-purple-600">
                              {formatCurrency(user.total_monthly_cost)}
                            </div>
                            <div className="text-xs text-slate-500">ต่อเดือน</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  );
}
