import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Save, Trash2, Users, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";
import { subscriptionService } from "@/services/subscriptionService";
import { AuthGuard } from "@/components/AuthGuard";
import type { Database } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

export default function EditSubscription() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [nextBillingDate, setNextBillingDate] = useState<Date>();

  const categories = [
    "Design", "Development", "Productivity", "Entertainment", 
    "Storage", "Communication", "Marketing", "Education", "Other"
  ];

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "THB", symbol: "฿", name: "Thai Baht" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  ];

  const paymentMethods = [
    "Credit Card", "Debit Card", "PayPal", "Bank Transfer", 
    "Google Pay", "Apple Pay", "Cryptocurrency", "Other"
  ];

  useEffect(() => {
    if (id) {
      loadSubscription();
    }
  }, [id]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getById(id as string);
      
      if (data) {
        setSubscription(data);
        setSharedUsers(data.shared_with || []);
        setStartDate(parseISO(data.start_date));
        setNextBillingDate(parseISO(data.next_billing_date));
      } else {
        toast({
          title: "❌ ไม่พบข้อมูล",
          description: "ไม่พบ Subscription ที่ต้องการแก้ไข",
          variant: "destructive",
          duration: 3000,
        });
        router.push("/");
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const addSharedUser = () => {
    if (newUserEmail && !sharedUsers.includes(newUserEmail)) {
      setSharedUsers([...sharedUsers, newUserEmail]);
      setNewUserEmail("");
    }
  };

  const removeSharedUser = (email: string) => {
    setSharedUsers(sharedUsers.filter(u => u !== email));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      if (!startDate || !nextBillingDate) {
        toast({
          title: "❌ กรุณาเลือกวันที่",
          description: "กรุณาเลือกวันเริ่มต้นและวันต่ออายุถัดไป",
          variant: "destructive",
          duration: 3000,
        });
        setIsSubmitting(false);
        return;
      }
      
      const updateData = {
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        description: formData.get("description") as string || null,
        amount: parseFloat(formData.get("cost") as string),
        currency: formData.get("currency") as string,
        billing_cycle: formData.get("billing") as string,
        payment_method: formData.get("paymentMethod") as string,
        card_last_4: formData.get("cardLast4") as string || null,
        start_date: format(startDate, "yyyy-MM-dd"),
        next_billing_date: format(nextBillingDate, "yyyy-MM-dd"),
        website_url: formData.get("website") as string || null,
        notes: formData.get("notes") as string || null,
        shared_with: sharedUsers.length > 0 ? sharedUsers : null,
      };

      await subscriptionService.update(id as string, updateData);

      toast({
        title: "✅ อัปเดตสำเร็จ!",
        description: `อัปเดต ${updateData.name} เรียบร้อยแล้ว`,
        duration: 3000,
      });

      router.push("/");
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
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

  if (!subscription) {
    return null;
  }

  return (
    <AuthGuard>
      <SEO 
        title="แก้ไข Subscription - Subscription Manager"
        description="แก้ไขข้อมูล Subscription และจัดการรายละเอียด"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        {/* Header */}
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">แก้ไข Subscription</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">{subscription.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">ชื่อ Subscription *</Label>
                      <Input 
                        id="name"
                        name="name"
                        placeholder="เช่น Adobe Creative Cloud"
                        defaultValue={subscription.name}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">หมวดหมู่ *</Label>
                      <Select name="category" required defaultValue={subscription.category}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="เลือกหมวดหมู่" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat.toLowerCase()}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">รายละเอียด</Label>
                    <Textarea 
                      id="description"
                      name="description"
                      placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                      rows={3}
                      defaultValue={subscription.description || ""}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Information */}
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลราคาและการชำระเงิน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cost">ราคา *</Label>
                      <Input 
                        id="cost"
                        name="cost"
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        defaultValue={subscription.amount}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">สกุลเงิน *</Label>
                      <Select name="currency" required defaultValue={subscription.currency}>
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="เลือกสกุลเงิน" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((curr) => (
                            <SelectItem key={curr.code} value={curr.code}>
                              {curr.symbol} {curr.code} - {curr.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing">รอบการชำระ *</Label>
                      <Select name="billing" required defaultValue={subscription.billing_cycle}>
                        <SelectTrigger id="billing">
                          <SelectValue placeholder="เลือกรอบ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">รายเดือน</SelectItem>
                          <SelectItem value="yearly">รายปี</SelectItem>
                          <SelectItem value="quarterly">ราย 3 เดือน</SelectItem>
                          <SelectItem value="half-yearly">ราย 6 เดือน</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">ช่องทางการชำระเงิน *</Label>
                      <Select name="paymentMethod" required defaultValue={subscription.payment_method}>
                        <SelectTrigger id="paymentMethod">
                          <SelectValue placeholder="เลือกช่องทาง" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method} value={method.toLowerCase().replace(/\s+/g, "-")}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardLast4">เลขท้าย 4 หลัก (ถ้ามี)</Label>
                      <Input 
                        id="cardLast4"
                        name="cardLast4"
                        placeholder="1234"
                        maxLength={4}
                        defaultValue={subscription.card_last_4 || ""}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Dates */}
              <Card>
                <CardHeader>
                  <CardTitle>วันที่เริ่มต้นและต่ออายุ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>วันเริ่มต้น *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? (
                              format(startDate, "d MMMM yyyy", { locale: th })
                            ) : (
                              <span>เลือกวันที่</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            locale={th}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>วันต่ออายุถัดไป *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !nextBillingDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {nextBillingDate ? (
                              format(nextBillingDate, "d MMMM yyyy", { locale: th })
                            ) : (
                              <span>เลือกวันที่</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={nextBillingDate}
                            onSelect={setNextBillingDate}
                            initialFocus
                            locale={th}
                            disabled={(date) =>
                              startDate ? date < startDate : false
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shared Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    แบ่งปันค่าใช้จ่าย
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="อีเมลผู้ใช้งานร่วม"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSharedUser();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={addSharedUser}
                      variant="outline"
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                  </div>

                  {sharedUsers.length > 0 && (
                    <div className="space-y-2">
                      <Label>ผู้ใช้งานร่วม ({sharedUsers.length} คน)</Label>
                      <div className="flex flex-wrap gap-2">
                        {sharedUsers.map((email) => (
                          <Badge 
                            key={email} 
                            variant="secondary"
                            className="gap-2 px-3 py-1"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeSharedUser(email)}
                              className="hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {sharedUsers.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      ยังไม่มีผู้ใช้งานร่วม
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลเพิ่มเติม</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">เว็บไซต์</Label>
                    <Input 
                      id="website"
                      name="website"
                      type="url"
                      placeholder="https://example.com"
                      defaultValue={subscription.website_url || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">หมายเหตุ</Label>
                    <Textarea 
                      id="notes"
                      name="notes"
                      placeholder="ข้อมูลเพิ่มเติม หรือหมายเหตุสำคัญ"
                      rows={3}
                      defaultValue={subscription.notes || ""}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-4">
                <Link href="/">
                  <Button type="button" variant="outline" size="lg" disabled={isSubmitting}>
                    ยกเลิก
                  </Button>
                </Link>
                <Button type="submit" size="lg" className="gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      บันทึกการเปลี่ยนแปลง
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </AuthGuard>
  );
}