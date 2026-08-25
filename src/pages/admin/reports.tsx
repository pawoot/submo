import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/AdminLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminDashboardService, DashboardStats } from "@/services/adminDashboardService";
import { BarChart3, CreditCard, Users, WalletCards } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const formatCurrency = (amount: number) => new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(amount);

export default function AdminReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminDashboardService.getDashboardStats()
      .then(setStats)
      .catch((error) => console.error("Error loading admin reports:", error))
      .finally(() => setLoading(false));
  }, []);

  const summary = [
    { label: "ผู้ใช้ทั้งหมด", value: stats?.totalUsers ?? 0, icon: Users, color: "text-violet-600" },
    { label: "รายการสมาชิก", value: stats?.totalSubscriptions ?? 0, icon: CreditCard, color: "text-pink-600" },
    { label: "รายการที่ใช้งาน", value: stats?.activeSubscriptions ?? 0, icon: WalletCards, color: "text-emerald-600" },
    { label: "มูลค่ารายเดือน", value: formatCurrency(stats?.totalMonthlyRevenue ?? 0), icon: BarChart3, color: "text-blue-600" },
  ];

  return (
    <AuthGuard requireAdmin>
      <AdminLayout>
        <main className="p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">รายงาน</h1>
            <p className="text-muted-foreground mt-1">ภาพรวมการใช้งานและรายการสมาชิกในระบบ</p>
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <Icon className={`h-8 w-8 ${color}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    {loading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="text-2xl font-bold">{value}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>บริการที่ถูกใช้งานมากที่สุด</CardTitle>
              <CardDescription>ห้าอันดับแรกจากรายการสมาชิกทั้งหมด</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[320px] w-full" />
              ) : stats?.topTemplates.length ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={stats.topTemplates} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="จำนวนรายการ" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-20 text-center text-muted-foreground">ยังไม่มีข้อมูลสำหรับสร้างรายงาน</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>รายงานเชิงเทคนิค</CardTitle>
              <CardDescription>ตรวจสอบการย้ายข้อมูลและสถานะ feature flags ของระบบ</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/migration-dashboard" className="text-primary underline underline-offset-4">
                เปิดหน้า Migration Dashboard
              </Link>
            </CardContent>
          </Card>
        </main>
      </AdminLayout>
    </AuthGuard>
  );
}
