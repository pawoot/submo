import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/AdminLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminDashboardService, DashboardStats } from "@/services/adminDashboardService";
import { Users, CreditCard, DollarSign, TrendingUp, Activity, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminDashboardService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AuthGuard requireAdmin>
      <AdminLayout>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              ภาพรวมและสถิติของระบบ SubMo
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ผู้ใช้ทั้งหมด
                </CardTitle>
                <Users className="w-5 h-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats?.totalUsers || 0}
                    </div>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +{stats?.newUsersThisMonth || 0} เดือนนี้
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Total Subscriptions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Subscriptions ทั้งหมด
                </CardTitle>
                <CreditCard className="w-5 h-5 text-pink-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats?.totalSubscriptions || 0}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {stats?.activeSubscriptions || 0} กำลังใช้งาน
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Monthly Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  รายได้ต่อเดือน
                </CardTitle>
                <DollarSign className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats?.totalMonthlyRevenue || 0)}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formatCurrency(stats?.totalYearlyRevenue || 0)} ต่อปี
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Active Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  อัตราการใช้งาน
                </CardTitle>
                <Activity className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats?.totalSubscriptions
                        ? Math.round(
                            ((stats.activeSubscriptions || 0) / stats.totalSubscriptions) * 100
                          )
                        : 0}
                      %
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      จากทั้งหมด {stats?.totalSubscriptions || 0} รายการ
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  การเติบโตของผู้ใช้
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats?.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="ผู้ใช้ใหม่"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Templates Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-pink-600" />
                  Template ยอดนิยม
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats?.topTemplates || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ec4899" name="จำนวนการใช้งาน" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Month */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                รายได้รายเดือน
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.revenueByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="revenue" fill="#10b981" name="รายได้" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/admin/users">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    จัดการผู้ใช้
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    ดู แก้ไข และจัดการข้อมูลผู้ใช้ทั้งหมด
                  </p>
                  <span className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                    ไปที่หน้าจัดการผู้ใช้ →
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/subscription-templates">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-pink-600" />
                    จัดการ Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    จัดการ Template Subscriptions ทั้งหมด
                  </p>
                  <span className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                    ไปที่หน้า Templates →
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/reports">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    ดูรายงาน
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    รายงานและวิเคราะห์ข้อมูลโดยละเอียด
                  </p>
                  <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    ไปที่หน้ารายงาน →
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}