import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Trash2, Users, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";

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
  description?: string;
  cardLast4?: string;
  startDate?: string;
  website?: string;
  notes?: string;
}

export default function EditSubscription() {
  const router = useRouter();
  const { id } = router.query;
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      const stored = localStorage.getItem("subscriptions");
      if (stored) {
        const subscriptions = JSON.parse(stored);
        const found = subscriptions.find((s: Subscription) => s.id === Number(id));
        if (found) {
          setSubscription(found);
          setSharedUsers(found.sharedWith || []);
        } else {
          router.push("/");
        }
      }
    }
  }, [id, router]);

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

    const formData = new FormData(e.currentTarget);
    const updatedData = {
      ...subscription,
      name: formData.get("name"),
      category: formData.get("category"),
      description: formData.get("description"),
      cost: Number(formData.get("cost")),
      currency: formData.get("currency"),
      billing: formData.get("billing"),
      paymentMethod: formData.get("paymentMethod"),
      cardLast4: formData.get("cardLast4"),
      startDate: formData.get("startDate"),
      nextBilling: formData.get("nextBilling"),
      website: formData.get("website"),
      notes: formData.get("notes"),
      sharedWith: sharedUsers,
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 1000));

    const stored = localStorage.getItem("subscriptions");
    if (stored) {
      const subscriptions = JSON.parse(stored);
      const index = subscriptions.findIndex((s: Subscription) => s.id === Number(id));
      if (index !== -1) {
        subscriptions[index] = updatedData;
        localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
      }
    }

    setIsSubmitting(false);

    toast({
      title: "✅ อัปเดต Subscription สำเร็จ!",
      description: `อัปเดต ${updatedData.name} เรียบร้อยแล้ว`,
      duration: 3000,
    });

    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="แก้ไข Subscription - Subscription Manager"
        description="แก้ไขข้อมูล Subscription และจัดการรายละเอียด"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
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

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
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
                        defaultValue={subscription.name}
                        placeholder="เช่น Adobe Creative Cloud"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">หมวดหมู่ *</Label>
                      <Select name="category" defaultValue={subscription.category} required>
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
                      defaultValue={subscription.description}
                      placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

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
                        defaultValue={subscription.cost}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">สกุลเงิน *</Label>
                      <Select name="currency" defaultValue={subscription.currency} required>
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
                      <Select name="billing" defaultValue={subscription.billing} required>
                        <SelectTrigger id="billing">
                          <SelectValue placeholder="เลือกรอบ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">รายเดือน</SelectItem>
                          <SelectItem value="yearly">รายปี</SelectItem>
                          <SelectItem value="quarterly">ราย 3 เดือน</SelectItem>
                          <SelectItem value="biannually">ราย 6 เดือน</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">ช่องทางการชำระเงิน *</Label>
                      <Select name="paymentMethod" defaultValue={subscription.paymentMethod} required>
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
                        defaultValue={subscription.cardLast4}
                        placeholder="1234"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>วันที่เริ่มต้นและต่ออายุ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">วันเริ่มต้น *</Label>
                      <Input 
                        id="startDate"
                        name="startDate"
                        type="date"
                        defaultValue={subscription.startDate}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nextBilling">วันต่ออายุถัดไป *</Label>
                      <Input 
                        id="nextBilling"
                        name="nextBilling"
                        type="date"
                        defaultValue={subscription.nextBilling}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                      <Plus className="w-4 h-4" />
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
                </CardContent>
              </Card>

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
                      defaultValue={subscription.website}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">หมายเหตุ</Label>
                    <Textarea 
                      id="notes"
                      name="notes"
                      defaultValue={subscription.notes}
                      placeholder="ข้อมูลเพิ่มเติม หรือหมายเหตุสำคัญ"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

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
                      บันทึกการแก้ไข
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}