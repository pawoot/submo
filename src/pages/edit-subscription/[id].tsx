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
import { SubscriptionNameAutocomplete } from "@/components/SubscriptionNameAutocomplete";
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
import { SubscriptionIcon } from "@/components/SubscriptionIcon";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

export default function EditSubscription() {
  const router = useRouter();
  const rawId = router.query.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbPaymentMethods, setDbPaymentMethods] = useState<PaymentMethod[]>([]);

  // Validation Schema - Aligned with DB columns
  const subscriptionSchema = z.object({
    name: z.string()
      .min(2, t("validation.minLength") + " 2 " + t("validation.characters"))
      .max(100, t("validation.maxLength") + " 100 " + t("validation.characters")),
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
      }),
    currency: z.string()
      .min(1, t("validation.required")),
    billing_cycle: z.string()
      .min(1, t("validation.required")),
    payment_method_id: z.string()
      .min(1, t("validation.required")),
    card_last_4: z.string()
      .max(4, t("validation.maxLength") + " 4")
      .optional()
      .nullable(),
    website_url: z.string()
      .url(t("validation.invalidUrl"))
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
    }),
    next_billing_date: z.date({
      required_error: t("validation.required"),
      invalid_type_error: t("validation.invalidDate"),
    }),
  }).refine((data) => data.next_billing_date > data.start_date, {
    message: t("validation.invalidDate"),
    path: ["next_billing_date"],
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

  const subscriptionName = watch("name");
  const startDate = watch("start_date");
  const nextBillingDate = watch("next_billing_date");

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
        const { data, error } = await supabase
          .from("subscriptions")
          .select(`
            *,
            categories (*),
            payment_methods (*)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        setSubscription(data);
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
  }, [id]);

  // Pre-fill form when subscription data is loaded
  useEffect(() => {
    const loadFormData = async () => {
      if (!subscription) return;

      // Load categories and payment methods first
      const [categoriesData, paymentMethodsData] = await Promise.all([
        supabase.from("categories").select("*").order("name_en"),
        supabase.from("payment_methods").select("*").order("name_en")
      ]);

      if (categoriesData.data) setDbCategories(categoriesData.data);
      if (paymentMethodsData.data) setDbPaymentMethods(paymentMethodsData.data);

      // Pre-fill form with subscription data
      reset({
        name: subscription.name,
        category_id: subscription.category_id,
        description: subscription.description || "",
        amount: subscription.amount.toString(),
        currency: subscription.currency,
        billing_cycle: subscription.billing_cycle,
        payment_method_id: subscription.payment_method_id,
        card_last_4: subscription.card_last_4 || "",
        website_url: subscription.website_url || "",
        notes: subscription.notes || "",
        start_date: new Date(subscription.start_date),
        next_billing_date: new Date(subscription.next_billing_date),
      });
    };

    loadFormData();
  }, [subscription, reset]);

  const handleAutocompleteTemplateSelect = (template: SubscriptionTemplate) => {
    setValue("name", template.name, { shouldValidate: true });
    
    // Auto-fill form with template data using setValue
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
      setValue("billing_cycle", template.billing_cycle, { shouldValidate: true });
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
    setIsSubmitting(true);
    try {
      const selectedCategory = dbCategories.find(c => c.id === data.category_id);
      const selectedPaymentMethod = dbPaymentMethods.find(p => p.id === data.payment_method_id);

      await subscriptionService.update(id as string, {
        name: data.name,
        category_id: data.category_id,
        category: selectedCategory?.slug || "other", // Legacy support
        description: data.description || null,
        amount: Number(data.amount),
        currency: data.currency,
        billing_cycle: data.billing_cycle,
        payment_method_id: data.payment_method_id,
        payment_method: selectedPaymentMethod?.slug || "other", // Legacy support
        card_last_4: data.card_last_4 || null,
        start_date: data.start_date.toISOString(),
        next_billing_date: data.next_billing_date.toISOString(),
        website_url: data.website_url || null,
        notes: data.notes || null,
      });

      toast({
        title: t("common.success"),
        description: t("subscription.update_success"),
      });
      
      router.push("/");
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: t("common.error"),
        description: t("common.error_occurred"),
        variant: "destructive",
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

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Current Subscription Summary */}
          {subscription && (
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
          )}

          <form onSubmit={handleFormSubmit(handleSubmit)} id="subscription-form">
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>{t("addSub.basicInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name - Now with Dropdown */}
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
                            onSelectTemplate={(template) => {
                              field.onChange(template.name);
                              if (template.category_id) {
                                setValue("category_id", template.category_id);
                              }
                              if (template.amount) {
                                setValue("amount", template.amount.toString());
                              }
                              if (template.currency) {
                                setValue("currency", template.currency);
                              }
                              if (template.billing_cycle) {
                                setValue("billing_cycle", template.billing_cycle);
                              }
                            }}
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
                      className="min-h-[100px]"
                    />
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

              {/* Payment Information */}
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

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t("addSub.notes")}</Label>
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
              <div className="flex items-center justify-end gap-4 pt-6">
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
          </form>
        </main>
      </div>
    </AuthGuard>
  );
}