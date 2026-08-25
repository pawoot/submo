import Link from "next/link";
import { AdminLayout } from "@/components/AdminLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Database, Folder, Package, ShieldCheck, Users } from "lucide-react";

const managementLinks = [
  { title: "ผู้ใช้", description: "ดูและจัดการสิทธิ์บัญชีผู้ใช้", href: "/admin/users", icon: Users },
  { title: "Templates", description: "แก้ไขรายการบริการสำเร็จรูป", href: "/admin/subscription-templates", icon: Package },
  { title: "หมวดหมู่", description: "จัดการหมวดหมู่สำหรับ subscriptions", href: "/admin/categories", icon: Folder },
  { title: "วิธีชำระเงิน", description: "เพิ่ม แก้ไข หรือลบวิธีชำระเงิน", href: "/admin/payment-methods", icon: CreditCard },
  { title: "การย้ายข้อมูล", description: "ตรวจสุขภาพข้อมูลและ feature flags", href: "/admin/migration-dashboard", icon: Database },
];

export default function AdminSettingsPage() {
  return (
    <AuthGuard requireAdmin>
      <AdminLayout>
        <main className="p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">ตั้งค่า</h1>
            <p className="mt-1 text-muted-foreground">เครื่องมือสำหรับดูแลการทำงานของ Submo</p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-start gap-3 space-y-0">
              <ShieldCheck className="mt-1 h-6 w-6 text-emerald-600" />
              <div>
                <CardTitle>สิทธิ์ผู้ดูแลระบบ</CardTitle>
                <CardDescription className="mt-1">หน้านี้เข้าถึงได้เฉพาะบัญชีที่ได้รับสิทธิ์ admin</CardDescription>
              </div>
              <Badge className="ml-auto">Protected</Badge>
            </CardHeader>
          </Card>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {managementLinks.map(({ title, description, href, icon: Icon }) => (
              <Card key={href} className="flex flex-col">
                <CardHeader>
                  <Icon className="mb-2 h-6 w-6 text-primary" />
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={href}>เปิดการตั้งค่า</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>
        </main>
      </AdminLayout>
    </AuthGuard>
  );
}
