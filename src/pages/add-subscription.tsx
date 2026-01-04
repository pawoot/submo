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
import { ArrowLeft, Plus, Trash2, Users, CalendarIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";
import { subscriptionService } from "@/services/subscriptionService";
import { subscriptionTemplateService } from "@/services/subscriptionTemplateService";
import { AuthGuard } from "@/components/AuthGuard";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SubscriptionTemplateBrowser } from "@/components/SubscriptionTemplateBrowser";
import { SubscriptionNameAutocomplete } from "@/components/SubscriptionNameAutocomplete";
import type { Database } from "@/integrations/supabase/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";

type SubscriptionTemplate = Database["public"]["Tables"]["subscription_templates"]["Row"];

// Validation Schema
const subscriptionSchema = z.object({
  name: z.string()
    .min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  category: z.string()
    .min(1, "กรุณาเลือกหมวดหมู่"),
  description: z.string()
    .max(500, "รายละเอียดต้องไม่เกิน 500 ตัวอักษร")
    .optional()
    .nullable(),
  cost: z.string()
    .min(1, "กรุณากรอกจำนวนเงิน")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "จำนวนเงินต้องมากกว่า 0"
    })
    .refine((val) => Number(val) <= 999999.99, {
      message: "จำนวนเงินต้องไม่เกิน 999,999.99"
    }),
  currency: z.string()
    .min(1, "กรุณาเลือกสกุลเงิน"),
  billing: z.string()
    .min(1, "กรุณาเลือกรอบการชำระเงิน"),
  paymentMethod: z.string()
    .min(1, "กรุณาเลือกวิธีการชำระเงิน"),
  cardLast4: z.string()
    .max(4, "เลขท้ายบัตรต้องไม่เกิน 4 หลัก")
    .optional()
    .nullable(),
  website: z.string()
    .url("รูปแบบ URL ไม่ถูกต้อง")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z.string()
    .max(500, "หมายเหตุต้องไม่เกิน 500 ตัวอักษร")
    .optional()
    .nullable(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

export default function AddSubscription() {
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [nextBillingDate, setNextBillingDate] = useState<Date>();
  const [dateError, setDateError] = useState("");
  const [popularTemplates, setPopularTemplates] = useState<SubscriptionTemplate[]>([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SubscriptionTemplate | null>(null);
  const [subscriptionName, setSubscriptionName] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const { preferredCurrency, isLoading: currencyLoading } = useCurrency();
  const { t } = useLanguage();

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      currency: "USD",
      billing: "monthly",
      paymentMethod: "credit-card",
    },
  });

  useEffect(() => {
    loadPopularTemplates();
  }, []);

  useEffect(() => {
    if (preferredCurrency && !currencyLoading) {
      setValue("currency", preferredCurrency);
    }
  }, [preferredCurrency, currencyLoading, setValue]);

  const loadPopularTemplates = async () => {
    try {
      const templates = await subscriptionTemplateService.getPopularTemplates(6);
      setPopularTemplates(templates);
    } catch (error) {
      console.error("Error loading popular templates:", error);
    }
  };

  const handleTemplateSelect = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    setSubscriptionName(template.name);
    
    // Auto-fill form with template data using setValue
    if (template.category) {
      setValue("category", template.category);
    }
    if (template.default_price) {
      setValue("cost", template.default_price.toString());
    }
    if (template.default_currency) {
      setValue("currency", template.default_currency);
    }
    if (template.default_billing_cycle) {
      setValue("billing", template.default_billing_cycle);
    }
    if (template.website_url) {
      setValue("website", template.website_url);
    }

    toast({
      title: "✅ เลือกบริการสำเร็จ!",
      description: `กรอกข้อมูล ${template.name} อัตโนมัติแล้ว`,
      duration: 3000,
    });
  };

  const handleAutocompleteTemplateSelect = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    setSubscriptionName(template.name);
    
    // Auto-fill form with template data using setValue
    if (template.category) {
      setValue("category", template.category);
    }
    if (template.default_price) {
      setValue("cost", template.default_price.toString());
    }
    if (template.default_currency) {
      setValue("currency", template.default_currency);
    }
    if (template.default_billing_cycle) {
      setValue("billing", template.default_billing_cycle);
    }
    if (template.website_url) {
      setValue("website", template.website_url);
    }

    toast({
      title: "✅ เลือกบริการสำเร็จ!",
      description: `กรอกข้อมูล ${template.name} อัตโนมัติแล้ว`,
      duration: 3000,
    });
  };

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

  const addSharedUser = () => {
    if (!newUserEmail) {
      setEmailError("กรุณากรอกอีเมล");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      setEmailError("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    if (sharedUsers.includes(newUserEmail)) {
      setEmailError("อีเมลนี้มีอยู่ในรายการแล้ว");
      return;
    }

    setSharedUsers([...sharedUsers, newUserEmail]);
    setNewUserEmail("");
    setEmailError("");
  };

  const removeSharedUser = (email: string) => {
    setSharedUsers(sharedUsers.filter(u => u !== email));
  };

  const handleSubmit = async (data: SubscriptionFormData) => {
    // Validate dates
    if (!startDate || !nextBillingDate) {
      setDateError("กรุณาเลือกวันที่เริ่มต้นและวันต่ออายุถัดไป");
      toast({
        title: "❌ กรุณาเลือกวันที่",
        description: "กรุณาเลือกวันเริ่มต้นและวันต่ออายุถัดไป",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (nextBillingDate <= startDate) {
      setDateError("วันต่ออายุต้องหลังวันเริ่มต้น");
      toast({
        title: "❌ วันที่ไม่ถูกต้อง",
        description: "วันต่ออายุต้องหลังวันเริ่มต้น",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setDateError("");
    setIsSubmitting(true);

    try {
      const subscriptionData = {
        name: subscriptionName,
        category: data.category,
        description: data.description || null,
        amount: parseFloat(data.cost),
        currency: data.currency,
        billing_cycle: data.billing,
        payment_method: data.paymentMethod,
        card_last_4: data.cardLast4 || null,
        start_date: format(startDate, "yyyy-MM-dd"),
        next_billing_date: format(nextBillingDate, "yyyy-MM-dd"),
        website_url: data.website || null,
        notes: data.notes || null,
        shared_with: sharedUsers.length > 0 ? sharedUsers : null,
      };

      await subscriptionService.create(subscriptionData);

      toast({
        title: "✅ เพิ่ม Subscription สำเร็จ!",
        description: `เพิ่ม ${subscriptionData.name} เรียบร้อยแล้ว`,
        duration: 3000,
      });

      router.push("/");
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่ม Subscription ได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <SEO 
        title="เพิ่ม Subscription - Subscription Manager"
        description="เพิ่มรายการ Subscription ใหม่ ติดตามค่าใช้จ่าย และจัดการวันหมดอายุ"
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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">เพิ่ม Subscription</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">กรอกข้อมูลรายการใหม่</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <form onSubmit={handleFormSubmit(handleSubmit)} id="subscription-form">
            <div className="space-y-6">
              {/* Quick Add Section */}
              <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-blue-900 dark:text-blue-100">Quick Add</CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBrowser(true)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      Browse all →
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {popularTemplates.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      {popularTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateSelect(template)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200",
                            "hover:scale-105 hover:shadow-lg",
                            "bg-white dark:bg-slate-800 border-2",
                            selectedTemplate?.id === template.id
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                          )}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-sm">
                            <img
                              src={template.logo_url}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center truncate w-full">
                            {template.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>กำลังโหลดบริการยอดนิยม...</p>
                    </div>
                  )}
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-4 text-center">
                    💡 เลือกบริการที่ต้องการ หรือคลิก "Browse all" เพื่อดูทั้งหมด
                  </p>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">ชื่อ Subscription *</Label>
                      <SubscriptionNameAutocomplete
                        value={subscriptionName}
                        onChange={setSubscriptionName}
                        onTemplateSelect={handleAutocompleteTemplateSelect}
                        disabled={isSubmitting}
                        selectedTemplate={selectedTemplate}
                      />
                      <input
                        type="hidden"
                        id="name"
                        name="name"
                        value={subscriptionName}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">หมวดหมู่ *</Label>
                      <Select {...register("category")} required>
                        <SelectTrigger id="category" className={cn(errors.category && "border-red-500")}>
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
                      {errors.category && (
                        <p className="text-sm text-red-500">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">รายละเอียด</Label>
                    <Textarea 
                      id="description"
                      {...register("description")}
                      placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                      rows={3}
                      className={cn(errors.description && "border-red-500")}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">เว็บไซต์</Label>
                    <Input 
                      id="website"
                      {...register("website")}
                      type="url"
                      placeholder="https://example.com"
                      className={cn(errors.website && "border-red-500")}
                    />
                    {errors.website && (
                      <p className="text-sm text-red-500">{errors.website.message}</p>
                    )}
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
                        {...register("cost")}
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        className={cn(errors.cost && "border-red-500")}
                        required
                      />
                      {errors.cost && (
                        <p className="text-sm text-red-500">{errors.cost.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">สกุลเงิน *</Label>
                      <Select {...register("currency")} required defaultValue="USD">
                        <SelectTrigger id="currency" className={cn(errors.currency && "border-red-500")}>
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
                      {errors.currency && (
                        <p className="text-sm text-red-500">{errors.currency.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing">รอบการชำระ *</Label>
                      <Select {...register("billing")} required defaultValue="monthly">
                        <SelectTrigger id="billing" className={cn(errors.billing && "border-red-500")}>
                          <SelectValue placeholder="เลือกรอบ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">รายเดือน</SelectItem>
                          <SelectItem value="yearly">รายปี</SelectItem>
                          <SelectItem value="quarterly">ราย 3 เดือน</SelectItem>
                          <SelectItem value="half-yearly">ราย 6 เดือน</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.billing && (
                        <p className="text-sm text-red-500">{errors.billing.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">ช่องทางการชำระเงิน *</Label>
                      <Select {...register("paymentMethod")} required defaultValue="credit-card">
                        <SelectTrigger id="paymentMethod" className={cn(errors.paymentMethod && "border-red-500")}>
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
                      {errors.paymentMethod && (
                        <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardLast4">เลขท้าย 4 หลัก (ถ้ามี)</Label>
                      <Input 
                        id="cardLast4"
                        {...register("cardLast4")}
                        placeholder="1234"
                        maxLength={4}
                        className={cn(errors.cardLast4 && "border-red-500")}
                      />
                      {errors.cardLast4 && (
                        <p className="text-sm text-red-500">{errors.cardLast4.message}</p>
                      )}
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
                              !startDate && "text-muted-foreground",
                              dateError && "border-red-500"
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
                              !nextBillingDate && "text-muted-foreground",
                              dateError && "border-red-500"
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

                  {dateError && (
                    <p className="text-sm text-red-500">{dateError}</p>
                  )}

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      💡 <strong>คำแนะนำ:</strong> วันต่ออายุถัดไปจะถูกใช้ในการแจ้งเตือนและคำนวณค่าใช้จ่าย
                    </p>
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
                    <div className="flex-1">
                      <Input 
                        placeholder="อีเมลผู้ใช้งานร่วม"
                        value={newUserEmail}
                        onChange={(e) => {
                          setNewUserEmail(e.target.value);
                          setEmailError("");
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSharedUser();
                          }
                        }}
                        className={cn(emailError && "border-red-500")}
                      />
                      {emailError && (
                        <p className="text-sm text-red-500 mt-1">{emailError}</p>
                      )}
                    </div>
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
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          ค่าใช้จ่ายต่อคน: <span className="font-semibold">จะคำนวณอัตโนมัติ</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {sharedUsers.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      ยังไม่มีผู้ใช้งานร่วม - คุณจ่ายค่าใช้จ่ายคนเดียว
                    </p>
                  )}
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
                      <Plus className="w-5 h-5" />
                      บันทึก Subscription
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </main>
      </div>

      {/* Subscription Template Browser */}
      <SubscriptionTemplateBrowser
        open={showBrowser}
        onOpenChange={setShowBrowser}
        onSelect={handleTemplateSelect}
      />
    </AuthGuard>
  );
}