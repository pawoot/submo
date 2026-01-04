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
import type { Database } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLanguage } from "@/contexts/LanguageContext";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type SubscriptionTemplate = Database["public"]["Tables"]["subscription_templates"]["Row"];

export default function EditSubscription() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [nextBillingDate, setNextBillingDate] = useState<Date>();
  const [dateError, setDateError] = useState("");
  const [subscriptionName, setSubscriptionName] = useState("");

  // Validation Schema (Moved inside component to access t function)
  const subscriptionSchema = z.object({
    name: z.string()
      .min(2, t("validation.minLength") + " 2 " + t("validation.characters"))
      .max(100, t("validation.maxLength") + " 100 " + t("validation.characters")),
    category: z.string()
      .min(1, t("validation.required")),
    description: z.string()
      .max(500, t("validation.maxLength") + " 500 " + t("validation.characters"))
      .optional()
      .nullable(),
    cost: z.string()
      .min(1, t("validation.required"))
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: t("validation.positiveNumber")
      })
      .refine((val) => Number(val) <= 999999.99, {
        message: t("validation.maxLength") + " 999,999.99"
      }),
    currency: z.string()
      .min(1, t("validation.required")),
    billing: z.string()
      .min(1, t("validation.required")),
    paymentMethod: z.string()
      .min(1, t("validation.required")),
    cardLast4: z.string()
      .max(4, t("validation.maxLength") + " 4")
      .optional()
      .nullable(),
    website: z.string()
      .url(t("validation.invalidUrl"))
      .optional()
      .nullable()
      .or(z.literal("")),
    notes: z.string()
      .max(500, t("validation.maxLength") + " 500 " + t("validation.characters"))
      .optional()
      .nullable(),
  });

  type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
  });

  const categories = [
    { value: "design", label: t("category.design") },
    { value: "development", label: t("category.development") },
    { value: "productivity", label: t("category.productivity") },
    { value: "entertainment", label: t("category.entertainment") },
    { value: "cloud-storage", label: t("category.cloud-storage") },
    { value: "gaming", label: t("category.gaming") },
    { value: "education", label: t("category.education") },
    { value: "fitness", label: t("category.fitness") },
    { value: "news", label: t("category.news") },
    { value: "other", label: t("category.other") }
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
    { value: "credit-card", label: t("payment.credit-card") },
    { value: "debit-card", label: t("payment.debit-card") },
    { value: "paypal", label: t("payment.paypal") },
    { value: "bank-transfer", label: t("payment.bank-transfer") },
    { value: "promptpay", label: t("payment.promptpay") },
    { value: "other", label: t("payment.other") }
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
        setSubscriptionName(data.name);
        setSharedUsers(data.shared_with || []);
        setStartDate(parseISO(data.start_date));
        setNextBillingDate(parseISO(data.next_billing_date));
        
        // Set form values
        reset({
          name: data.name,
          category: data.category,
          description: data.description || "",
          cost: data.amount.toString(),
          currency: data.currency,
          billing: data.billing_cycle,
          paymentMethod: data.payment_method,
          cardLast4: data.card_last_4 || "",
          website: data.website_url || "",
          notes: data.notes || "",
        });
      } else {
        toast({
          title: t("common.error"),
          description: t("editSub.notFound"),
          variant: "destructive",
          duration: 3000,
        });
        router.push("/");
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      toast({
        title: t("common.error"),
        description: t("editSub.loadError"),
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const addSharedUser = () => {
    if (!newUserEmail) {
      setEmailError(t("validation.required"));
      return;
    }

    // Email validation
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

  const handleAutocompleteTemplateSelect = (template: SubscriptionTemplate) => {
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
      title: t("addSub.templateSelected"),
      description: t("addSub.templateSelectedDesc"),
      duration: 3000,
    });
  };

  const handleSubmit = async (data: SubscriptionFormData) => {
    // Validate dates
    if (!startDate || !nextBillingDate) {
      setDateError(t("validation.required"));
      toast({
        title: t("common.error"),
        description: t("validation.required"),
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (nextBillingDate <= startDate) {
      setDateError(t("validation.invalidDate"));
      toast({
        title: t("common.error"),
        description: t("validation.invalidDate"),
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setDateError("");
    setIsSubmitting(true);

    try {
      const updateData = {
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

      await subscriptionService.update(id as string, updateData);

      toast({
        title: t("editSub.success"),
        description: t("toast.updateSuccess"),
        duration: 3000,
      });

      router.push("/");
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: t("common.error"),
        description: t("editSub.updateError"),
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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("editSub.title")}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">{subscription?.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <form onSubmit={handleFormSubmit(handleSubmit)} id="subscription-form">
            <div className="space-y-6">
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
                        value={subscriptionName}
                        onChange={setSubscriptionName}
                        onTemplateSelect={handleAutocompleteTemplateSelect}
                        disabled={isSubmitting}
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
                      <Label htmlFor="category">{t("addSub.category")} *</Label>
                      <Select 
                        onValueChange={(value) => setValue("category", value)}
                        defaultValue={subscription.category}
                      >
                        <SelectTrigger id="category" className={cn(errors.category && "border-red-500")}>
                          <SelectValue placeholder={t("addSub.selectCategory")} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
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
                    <Label htmlFor="description">{t("addSub.notes")}</Label>
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
                    <Label htmlFor="website">{t("addSub.website")}</Label>
                    <Input 
                      id="website"
                      {...register("website")}
                      type="url"
                      placeholder={t("addSub.websitePlaceholder")}
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
                  <CardTitle>{t("addSub.pricingInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cost">{t("addSub.cost")} *</Label>
                      <Input 
                        id="cost"
                        {...register("cost")}
                        type="number" 
                        step="0.01" 
                        placeholder={t("addSub.costPlaceholder")}
                        className={cn(errors.cost && "border-red-500")}
                        required
                      />
                      {errors.cost && (
                        <p className="text-sm text-red-500">{errors.cost.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">{t("addSub.currency")} *</Label>
                      <Select 
                        onValueChange={(value) => setValue("currency", value)}
                        defaultValue={subscription.currency}
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
                      {errors.currency && (
                        <p className="text-sm text-red-500">{errors.currency.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing">{t("addSub.billing")} *</Label>
                      <Select 
                        onValueChange={(value) => setValue("billing", value)}
                        defaultValue={subscription.billing_cycle}
                      >
                        <SelectTrigger id="billing" className={cn(errors.billing && "border-red-500")}>
                          <SelectValue placeholder={t("addSub.selectBilling")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">{t("addSub.billingMonthly")}</SelectItem>
                          <SelectItem value="yearly">{t("addSub.billingYearly")}</SelectItem>
                          <SelectItem value="quarterly">{t("subscriptions.quarterly")}</SelectItem>
                          <SelectItem value="half-yearly">{t("subscriptions.halfYearly")}</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.billing && (
                        <p className="text-sm text-red-500">{errors.billing.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">{t("addSub.paymentMethod")} *</Label>
                      <Select 
                        onValueChange={(value) => setValue("paymentMethod", value)}
                        defaultValue={subscription.payment_method}
                      >
                        <SelectTrigger id="paymentMethod" className={cn(errors.paymentMethod && "border-red-500")}>
                          <SelectValue placeholder={t("addSub.selectPayment")} />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.paymentMethod && (
                        <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardLast4">{t("addSub.cardNumber")} {t("common.optional")}</Label>
                      <Input 
                        id="cardLast4"
                        {...register("cardLast4")}
                        placeholder={t("addSub.cardPlaceholder")}
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
                  <CardTitle>{t("addSub.paymentInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("addSub.startDate")} *</Label>
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
                              format(startDate, "d MMMM yyyy", { locale: language === 'th' ? th : enUS })
                            ) : (
                              <span>{t("common.select")}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            locale={language === 'th' ? th : enUS}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("addSub.nextBillingDate")} *</Label>
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
                              format(nextBillingDate, "d MMMM yyyy", { locale: language === 'th' ? th : enUS })
                            ) : (
                              <span>{t("common.select")}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={nextBillingDate}
                            onSelect={setNextBillingDate}
                            initialFocus
                            locale={language === 'th' ? th : enUS}
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
                      <Users className="w-4 h-4" />
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
                      {t("addSub.sharedUsersPlaceholder")}
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
                      {t("editSub.submitting")}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {t("editSub.submit")}
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