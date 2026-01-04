import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CreditCard, Calendar, DollarSign, Users, Plus, TrendingUp, AlertCircle, Edit, Trash2, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionCharts } from "@/components/SubscriptionCharts";

interface Subscription {
  id: number;
  name: string;
  cost: number;
  currency: string;
  billing: string;
  nextBilling: string;
  category: string;
  paymentMethod: string;
  sharedWith: string[];
  status: string;
}

type SortOption = "name-asc" | "name-desc" | "cost-asc" | "cost-desc" | "date-asc" | "date-desc" | "category";

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [sortedSubscriptions, setSortedSubscriptions] = useState<Subscription[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("date-asc");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    sortSubscriptions(sortOption);
  }, [subscriptions, sortOption]);

  const loadSubscriptions = () => {
    const stored = localStorage.getItem("subscriptions");
    if (stored) {
      setSubscriptions(JSON.parse(stored));
    } else {
      const mockData = [
        {
          id: 1,
          name: "Adobe Creative Cloud",
          cost: 52.99,
          currency: "USD",
          billing: "monthly",
          nextBilling: "2026-01-15",
          category: "design",
          paymentMethod: "credit-card",
          sharedWith: ["user1@example.com", "user2@example.com"],
          status: "active"
        },
        {
          id: 2,
          name: "Figma Professional",
          cost: 12,
          currency: "USD",
          billing: "monthly",
          nextBilling: "2026-01-20",
          category: "design",
          paymentMethod: "credit-card",
          sharedWith: [],
          status: "active"
        },
        {
          id: 3,
          name: "GitHub Team",
          cost: 4,
          currency: "USD",
          billing: "monthly",
          nextBilling: "2026-01-10",
          category: "development",
          paymentMethod: "credit-card",
          sharedWith: ["dev1@example.com", "dev2@example.com", "dev3@example.com", "dev4@example.com", "dev5@example.com"],
          status: "active"
        },
        {
          id: 4,
          name: "Notion Team",
          cost: 8,
          currency: "USD",
          billing: "monthly",
          nextBilling: "2026-01-25",
          category: "productivity",
          paymentMethod: "credit-card",
          sharedWith: ["team1@example.com", "team2@example.com", "team3@example.com"],
          status: "active"
        }
      ];
      setSubscriptions(mockData);
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
          const costA = a.billing === "monthly" ? a.cost :
                       a.billing === "yearly" ? a.cost / 12 :
                       a.billing === "quarterly" ? a.cost / 3 :
                       a.billing === "biannually" ? a.cost / 6 : a.cost;
          const costB = b.billing === "monthly" ? b.cost :
                       b.billing === "yearly" ? b.cost / 12 :
                       b.billing === "quarterly" ? b.cost / 3 :
                       b.billing === "biannually" ? b.cost / 6 : b.cost;
          return costA - costB;
        });
        break;
      case "cost-desc":
        sorted.sort((a, b) => {
          const costA = a.billing === "monthly" ? a.cost :
                       a.billing === "yearly" ? a.cost / 12 :
                       a.billing === "quarterly" ? a.cost / 3 :
                       a.billing === "biannually" ? a.cost / 6 : a.cost;
          const costB = b.billing === "monthly" ? b.cost :
                       b.billing === "yearly" ? b.cost / 12 :
                       b.billing === "quarterly" ? b.cost / 3 :
                       b.billing === "biannually" ? b.cost / 6 : b.cost;
          return costB - costA;
        });
        break;
      case "date-asc":
        sorted.sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime());
        break;
      case "date-desc":
        sorted.sort((a, b) => new Date(b.nextBilling).getTime() - new Date(a.nextBilling).getTime());
        break;
      case "category":
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }
    
    setSortedSubscriptions(sorted);
  };

  const handleDelete = (id: number) => {
    const stored = localStorage.getItem("subscriptions");
    if (stored) {
      const subscriptions = JSON.parse(stored);
      const filtered = subscriptions.filter((s: Subscription) => s.id !== id);
      localStorage.setItem("subscriptions", JSON.stringify(filtered));
      loadSubscriptions();
      
      toast({
        title: "🗑️ ลบ Subscription สำเร็จ",
        description: "รายการถูกลบออกจากระบบแล้ว",
        duration: 3000,
      });
    }
    setDeleteId(null);
  };

  const totalMonthly = subscriptions.reduce((sum, sub) => {
    const cost = Number(sub.cost);
    if (sub.billing === "monthly") return sum + cost;
    if (sub.billing === "yearly") return sum + (cost / 12);
    if (sub.billing === "quarterly") return sum + (cost / 3);
    if (sub.billing === "biannually") return sum + (cost / 6);
    return sum;
  }, 0);

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

  return (
    <>
      <SEO 
        title="Subscription Manager - จัดการค่าใช้จ่าย Software"
        description="ระบบบริหารจัดการค่าใช้จ่าย Software Subscription ติดตามวันหมดอายุ แบ่งปันค่าใช้จ่าย และดูภาพรวมการใช้เงิน"
      />
      
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
              </div>
              <Link href="/add-subscription">
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  เพิ่ม Subscription
                </Button>
              </Link>
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
                  {subscriptions.filter(s => getDaysUntilRenewal(s.nextBilling) <= 7).length}
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
                    const daysUntil = getDaysUntilRenewal(sub.nextBilling);
                    const isUrgent = daysUntil <= 7;
                    const monthlyCost = sub.billing === "monthly" ? sub.cost :
                                       sub.billing === "yearly" ? sub.cost / 12 :
                                       sub.billing === "quarterly" ? sub.cost / 3 :
                                       sub.billing === "biannually" ? sub.cost / 6 : sub.cost;

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
                                ต่ออายุ: {new Date(sub.nextBilling).toLocaleDateString("th-TH", { 
                                  year: "numeric", 
                                  month: "short", 
                                  day: "numeric" 
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-4 h-4" />
                                {sub.paymentMethod.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                              </span>
                              {sub.sharedWith && sub.sharedWith.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  แบ่งกับ {sub.sharedWith.length} คน
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                              ${Number(sub.cost).toFixed(2)}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {sub.billing === "monthly" && "ต่อเดือน"}
                              {sub.billing === "yearly" && "ต่อปี"}
                              {sub.billing === "quarterly" && "ราย 3 เดือน"}
                              {sub.billing === "biannually" && "ราย 6 เดือน"}
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
    </>
  );
}