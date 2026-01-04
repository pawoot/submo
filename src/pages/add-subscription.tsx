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
import { th, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SubscriptionTemplateBrowser } from "@/components/SubscriptionTemplateBrowser";
import { SubscriptionNameAutocomplete } from "@/components/SubscriptionNameAutocomplete";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import type { Database } from "@/integrations/supabase/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";

type SubscriptionTemplate = Database["public"]["Tables"]["subscription_templates"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

export default function AddSubscription() {
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popularTemplates, setPopularTemplates] = useState<SubscriptionTemplate[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbPaymentMethods, setDbPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SubscriptionTemplate | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const { preferredCurrency, isLoading: currencyLoading } = useCurrency();
  const { t, language } = useLanguage();

  // Zod Schema - Aligned with DB columns where possible
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
    watch,
    control,
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      currency: "USD",
      billing_cycle: "monthly",
    },
    mode: "onChange",
  });

  // Watch name field
  const subscriptionName = watch("name");
  // Watch dates for calendar state
  const startDate = watch("start_date");
  const nextBillingDate = watch("next_billing_date");

  useEffect(() => {
    loadPopularTemplates();
    loadCategories();
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (preferredCurrency && !currencyLoading) {
      setValue("currency", preferredCurrency);
    }
  }, [preferredCurrency, currencyLoading, setValue]);

  const loadCategories = async () => {
    try {
      const cats = await subscriptionService.getCategories();
      setDbCategories(cats);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await subscriptionService.getPaymentMethods();
      setDbPaymentMethods(methods);
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  };

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
    setValue("name", template.name, { shouldValidate: true });
    
    // Auto-select category if slug matches
    if (template.category) {
      const matchingCat = dbCategories.find(c => c.slug === template.category);
      if (matchingCat) {
        setValue("category_id", matchingCat.id, { shouldValidate: true });
      }
    }
    
    if (template.default_price) {
      setValue("amount", template.default_price.toString(), { shouldValidate: true });
    }
    if (template.default_currency) {
      setValue("currency", template.default_currency, { shouldValidate: true });
    }
    if (template.default_billing_cycle) {
      setValue("billing_cycle", template.default_billing_cycle, { shouldValidate: true });
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

  const handleAutocompleteTemplateSelect = (template: SubscriptionTemplate) => {
    handleTemplateSelect(template);
  };

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "THB", symbol: "฿", name: "Thai Baht" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  ];

  const addSharedUser = () => {
    if (!newUserEmail) {
      setEmailError(t("validation.required"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      setEmailError(t("validation.invalidEmail"));
      return;
    }

    if (sharedUsers.includes(newUserEmail)) {
      setEmailError(t("addSub.emailInUse"));
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
    setIsSubmitting(true);
    try {
      const selectedCategory = dbCategories.find(c => c.id === data.category_id);
      const selectedPaymentMethod = dbPaymentMethods.find(p => p.id === data.payment_method_id);

      await subscriptionService.create({
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
        is_active: true,
        logo_url: null,
        shared_with: sharedUsers,
        updated_at: new Date().toISOString()
      });

      toast({
        title: t("common.success"),
        description: t("subscription.add_success"),
      });
      
      router.push("/");
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: t("common.error"),
        description: t("common.error_occurred"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <SEO 
        title={t("addSub.title") + " - Submo.ai"}
        description={t("addSub.title") + " - " + t("home.seo.description")}
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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("addSub.title")}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t("addSub.title")}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <form onSubmit={handleFormSubmit(handleSubmit)} id="subscription-form">
            <div className="space-y-6">
              {/* Quick Add Section */}
              <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-blue-900 dark:text-blue-100">{t("addSub.quickAdd")}</CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBrowser(true)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      {t("addSub.browseAll")} →
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
                          <SubscriptionIcon
                            name={template.name}
                            website={template.website_url}
                            logoUrl={template.logo_url}
                            className="w-12 h-12"
                          />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center truncate w-full">
                            {template.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>{t("common.loading")}</p>
                    </div>
                  )}
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-4 text-center">
                    💡 {t("addSub.selectService")}
                  </p>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("addSub.basicInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("addSub.name")} *</Label>
                      <SubscriptionNameAutocomplete
                        value={subscriptionName || ""}
                        onChange={(value) => setValue("name", value, { shouldValidate: true })}
                        onTemplateSelect={handleAutocompleteTemplateSelect}
                        disabled={isSubmitting}
                        selectedTemplate={selectedTemplate}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name.message}</p>
                      )}
                      {subscriptionName && subscriptionName.trim().length >= 2 && !errors.name && !selectedTemplate && (
                        <p className="text-sm text-green-600 dark:text-green-400">✓ {t("common.success")}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">{t("addSub.category")} *</Label>
                      <Controller
                        name="category_id"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="category" className={cn(errors.category_id && "border-red-500")}>
                              <SelectValue placeholder={t("addSub.selectCategory")} />
                            </SelectTrigger>
                            <SelectContent>
                              {dbCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{cat.icon}</span>
                                    <span>{language === 'th' ? cat.name_th : cat.name_en}</span>
                                  </div>
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

                  <div className="space-y-2">
                    <Label htmlFor="description">{t("addSub.notes")} {t("common.optional")}</Label>
                    <Textarea 
                      id="description"
                      {...register("description")}
                      placeholder={t("addSub.notesPlaceholder")}
                      rows={3}
                      className={cn(errors.description && "border-red-500")}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website_url">{t("addSub.website")} {t("common.optional")}</Label>
                    <Input 
                      id="website_url"
                      {...register("website_url")}
                      type="url"
                      placeholder={t("addSub.websitePlaceholder")}
                      className={cn(errors.website_url && "border-red-500")}
                    />
                    {errors.website_url && (
                      <p className="text-sm text-red-500">{errors.website_url.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Information */}
              <Card>
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
                        required
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                      <Label htmlFor="payment_method_id">{t("subscription.payment_method")}</Label>
                      <Controller
                        name="payment_method_id"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="payment_method_id" className="w-full h-11">
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
                      <Label htmlFor="card_last_4">{t("addSub.cardNumber")} {t("common.optional")}</Label>
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

              {/* Billing Dates */}
              <Card>
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
                                locale={language === 'th' ? th : enUS}
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
                                locale={language === 'th' ? th : enUS}
                                disabled={(date) =>
                                  startDate ? date <= startDate : false
                                }
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
                </CardContent>
              </Card>

              {/* Shared Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t("addSub.sharedUsers")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input 
                        placeholder={t("addSub.sharedUsersPlaceholder")}
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
                      <Label>{t("addSub.sharedUsers")} ({sharedUsers.length})</Label>
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
                      {t("common.optional")}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-4">
                <Link href="/">
                  <Button type="button" variant="outline" size="lg" disabled={isSubmitting}>
                    {t("common.cancel")}
                  </Button>
                </Link>
                <Button type="submit" size="lg" className="gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("addSub.submitting")}
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      {t("addSub.submit")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </main>
      </div>

      <SubscriptionTemplateBrowser
        open={showBrowser}
        onOpenChange={setShowBrowser}
        onSelect={handleTemplateSelect}
      />
    </AuthGuard>
  );
}