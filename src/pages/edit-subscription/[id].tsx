import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Save, Trash2, CalendarIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";
import { subscriptionService } from "@/services/subscriptionService";
import { AuthGuard } from "@/components/AuthGuard";
import { SubscriptionNameAutocomplete } from "@/components/SubscriptionNameAutocomplete";
import { SubscriptionSummary } from "@/components/SubscriptionSummary";
import { SubscriptionIntelligence } from "@/components/SubscriptionIntelligence";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SubscriptionTemplate } from "@/services/subscriptionTemplateService";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

export default function EditSubscription() {
  const router = useRouter();
  const rawId = router.query.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAmountChangeDialog, setShowAmountChangeDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<SubscriptionFormData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbPaymentMethods, setDbPaymentMethods] = useState<PaymentMethod[]>([]);
  const [existingSubscriptions, setExistingSubscriptions] = useState<any[]>([]);

  // Validation Schema - เพิ่ม fields ใหม่
  const subscriptionSchema = z.object({
    name: z.string()
      .min(2, t("validation.minLength") + " 2 " + t("validation.characters"))
      .max(100, t("validation.maxLength") + " 100 " + t("validation.characters"))
      .refine((val) => val.trim().length >= 2, {
        message: t("validation.required")
      }),
    category_id: z.string()
      .min(1, t("validation.required")),
    description: z.string()
      .max(500, t("validation.maxLength") + " 500 " + t("validation.characters"))
      .optional()
      .nullable(),
    amount: z.string()
      .min(1, t("validation.required"))
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: t("validation.positiveNumber")
      })
      .refine((val) => Number(val) <= 999999.99, {
        message: t("validation.maxLength") + " 999,999.99"
      })
      .refine((val) => {
        const num = Number(val);
        return Number.isFinite(num) && num.toFixed(2) === num.toString() || val.split('.')[1]?.length <= 2;
      }, {
        message: "รองรับทศนิยมสูงสุด 2 ตำแหน่ง"
      }),
    currency: z.string()
      .min(1, t("validation.required"))
      .length(3, "รหัสสกุลเงินต้องมี 3 ตัวอักษร"),
    billing_cycle: z.string()
      .min(1, t("validation.required"))
      .refine((val) => ['monthly', 'yearly', 'quarterly', 'half-yearly'].includes(val), {
        message: "กรุณาเลือกรอบบิลที่ถูกต้อง"
      }),
    payment_method_id: z.string()
      .min(1, t("validation.required")),
    card_last_4: z.string()
      .max(4, t("validation.maxLength") + " 4")
      .refine((val) => !val || /^\d{4}$/.test(val), {
        message: "หมายเลขบัตรท้าย 4 หลักต้องเป็นตัวเลขเท่านั้น"
      })
      .optional()
      .nullable(),
    website_url: z.string()
      .refine((val) => {
        if (!val || val === "") return true;
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      }, {
        message: t("validation.invalidUrl")
      })
      .optional()
      .nullable()
      .or(z.literal("")),
    notes: z.string()
      .max(500, t("validation.maxLength") + " 500 " + t("validation.characters"))
      .optional()
      .nullable(),
    start_date: z.date({
      required_error: t("validation.required"),
      invalid_type_error: t("validation.invalidDate"),
    })
      .refine((date) => date <= new Date(), {
        message: "วันเริ่มต้นต้องไม่เกินวันที่ปัจจุบัน"
      }),
    next_billing_date: z.date({
      required_error: t("validation.required"),
      invalid_type_error: t("validation.invalidDate"),
    }),
    reminder_enabled: z.boolean().optional(),
    reminder_days: z.coerce.number()
      .min(1, "ต้องแจ้งเตือนล่วงหน้าอย่างน้อย 1 วัน")
      .max(30, "แจ้งเตือนล่วงหน้าได้สูงสุด 30 วัน")
      .optional(),
    auto_renew: z.boolean().optional(),
    usage_frequency: z.enum(["often", "sometimes", "rarely"]).optional(),
  }).refine((data) => data.next_billing_date > data.start_date, {
    message: "วันต่ออายุต้องหลังจากวันเริ่มต้น",
    path: ["next_billing_date"],
  }).refine((data) => {
    if (data.reminder_enabled && !data.reminder_days) {
      return false;
    }
    return true;
  }, {
    message: "กรุณาระบุจำนวนวันแจ้งเตือนล่วงหน้า",
    path: ["reminder_days"],
  });

  type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    reset,
    control,
    watch,
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
  });

  const watchedValues = watch();

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "THB", symbol: "฿", name: "Thai Baht" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  ];

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        // Load all data in parallel
        const [categoriesData, paymentMethodsData, subscriptionData, allSubscriptionsData] = await Promise.all([
          supabase.from("categories").select("*").order("name_en"),
          supabase.from("payment_methods").select("*").order("name_en"),
          supabase
            .from("subscriptions")
            .select(`
              *,
              categories (*),
              payment_methods (*)
            `)
            .eq("id", id)
            .single(),
          subscriptionService.getUserSubscriptions()
        ]);

        if (categoriesData.data) setDbCategories(categoriesData.data);
        if (paymentMethodsData.data) setDbPaymentMethods(paymentMethodsData.data);
        if (allSubscriptionsData) setExistingSubscriptions(allSubscriptionsData);

        if (subscriptionData.error) throw subscriptionData.error;
        setSubscription(subscriptionData.data);

        // Pre-fill form with all fields
        if (subscriptionData.data) {
          reset({
            name: subscriptionData.data.name,
            category_id: subscriptionData.data.category_id,
            description: subscriptionData.data.description || "",
            amount: subscriptionData.data.amount.toString(),
            currency: subscriptionData.data.currency,
            billing_cycle: subscriptionData.data.billing_cycle,
            payment_method_id: subscriptionData.data.payment_method_id,
            card_last_4: subscriptionData.data.card_last_4 || "",
            website_url: subscriptionData.data.website_url || "",
            notes: subscriptionData.data.notes || "",
            start_date: new Date(subscriptionData.data.start_date),
            next_billing_date: new Date(subscriptionData.data.next_billing_date),
            reminder_enabled: subscriptionData.data.reminder_enabled || false,
            reminder_days: subscriptionData.data.reminder_days || 7,
            auto_renew: subscriptionData.data.auto_renew ?? true,
            usage_frequency: subscriptionData.data.usage_frequency as "often" | "sometimes" | "rarely" | undefined,
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load subscription data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadSubscription();
    }
  }, [id, reset, toast]);

  const handleAutocompleteTemplateSelect = (template: SubscriptionTemplate) => {
    setValue("name", template.name, { shouldValidate: true });
    
    if (template.categories?.slug) {
      const matchingCat = dbCategories.find(c => c.slug === template.categories?.slug);
      if (matchingCat) {
        setValue("category_id", matchingCat.id, { shouldValidate: true });
      }
    }
    if (template.amount) {
      setValue("amount", template.amount.toString(), { shouldValidate: true });
    }
    if (template.currency) {
      setValue("currency", template.currency, { shouldValidate: true });
    }
    if (template.billing_cycle) {
      setValue("billing_cycle", template.billing_cycle as "monthly" | "yearly" | "quarterly" | "half-yearly", { shouldValidate: true });
    }
    if (template.website_url) {
      setValue("website_url", template.website_url, { shouldValidate: true });
    }

    toast({
      title: t("addSub.templateSelected"),
      description: t("addSub.templateSelectedDesc"),
      duration: 3000,
    });
  };

  const handleSubmit = async (data: SubscriptionFormData) => {
    if (!id) {
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่พบรหัส Subscription",
        variant: "destructive",
      });
      return;
    }

    // Check for changes
    if (subscription) {
      const hasChanges = 
        data.name !== subscription.name ||
        parseFloat(data.amount) !== subscription.amount ||
        data.currency !== subscription.currency ||
        data.billing_cycle !== subscription.billing_cycle ||
        data.category_id !== subscription.category_id ||
        data.payment_method_id !== subscription.payment_method_id ||
        data.next_billing_date.toISOString() !== new Date(subscription.next_billing_date).toISOString() ||
        data.reminder_enabled !== subscription.reminder_enabled ||
        data.reminder_days !== subscription.reminder_days ||
        data.auto_renew !== subscription.auto_renew ||
        (data.website_url || "") !== (subscription.website_url || "") ||
        (data.description || "") !== (subscription.description || "") ||
        (data.usage_frequency || "") !== (subscription.usage_frequency || "") ||
        (data.notes || "") !== (subscription.notes || "");

      if (!hasChanges) {
        toast({
          title: "ℹ️ ไม่มีการเปลี่ยนแปลง",
          description: "ข้อมูลยังคงเหมือนเดิม",
          variant: "default",
        });
        return;
      }

      // Check for significant amount decrease
      const oldAmount = subscription.amount;
      const newAmount = parseFloat(data.amount);
      if (newAmount < oldAmount * 0.5) {
        setPendingFormData(data);
        setShowAmountChangeDialog(true);
        return;
      }
    }

    await submitForm(data);
  };

  const submitForm = async (data: SubscriptionFormData) => {
    setIsSubmitting(true);
    try {
      if (!data.category_id || !data.payment_method_id) {
        throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
      }

      const updates = {
        name: data.name.trim(),
        amount: parseFloat(data.amount),
        currency: data.currency,
        billing_cycle: data.billing_cycle,
        next_billing_date: data.next_billing_date.toISOString(),
        category_id: data.category_id,
        payment_method_id: data.payment_method_id,
        reminder_enabled: data.reminder_enabled || false,
        reminder_days: data.reminder_days || 7,
        auto_renew: data.auto_renew ?? true,
        description: data.description?.trim() || null,
        website_url: data.website_url?.trim() || null,
        usage_frequency: data.usage_frequency || null,
        notes: data.notes?.trim() || null,
        card_last_4: data.card_last_4 || null,
      };

      await subscriptionService.updateSubscription(id as string, updates);

      toast({
        title: "✅ บันทึกข้อมูลสำเร็จ",
        description: `อัปเดตข้อมูล "${data.name}" เรียบร้อยแล้ว`,
        variant: "default",
      });

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowAmountChangeDialog(false);
      setPendingFormData(null);
    }
  };

  const handleDelete = async () => {
    if (!subscription) return;

    try {
      await subscriptionService.delete(id as string);

      toast({
        title: "✅ ลบรายการสำเร็จ",
        description: `ลบ "${subscription.name}" เรียบร้อยแล้ว`,
        variant: "default",
      });

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }

    setShowDeleteDialog(false);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">{t("common.loading")}</p>
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
        title={t("editSub.title") + " - Submo.ai"}
        description={t("editSub.title")}
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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("editSub.title")}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">{subscription?.name}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Form Area - 2 columns */}
            <div className="lg:col-span-2">
              {/* Current Subscription Summary */}
              <Card className="mb-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <SubscriptionIcon
                      name={subscription.name}
                      websiteUrl={subscription.website_url}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {subscription.name}
                      </h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">
                          {language === 'th' 
                            ? dbCategories.find(c => c.id === subscription.category_id)?.name_th 
                            : dbCategories.find(c => c.id === subscription.category_id)?.name_en}
                        </Badge>
                        <Badge variant="outline">
                          {subscription.amount} {subscription.currency} / {subscription.billing_cycle === 'monthly' ? t("addSub.billingMonthly") : subscription.billing_cycle === 'yearly' ? t("addSub.billingYearly") : subscription.billing_cycle}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <form onSubmit={handleFormSubmit(handleSubmit)} id="subscription-form">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader>
                      <CardTitle>{t("addSub.basicInfo")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name with Autocomplete */}
                        <div className="space-y-2">
                          <Label htmlFor="name">
                            {t("addSub.name")} <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                              <SubscriptionNameAutocomplete
                                value={field.value}
                                onChange={field.onChange}
                                onSelectTemplate={handleAutocompleteTemplateSelect}
                                error={errors.name?.message}
                              />
                            )}
                          />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                          <Label htmlFor="category_id">
                            {t("addSub.category")} <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="category_id"
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("addSub.selectCategory")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {dbCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {language === 'th' ? cat.name_th : cat.name_en}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.category_id && (
                            <p className="text-sm text-red-500">{errors.category_id.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">{t("addSub.description")}</Label>
                        <Textarea
                          id="description"
                          {...register("description")}
                          placeholder={t("addSub.descriptionPlaceholder")}
                          className={cn("min-h-[100px]", errors.description && "border-red-500")}
                        />
                        {errors.description && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <span>⚠️</span>
                            {errors.description.message}
                          </p>
                        )}
                      </div>

                      {/* Website URL */}
                      <div className="space-y-2">
                        <Label htmlFor="website_url">
                          {t("addSub.websiteUrl")} ({t("common.optional")})
                        </Label>
                        <Input
                          id="website_url"
                          {...register("website_url")}
                          type="url"
                          placeholder="https://example.com"
                          className={cn(errors.website_url && "border-red-500")}
                        />
                        <p className="text-xs text-slate-500">
                          💡 {language === 'th' ? 'ใช้สำหรับแสดงไอคอนเว็บไซต์' : 'Used to display website icon'}
                        </p>
                        {errors.website_url && (
                          <p className="text-sm text-red-500">{errors.website_url.message}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing Information */}
                  <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader>
                      <CardTitle>{t("addSub.pricingInfo")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">{t("addSub.cost")} *</Label>
                          <Input 
                            id="amount"
                            {...register("amount")}
                            type="number" 
                            step="0.01" 
                            placeholder={t("addSub.costPlaceholder")}
                            className={cn(errors.amount && "border-red-500")}
                          />
                          {errors.amount && (
                            <p className="text-sm text-red-500">{errors.amount.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency">{t("addSub.currency")} *</Label>
                          <Controller
                            name="currency"
                            control={control}
                            render={({ field }) => (
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger id="currency" className={cn(errors.currency && "border-red-500")}>
                                  <SelectValue placeholder={t("addSub.selectCurrency")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencies.map((curr) => (
                                    <SelectItem key={curr.code} value={curr.code}>
                                      {curr.symbol} {curr.code} - {curr.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.currency && (
                            <p className="text-sm text-red-500">{errors.currency.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="billing_cycle">{t("addSub.billing")} *</Label>
                          <Controller
                            name="billing_cycle"
                            control={control}
                            render={({ field }) => (
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger id="billing_cycle" className={cn(errors.billing_cycle && "border-red-500")}>
                                  <SelectValue placeholder={t("addSub.selectBilling")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">{t("addSub.billingMonthly")}</SelectItem>
                                  <SelectItem value="yearly">{t("addSub.billingYearly")}</SelectItem>
                                  <SelectItem value="quarterly">{t("subscriptions.quarterly")}</SelectItem>
                                  <SelectItem value="half-yearly">{t("subscriptions.halfYearly")}</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.billing_cycle && (
                            <p className="text-sm text-red-500">{errors.billing_cycle.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="payment_method_id">{t("subscription.payment_method")} *</Label>
                          <Controller
                            name="payment_method_id"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="payment_method_id">
                                  <SelectValue placeholder={t("payment.select_method")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {dbPaymentMethods.map((method) => (
                                    <SelectItem key={method.id} value={method.id}>
                                      <span className="flex items-center gap-2">
                                        <span>{method.icon}</span>
                                        <span>{language === 'th' ? method.name_th : method.name_en}</span>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.payment_method_id && (
                            <p className="text-sm text-red-500">{errors.payment_method_id.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="card_last_4">{t("addSub.cardNumber")} ({t("common.optional")})</Label>
                          <Input 
                            id="card_last_4"
                            {...register("card_last_4")}
                            placeholder={t("addSub.cardPlaceholder")}
                            maxLength={4}
                            className={cn(errors.card_last_4 && "border-red-500")}
                          />
                          {errors.card_last_4 && (
                            <p className="text-sm text-red-500">{errors.card_last_4.message}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment & Dates */}
                  <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader>
                      <CardTitle>{t("addSub.paymentInfo")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("addSub.startDate")} *</Label>
                          <Controller
                            name="start_date"
                            control={control}
                            render={({ field }) => (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                      errors.start_date && "border-red-500"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, "d MMMM yyyy", { locale: language === 'th' ? th : enUS })
                                    ) : (
                                      <span>{t("common.select")}</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            )}
                          />
                          {errors.start_date && (
                            <p className="text-sm text-red-500">{errors.start_date.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("addSub.nextBillingDate")} *</Label>
                          <Controller
                            name="next_billing_date"
                            control={control}
                            render={({ field }) => (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                      errors.next_billing_date && "border-red-500"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, "d MMMM yyyy", { locale: language === 'th' ? th : enUS })
                                    ) : (
                                      <span>{t("common.select")}</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            )}
                          />
                          {errors.next_billing_date && (
                            <p className="text-sm text-red-500">{errors.next_billing_date.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Reminder Settings */}
                      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <Label className="text-base">{t("addSub.reminderSettings")}</Label>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="reminder_enabled" className="cursor-pointer">
                              {t("addSub.enableReminder")}
                            </Label>
                            <p className="text-xs text-slate-500">
                              {language === 'th' ? 'เปิดการแจ้งเตือนก่อนวันต่ออายุ' : 'Enable notifications before renewal'}
                            </p>
                          </div>
                          <Controller
                            name="reminder_enabled"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                id="reminder_enabled"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>

                        {watchedValues.reminder_enabled && (
                          <div className="space-y-2">
                            <Label htmlFor="reminder_days">
                              {t("addSub.reminderDays")} *
                            </Label>
                            <Input
                              id="reminder_days"
                              type="number"
                              min="1"
                              max="30"
                              {...register("reminder_days", { valueAsNumber: true })}
                              className={cn(errors.reminder_days && "border-red-500")}
                            />
                            <p className="text-xs text-slate-500">
                              {language === 'th' ? 'แจ้งเตือนล่วงหน้ากี่วัน (1-30 วัน)' : 'Days in advance (1-30 days)'}
                            </p>
                            {errors.reminder_days && (
                              <p className="text-sm text-red-500">{errors.reminder_days.message}</p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="auto_renew" className="cursor-pointer">
                              {t("addSub.autoRenew")}
                            </Label>
                            <p className="text-xs text-slate-500">
                              {language === 'th' ? 'ต่ออายุอัตโนมัติหรือไม่' : 'Auto-renew subscription'}
                            </p>
                          </div>
                          <Controller
                            name="auto_renew"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                id="auto_renew"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Optional Context */}
                  <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader>
                      <CardTitle>{t("addSub.additionalInfo")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Usage Frequency */}
                      <div className="space-y-2">
                        <Label htmlFor="usage_frequency">
                          {t("addSub.usageFrequency")} ({t("common.optional")})
                        </Label>
                        <Controller
                          name="usage_frequency"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder={t("common.select")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="often">{t("addSub.often")}</SelectItem>
                                <SelectItem value="sometimes">{t("addSub.sometimes")}</SelectItem>
                                <SelectItem value="rarely">{t("addSub.rarely")}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="notes">{t("addSub.notes")} ({t("common.optional")})</Label>
                        <Textarea 
                          id="notes"
                          {...register("notes")}
                          placeholder={t("addSub.notesPlaceholder")}
                          rows={3}
                          className={cn(errors.notes && "border-red-500")}
                        />
                        {errors.notes && (
                          <p className="text-sm text-red-500">{errors.notes.message}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-6">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t("subscriptions.delete")}
                    </Button>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/")}
                        className="min-w-[120px]"
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="min-w-[120px] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                      >
                        {isSubmitting ? t("common.saving") : t("common.save")}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Sidebar - 1 column */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Live Summary */}
                <SubscriptionSummary
                  name={watchedValues.name}
                  amount={parseFloat(watchedValues.amount) || 0}
                  currency={watchedValues.currency}
                  billingCycle={watchedValues.billing_cycle}
                  nextBillingDate={watchedValues.next_billing_date}
                  remind3Days={watchedValues.reminder_days === 3}
                  remind7Days={watchedValues.reminder_days === 7}
                />

                {/* Intelligence Recommendations */}
                <SubscriptionIntelligence
                  amount={watchedValues.amount}
                  currency={watchedValues.currency}
                  billingCycle={watchedValues.billing_cycle}
                  categoryId={watchedValues.category_id}
                  usageFrequency={watchedValues.usage_frequency}
                  existingSubscriptions={existingSubscriptions}
                />
              </div>
            </div>
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("subscriptions.confirmDelete")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("subscriptions.confirmDeleteDesc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("subscriptions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Amount Change Confirmation Dialog */}
          <AlertDialog open={showAmountChangeDialog} onOpenChange={setShowAmountChangeDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ ยืนยันการเปลี่ยนแปลงราคา</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>คุณกำลังจะลดราคามากกว่า 50%</p>
                  {subscription && pendingFormData && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mt-2">
                      <p className="text-sm">
                        <strong>ราคาเดิม:</strong> {subscription.amount} {subscription.currency}
                      </p>
                      <p className="text-sm">
                        <strong>ราคาใหม่:</strong> {pendingFormData.amount} {pendingFormData.currency}
                      </p>
                    </div>
                  )}
                  <p className="mt-2">กรุณายืนยันว่าข้อมูลถูกต้อง</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setPendingFormData(null);
                  setShowAmountChangeDialog(false);
                }}>
                  {t("common.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (pendingFormData) {
                      submitForm(pendingFormData);
                    }
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  ยืนยันการเปลี่ยนแปลง
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </AuthGuard>
  );
}