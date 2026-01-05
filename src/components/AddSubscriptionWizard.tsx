import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { SubscriptionTemplateBrowser } from "@/components/SubscriptionTemplateBrowser";
import { SubscriptionNameAutocomplete } from "@/components/SubscriptionNameAutocomplete";
import { SubscriptionSummary } from "@/components/SubscriptionSummary";
import { SubscriptionIntelligence } from "@/components/SubscriptionIntelligence";
import type { Database } from "@/integrations/supabase/types";
import type { SubscriptionTemplate } from "@/services/subscriptionTemplateService";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

// Form Schema with validation
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  category_id: z.string().min(1, "Category is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0").max(999999.99),
  currency: z.string().min(1, "Currency is required"),
  billing_cycle: z.enum(["monthly", "yearly", "quarterly", "half-yearly"]),
  payment_method_id: z.string().min(1, "Payment method is required"),
  card_last_4: z.string().max(4).optional(),
  start_date: z.date(),
  next_billing_date: z.date(),
  notes: z.string().max(500).optional(),
  shared_with: z.array(z.string().email()).optional(),
  template_id: z.string().optional(),
  icon_url: z.string().optional(),
  remind_3_days: z.boolean().optional(),
  remind_7_days: z.boolean().optional(),
  usage_frequency: z.enum(["often", "sometimes", "rarely"]).optional(),
}).refine((data) => data.next_billing_date >= data.start_date, {
  message: "Next billing date must be after or equal to start date",
  path: ["next_billing_date"],
});

type FormValues = z.infer<typeof formSchema>;

