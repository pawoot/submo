import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Check, Loader2, Sparkles, Users, Trash2, AlertCircle } from "lucide-react";
import { format, addMonths, addYears } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionNameAutocomplete } from "./SubscriptionNameAutocomplete";
import { SubscriptionTemplateBrowser } from "./SubscriptionTemplateBrowser";
import { SubscriptionSummary } from "./SubscriptionSummary";
import { subscriptionTemplateService, type SubscriptionTemplate } from "@/services/subscriptionTemplateService";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

interface AddSubscriptionWizardProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
];

export function AddSubscriptionWizard({
  categories,
  paymentMethods,
  onSubmit,
  isSubmitting
}: AddSubscriptionWizardProps) {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<SubscriptionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SubscriptionTemplate | null>(null);
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const locale = language === "th" ? th : enUS;

  // Form Schema
  const formSchema = z.object({
    name: z.string().min(2, t("validation.minLength") + " 2 " + t("validation.characters")),
    category_id: z.string().min(1, t("validation.required")),
    amount: z.string()
      .min(1, t("validation.required"))
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: t("validation.positiveNumber")
      }),
    currency: z.string().min(1, t("validation.required")),
    billing_cycle: z.string().min(1, t("validation.required")),
    payment_method_id: z.string().min(1, t("validation.required")),
    card_last_4: z.string().max(4, t("validation.maxLength") + " 4").optional().nullable(),
    start_date: z.date({ required_error: t("validation.required") }),
    next_billing_date: z.date({ required_error: t("validation.required") }),
    remind_3_days: z.boolean().default(false),
    remind_7_days: z.boolean().default(false),
    usage_frequency: z.enum(["often", "sometimes", "rarely"]).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  });

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currency: "THB",
      billing_cycle: "monthly",
      remind_3_days: false,
      remind_7_days: false,
      start_date: new Date(),
    }
  });

  const watchedValues = watch();

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await subscriptionTemplateService.getAllTemplates();
        setTemplates(data);
      } catch (error) {
        console.error("Error loading templates:", error);
      }
    };
    loadTemplates();
  }, []);

  // Auto-calculate next billing date
  useEffect(() => {
    if (watchedValues.start_date && watchedValues.billing_cycle) {
      const startDate = watchedValues.start_date;
      let nextBilling: Date;

      switch (watchedValues.billing_cycle) {
        case "monthly":
          nextBilling = addMonths(startDate, 1);
          break;
        case "quarterly":
          nextBilling = addMonths(startDate, 3);
          break;
        case "half-yearly":
          nextBilling = addMonths(startDate, 6);
          break;
        case "yearly":
          nextBilling = addYears(startDate, 1);
          setValue("remind_7_days", true); // Auto-enable 7-day reminder for yearly
          break;
        default:
          nextBilling = addMonths(startDate, 1);
      }

      setValue("next_billing_date", nextBilling);
    }
  }, [watchedValues.start_date, watchedValues.billing_cycle, setValue]);

  const handleTemplateSelect = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    setValue("name", template.name, { shouldValidate: true });

    if (template.category_id) {
      setValue("category_id", template.category_id, { shouldValidate: true });
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

    toast({
      title: t("addSub.templateSelected"),
      description: template.name,
      duration: 2000,
    });

    // Auto-advance to step 2
    setStep(2);
  };

  const handleCustomSubscription = () => {
    setSelectedTemplate(null);
    setStep(2);
  };

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

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinalSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      amount: Number(data.amount),
      shared_with: sharedUsers,
      template_id: selectedTemplate?.id || null,
      icon_url: selectedTemplate?.icon_url || null,
      is_template: false,
      popularity_score: 0,
    });
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <Card className="border-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                {t("addSub.title")}
              </CardTitle>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {t("common.step")} {step} / 3
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleFormSubmit(handleFinalSubmit)} id="wizard-form">
              {/* Step 1: Select Service & Price */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">{t("addSub.selectService")}</h3>
                    <SubscriptionTemplateBrowser
                      templates={templates}
                      onSelect={handleTemplateSelect}
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground">
                        {t("common.or")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t("addSub.customSubscription")}</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("addSub.name")} *</Label>
                      <SubscriptionNameAutocomplete
                        value={watchedValues.name || ""}
                        onChange={(val) => setValue("name", val, { shouldValidate: true })}
                        onSelectTemplate={handleTemplateSelect}
                        selectedTemplate={selectedTemplate}
                        error={errors.name?.message}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">{t("addSub.cost")} *</Label>
                        <Input
                          id="amount"
                          {...register("amount")}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {currencies.map((curr) => (
                                  <SelectItem key={curr.code} value={curr.code}>
                                    {curr.symbol} {curr.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_cycle">{t("addSub.billing")} *</Label>
                      <Controller
                        name="billing_cycle"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">{t("addSub.billingMonthly")}</SelectItem>
                              <SelectItem value="quarterly">{t("subscriptions.quarterly")}</SelectItem>
                              <SelectItem value="half-yearly">{t("subscriptions.halfYearly")}</SelectItem>
                              <SelectItem value="yearly">{t("addSub.billingYearly")}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category_id">{t("addSub.category")} *</Label>
                      <Controller
                        name="category_id"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className={cn(errors.category_id && "border-red-500")}>
                              <SelectValue placeholder={t("addSub.selectCategory")} />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{cat.icon}</span>
                                    <span>{language === "th" ? cat.name_th : cat.name_en}</span>
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

                  <Button
                    type="button"
                    onClick={handleNext}
                    size="lg"
                    className="w-full"
                    disabled={!watchedValues.name || !watchedValues.amount || !watchedValues.category_id}
                  >
                    {t("common.continue")}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}

              {/* Step 2: Billing & Payment */}
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">{t("addSub.billingPayment")}</h3>

                  <div className="grid grid-cols-2 gap-4">
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
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "d MMMM yyyy", { locale }) : t("common.select")}
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
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "d MMMM yyyy", { locale }) : t("common.select")}
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
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method_id">{t("subscription.payment_method")} *</Label>
                    <Controller
                      name="payment_method_id"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={cn(errors.payment_method_id && "border-red-500")}>
                            <SelectValue placeholder={t("payment.select_method")} />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                <div className="flex items-center gap-2">
                                  <span>{method.icon}</span>
                                  <span>{language === "th" ? method.name_th : method.name_en}</span>
                                </div>
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
                      placeholder="1234"
                      maxLength={4}
                    />
                  </div>

                  <div className="space-y-4 p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {t("addSub.quickToggles")}
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="remind_3_days" className="cursor-pointer">
                        {t("addSub.remind3Days")}
                      </Label>
                      <Controller
                        name="remind_3_days"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            id="remind_3_days"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="remind_7_days" className="cursor-pointer">
                        {t("addSub.remind7Days")}
                        {watchedValues.billing_cycle === "yearly" && (
                          <Badge variant="secondary" className="ml-2">{t("common.recommended")}</Badge>
                        )}
                      </Label>
                      <Controller
                        name="remind_7_days"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            id="remind_7_days"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={handleBack}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      {t("common.back")}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNext}
                      size="lg"
                      className="w-full"
                      disabled={!watchedValues.payment_method_id}
                    >
                      {t("common.continue")}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Optional Context */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{t("addSub.optionalContext")}</h3>
                    <Badge variant="secondary">{t("common.optional")}</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usage_frequency">{t("addSub.usageFrequency")}</Label>
                    <Controller
                      name="usage_frequency"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
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

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t("addSub.notes")}</Label>
                    <Textarea
                      id="notes"
                      {...register("notes")}
                      placeholder={t("addSub.notesPlaceholder")}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>{t("addSub.sharedUsers")}</Label>
                    <div className="flex gap-2">
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
                      <Button type="button" onClick={addSharedUser} variant="outline">
                        <Users className="w-4 h-4" />
                      </Button>
                    </div>
                    {emailError && (
                      <p className="text-sm text-red-500">{emailError}</p>
                    )}

                    {sharedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sharedUsers.map((email) => (
                          <Badge key={email} variant="secondary" className="gap-2 px-3 py-1">
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
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={handleBack}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      {t("common.back")}
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {t("addSub.submitting")}
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          {t("addSub.submit")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Live Summary Sidebar */}
      <div className="lg:col-span-1">
        <SubscriptionSummary
          name={watchedValues.name || ""}
          amount={Number(watchedValues.amount) || 0}
          currency={watchedValues.currency || "THB"}
          billingCycle={watchedValues.billing_cycle as any || "monthly"}
          startDate={watchedValues.start_date || null}
          nextBillingDate={watchedValues.next_billing_date || null}
          remind3Days={watchedValues.remind_3_days || false}
          remind7Days={watchedValues.remind_7_days || false}
        />
      </div>
    </div>
  );
}