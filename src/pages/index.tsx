import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, DollarSign, Users, Plus, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  // Mock data for demonstration
  const subscriptions = [
    {
      id: 1,
      name: "Adobe Creative Cloud",
      cost: 52.99,
      currency: "USD",
      billing: "monthly",
      nextBilling: "2026-01-15",
      category: "Design",
      paymentMethod: "Credit Card",
      sharedWith: 2,
      status: "active"
    },
    {
      id: 2,
      name: "Figma Professional",
      cost: 12,
      currency: "USD",
      billing: "monthly",
      nextBilling: "2026-01-20",
      category: "Design",
      paymentMethod: "Credit Card",
      sharedWith: 0,
      status: "active"
    },
    {
      id: 3,
      name: "GitHub Team",
      cost: 4,
      currency: "USD",
      billing: "monthly",
      nextBilling: "2026-01-10",
      category: "Development",
      paymentMethod: "Credit Card",
      sharedWith: 5,
      status: "active"
    },
    {
      id: 4,
      name: "Notion Team",
      cost: 8,
      currency: "USD",
      billing: "monthly",
      nextBilling: "2026-01-25",
      category: "Productivity",
      paymentMethod: "Credit Card",
      sharedWith: 3,
      status: "active"
    }
  ];

  const totalMonthly = subscriptions.reduce((sum, sub) => {
    if (sub.billing === "monthly") return sum + sub.cost;
    return sum + (sub.cost / 12);
  }, 0);

  const totalYearly = totalMonthly * 12;

  const getDaysUntilRenewal = (date: string) => {
    const today = new Date();
    const renewal = new Date(date);
    const diff = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <>
      <SEO 
        title="Subscription Manager - จัดการค่าใช้จ่าย Software"
        description="ระบบบริหารจัดการค่าใช้จ่าย Software Subscription ติดตามวันหมดอายุ แบ่งปันค่าใช้จ่าย และดูภาพรวมการใช้เงิน"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        {/* Header */}
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
              </div>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                เพิ่ม Subscription
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Stats Overview */}
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
                  ≈ ฿{(totalMonthly * 35).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
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
                  ≈ ฿{(totalYearly * 35).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
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
                  {subscriptions.filter(s => getDaysUntilRenewal(s.nextBilling) <= 7).length}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ภายใน 7 วัน
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscriptions List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                <span>รายการ Subscription</span>
                <Badge variant="secondary">{subscriptions.length} รายการ</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((sub) => {
                  const daysUntil = getDaysUntilRenewal(sub.nextBilling);
                  const isUrgent = daysUntil <= 7;

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
                            <Badge variant="outline" className="text-xs">{sub.category}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              ต่ออายุ: {new Date(sub.nextBilling).toLocaleDateString('th-TH', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              {sub.paymentMethod}
                            </span>
                            {sub.sharedWith > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                แบ่งกับ {sub.sharedWith} คน
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          ${sub.cost}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {sub.billing === "monthly" ? "ต่อเดือน" : "ต่อปี"}
                        </div>
                        {isUrgent && (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            เหลือ {daysUntil} วัน
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Empty State Example */}
          <div className="mt-8 p-8 text-center text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">คลิก "เพิ่ม Subscription" เพื่อเริ่มติดตามค่าใช้จ่าย Software ของคุณ</p>
          </div>
        </main>
      </div>
    </>
  );
}