interface AddSubscriptionWizardProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  existingSubscriptions?: any[];
  onSubmit: (data: FormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function AddSubscriptionWizard({
  categories,
  paymentMethods,
  existingSubscriptions = [],
  onSubmit,
  isSubmitting
}: AddSubscriptionWizardProps) {
  const { t, language } = useLanguage();
  const { preferredCurrency } = useCurrency();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<SubscriptionTemplate | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category_id: "",
      amount: 0,
      currency: preferredCurrency || "USD",
      billing_cycle: "monthly",
      payment_method_id: "",
      card_last_4: "",
      start_date: new Date(),
      next_billing_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      notes: "",
      shared_with: [],
      remind_3_days: false,
      remind_7_days: false,
      usage_frequency: undefined,
    }
  });

  const { register, control, watch, setValue, handleSubmit, formState: { errors } } = form;
  const watchedValues = watch();

  // Auto-calculate next billing date based on start date and billing cycle
  useEffect(() => {
    const startDate = watchedValues.start_date;
    const billingCycle = watchedValues.billing_cycle;
    
    if (startDate) {
      const nextDate = new Date(startDate);
      
      switch (billingCycle) {
        case "monthly":
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case "quarterly":
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case "half-yearly":
          nextDate.setMonth(nextDate.getMonth() + 6);
          break;
        case "yearly":
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      
      setValue("next_billing_date", nextDate);
    }
  }, [watchedValues.start_date, watchedValues.billing_cycle, setValue]);

  // Auto-enable 7-day reminder for yearly subscriptions
  useEffect(() => {
    if (watchedValues.billing_cycle === "yearly" && !watchedValues.remind_7_days) {
      setValue("remind_7_days", true);
    }
  }, [watchedValues.billing_cycle, setValue, watchedValues.remind_7_days]);

  // Handle template selection
  const handleTemplateSelect = async (template: SubscriptionTemplate) => {
    // Set form values from template
    setValue("name", template.name);
    setValue("category_id", template.category_id);
    // Use default_amount if available, fallback to amount, then 0
    setValue("amount", template.amount ?? 0);
    setValue("currency", template.currency);
    // Ensure billing_cycle is a valid enum value
    const cycle = template.billing_cycle as "monthly" | "yearly" | "quarterly" | "half-yearly";
    setValue("billing_cycle", cycle || "monthly");
    
    // Set website_url
    // @ts-expect-error - field might not exist in form types yet
    setValue("website_url", template.website_url || template.icon_url || "");
    // @ts-expect-error - field might not exist in form types yet
    setValue("description", template.description || "");

    // Clear custom styling when template selected
    setSelectedTemplate(template);
  };

  // Handle form submission
  const onSubmitHandler = async (data: FormValues) => {
    await onSubmit(data);
  };

  // Navigate between steps
  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Validate step before proceeding
  const canProceedToNextStep = () => {
    if (step === 1) {
      return watchedValues.name && watchedValues.category_id && watchedValues.amount > 0;
    }
    if (step === 2) {
      return watchedValues.payment_method_id && watchedValues.start_date && watchedValues.next_billing_date;
    }
    return true;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main Form Area */}
      <div className="lg:col-span-2">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                {t("common.step")} {step} {t("common.of")} 3
              </CardTitle>
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-2 w-16 rounded-full transition-colors",
                      s <= step ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
              {/* Step 1: Select Service & Price */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{t("addSub.basicInfo")}</h3>
                    
                    {/* Popular Templates */}
                    <div className="mb-6">
                      <Label className="text-base mb-3 block">{t("addSub.popularTemplates")}</Label>
                      <SubscriptionTemplateBrowser
                        isOpen={showTemplateBrowser}
                        onClose={() => setShowTemplateBrowser(false)}
                        onSelect={handleTemplateSelect}
                        onCustom={() => {
                          setSelectedTemplate(null);
                          setValue("name", "");
                          setValue("category_id", "");
                          setValue("icon_url", "");
                          // Focus on name input
                          setTimeout(() => {
                            const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
                            if (nameInput) nameInput.focus();
                          }, 100);
                        }}
                      />
                    </div>

                    {/* Custom Subscription Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("addSub.name")} *</Label>
                      <SubscriptionNameAutocomplete
                        value={watchedValues.name}
                        onChange={(value) => setValue("name", value)}
                        onSelectTemplate={handleTemplateSelect}
                        error={errors.name?.message}
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category_id">{t("addSub.category")} *</Label>
                      <Controller
                        name="category_id"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className={errors.category_id ? "border-red-500" : ""}>
                              <SelectValue placeholder={t("addSub.selectCategory")} />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {language === "th" ? category.name_th : category.name_en}
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

                    {/* Amount & Currency */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">{t("addSub.cost")} *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t("addSub.costPlaceholder")}
                          {...register("amount", { valueAsNumber: true })}
                          className={errors.amount ? "border-red-500" : ""}
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
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="THB">THB (฿)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                <SelectItem value="JPY">JPY (¥)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {/* Billing Cycle */}
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
                              <SelectItem value="monthly">{t("subscriptions.monthly")}</SelectItem>
                              <SelectItem value="quarterly">{t("subscriptions.quarterly")}</SelectItem>
                              <SelectItem value="half-yearly">{t("subscriptions.halfYearly")}</SelectItem>
                              <SelectItem value="yearly">{t("subscriptions.yearly")}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Billing & Payment */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{t("addSub.paymentInfo")}</h3>

                    {/* Start Date */}
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
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
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

                    {/* Next Billing Date */}
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
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
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
                      <p className="text-xs text-slate-500">{t("addSub.autoCalculated")}</p>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label htmlFor="payment_method_id">{t("addSub.paymentMethod")} *</Label>
                      <Controller
                        name="payment_method_id"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className={errors.payment_method_id ? "border-red-500" : ""}>
                              <SelectValue placeholder={t("addSub.selectPayment")} />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.id} value={method.id}>
                                  {language === "th" ? method.name_th : method.name_en}
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

                    {/* Card Last 4 Digits */}
                    <div className="space-y-2">
                      <Label htmlFor="card_last_4">{t("addSub.cardNumber")} ({t("common.optional")})</Label>
                      <Input
                        maxLength={4}
                        placeholder={t("addSub.cardPlaceholder")}
                        {...register("card_last_4")}
                      />
                    </div>

                    {/* Quick Reminder Toggles */}
                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <Label className="text-base">{t("addSub.quickToggles")}</Label>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="remind_3_days" className="cursor-pointer flex-1">
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
                        <Label htmlFor="remind_7_days" className="cursor-pointer flex-1">
                          {t("addSub.remind7Days")}
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

                    {/* Intelligence Layer */}
                    <SubscriptionIntelligence
                      amount={watchedValues.amount?.toString() || "0"}
                      currency={watchedValues.currency}
                      billingCycle={watchedValues.billing_cycle}
                      categoryId={watchedValues.category_id}
                      usageFrequency={watchedValues.usage_frequency}
                      existingSubscriptions={existingSubscriptions}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Optional Context */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t("addSub.additionalInfo")}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {t("addSub.optionalContext")}
                    </p>

                    {/* Usage Frequency */}
                    <div className="space-y-2">
                      <Label>{t("addSub.usageFrequency")} ({t("common.optional")})</Label>
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
                        placeholder={t("addSub.notesPlaceholder")}
                        rows={4}
                        {...register("notes")}
                      />
                    </div>

                    {/* Intelligence Layer */}
                    <SubscriptionIntelligence
                      amount={watchedValues.amount?.toString() || "0"}
                      currency={watchedValues.currency}
                      billingCycle={watchedValues.billing_cycle}
                      categoryId={watchedValues.category_id}
                      usageFrequency={watchedValues.usage_frequency}
                      existingSubscriptions={existingSubscriptions}
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {t("common.previous")}
                </Button>

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceedToNextStep()}
                  >
                    {t("common.continue")}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isSubmitting ? t("addSub.submitting") : t("addSub.submit")}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Live Summary Box (Sticky) */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <SubscriptionSummary
            name={watchedValues.name}
            amount={watchedValues.amount}
            currency={watchedValues.currency}
            billingCycle={watchedValues.billing_cycle}
            nextBillingDate={watchedValues.next_billing_date}
            remind3Days={watchedValues.remind_3_days || false}
            remind7Days={watchedValues.remind_7_days || false}
          />
        </div>
      </div>
    </div>
  );
}