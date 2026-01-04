import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  Sparkles,
  DollarSign,
  CreditCard,
  FileText,
  AlertTriangle
} from "lucide-react";
import { format, addMonths, addYears, addDays } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import { SubscriptionNameAutocomplete } from "@/components/SubscriptionNameAutocomplete";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Database } from "@/integrations/supabase/types";

type SubscriptionTemplate = Database["public"]["Tables"]["subscription_templates"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

interface FormData {
  name: string;
  category_id: string;
  description: string;
  amount: string;
  currency: string;
  billing_cycle: string;
  payment_method_id: string;
  card_last_4: string;
  start_date: Date | undefined;
  next_billing_date: Date | undefined;
  website_url: string;
  notes: string;
  remind_3_days: boolean;
  remind_7_days: boolean;
  usage_frequency: string;
}

interface AddSubscriptionStepsProps {
  popularTemplates: SubscriptionTemplate[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onSubmit: (data: FormData) => Promise<void>;
  onTemplateSelect: (template: SubscriptionTemplate) => void;
  isSubmitting: boolean;
}

const STEPS = [
  { id: 1, title: "บริการและราคา", icon: Sparkles },
  { id: 2, title: "การชำระเงิน", icon: CreditCard },
  { id: 3, title: "รายละเอียดเพิ่มเติม", icon: FileText },
];

export function AddSubscriptionSteps({
  popularTemplates,
  categories,
  paymentMethods,
  onSubmit,
  onTemplateSelect,
  isSubmitting,
}: AddSubscriptionStepsProps) {
  const { t, language } = useLanguage();
  const { preferredCurrency } = useCurrency();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<SubscriptionTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    category_id: "",
    description: "",
    amount: "",
    currency: preferredCurrency || "THB",
    billing_cycle: "monthly",
    payment_method_id: "",
    card_last_4: "",
    start_date: new Date(),
    next_billing_date: addMonths(new Date(), 1),
    website_url: "",
    notes: "",
    remind_3_days: false,
    remind_7_days: false,
    usage_frequency: "",
  });

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "THB", symbol: "฿", name: "Thai Baht" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  ];

  // Auto-calculate next billing date
  useEffect(() => {
    if (formData.start_date) {
      let nextDate: Date;
      switch (formData.billing_cycle) {
        case "monthly":
          nextDate = addMonths(formData.start_date, 1);
          break;
        case "quarterly":
          nextDate = addMonths(formData.start_date, 3);
          break;
        case "half-yearly":
          nextDate = addMonths(formData.start_date, 6);
          break;
        case "yearly":
          nextDate = addYears(formData.start_date, 1);
          break;
        default:
          nextDate = addMonths(formData.start_date, 1);
      }
      setFormData(prev => ({ ...prev, next_billing_date: nextDate }));
    }
  }, [formData.start_date, formData.billing_cycle]);

  // Auto-enable 7-day reminder for yearly subscriptions
  useEffect(() => {
    if (formData.billing_cycle === "yearly" && !formData.remind_7_days) {
      setFormData(prev => ({ ...prev, remind_7_days: true }));
    }
  }, [formData.billing_cycle]);

  const handleTemplateSelect = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    
    const matchingCategory = categories.find(c => c.slug === template.category);
    
    setFormData(prev => ({
      ...prev,
      name: template.name,
      category_id: matchingCategory?.id || "",
      amount: template.default_price?.toString() || "",
      currency: template.default_currency || preferredCurrency || "THB",
      billing_cycle: template.default_billing_cycle || "monthly",
      website_url: template.website_url || "",
    }));

    onTemplateSelect(template);
  };

  const updateFormData = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const canProceedStep1 = () => {
    return formData.name.length >= 2 && 
           formData.amount && 
           Number(formData.amount) > 0 &&
           formData.category_id;
  };

  const canProceedStep2 = () => {
    return formData.start_date && 
           formData.next_billing_date &&
           formData.payment_method_id;
  };

  const nextStep = () => {
    if (currentStep === 1 && !canProceedStep1()) return;
    if (currentStep === 2 && !canProceedStep2()) return;
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  const calculateMonthlyCost = () => {
    const amount = Number(formData.amount) || 0;
    switch (formData.billing_cycle) {
      case "monthly":
        return amount;
      case "quarterly":
        return amount / 3;
      case "half-yearly":
        return amount / 6;
      case "yearly":
        return amount / 12;
      default:
        return amount;
    }
  };

  const calculateYearlyCost = () => {
    return calculateMonthlyCost() * 12;
  };

  const getCurrencySymbol = () => {
    return currencies.find(c => c.code === formData.currency)?.symbol || "฿";
  };

  const isHighCost = () => {
    const yearlyCost = calculateYearlyCost();
    // Warning if yearly cost > 10,000 THB or equivalent
    return yearlyCost > 10000;
  };

  const progressPercentage = (currentStep / 3) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className={cn(
                      "flex items-center gap-2",
                      currentStep >= step.id ? "text-blue-600" : "text-gray-400"
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                        currentStep > step.id ? "bg-blue-600 text-white" : 
                        currentStep === step.id ? "bg-blue-100 text-blue-600 border-2 border-blue-600" :
                        "bg-gray-100 text-gray-400"
                      )}>
                        {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        "flex-1 h-0.5 mx-2",
                        currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                      )} />
                    )}
                  </div>
                ))}
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Service & Price */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Popular Templates */}
            <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-blue-900 dark:text-blue-100">
                    {t("addSub.quickAdd")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t("addSub.basicInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("addSub.name")} *</Label>
                  <SubscriptionNameAutocomplete
                    value={formData.name}
                    onChange={(value) => updateFormData("name", value)}
                    onTemplateSelect={handleTemplateSelect}
                    disabled={isSubmitting}
                    selectedTemplate={selectedTemplate}
                  />
                  {formData.name.length >= 2 && (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> {t("common.success")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">{t("addSub.category")} *</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => updateFormData("category_id", value)}
                  >
                    <SelectTrigger id="category">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t("addSub.cost")} *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => updateFormData("amount", e.target.value)}
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && canProceedStep1()) {
                          e.preventDefault();
                          nextStep();
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">{t("addSub.currency")} *</Label>
                    <Select 
                      value={formData.currency} 
                      onValueChange={(value) => updateFormData("currency", value)}
                    >
                      <SelectTrigger id="currency">
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billing_cycle">{t("addSub.billing")} *</Label>
                    <Select 
                      value={formData.billing_cycle} 
                      onValueChange={(value) => updateFormData("billing_cycle", value)}
                    >
                      <SelectTrigger id="billing_cycle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{t("addSub.billingMonthly")}</SelectItem>
                        <SelectItem value="quarterly">{t("subscriptions.quarterly")}</SelectItem>
                        <SelectItem value="half-yearly">{t("subscriptions.halfYearly")}</SelectItem>
                        <SelectItem value="yearly">{t("addSub.billingYearly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Billing & Payment */}
        {currentStep === 2 && (
          <div className="space-y-6">
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
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? (
                            format(formData.start_date, "d MMMM yyyy", { 
                              locale: language === "th" ? th : enUS 
                            })
                          ) : (
                            <span>{t("common.select")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.start_date}
                          onSelect={(date) => updateFormData("start_date", date)}
                          initialFocus
                          locale={language === "th" ? th : enUS}
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
                          className="w-full justify-start text-left font-normal bg-gray-50"
                          disabled
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.next_billing_date ? (
                            format(formData.next_billing_date, "d MMMM yyyy", { 
                              locale: language === "th" ? th : enUS 
                            })
                          ) : (
                            <span>{t("common.select")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                    </Popover>
                    <p className="text-xs text-gray-500">
                      {t("addSub.autoCalculated") || "คำนวณอัตโนมัติจากรอบการเรียกเก็บเงิน"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_method_id">{t("subscription.payment_method")} *</Label>
                    <Select 
                      value={formData.payment_method_id} 
                      onValueChange={(value) => updateFormData("payment_method_id", value)}
                    >
                      <SelectTrigger id="payment_method_id">
                        <SelectValue placeholder={t("payment.select_method")} />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            <span className="flex items-center gap-2">
                              <span>{method.icon}</span>
                              <span>{language === "th" ? method.name_th : method.name_en}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card_last_4">
                      {t("addSub.cardNumber")} {t("common.optional")}
                    </Label>
                    <Input
                      id="card_last_4"
                      placeholder="1234"
                      maxLength={4}
                      value={formData.card_last_4}
                      onChange={(e) => updateFormData("card_last_4", e.target.value)}
                    />
                  </div>
                </div>

                {/* Quick Reminder Toggles */}
                <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <Label className="text-sm font-semibold">
                    {t("notifications.reminders") || "การแจ้งเตือน"}
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remind_3_days"
                      checked={formData.remind_3_days}
                      onCheckedChange={(checked) => 
                        updateFormData("remind_3_days", checked)
                      }
                    />
                    <label
                      htmlFor="remind_3_days"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {t("notifications.remind_3_days") || "แจ้งเตือนก่อน 3 วัน"}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remind_7_days"
                      checked={formData.remind_7_days}
                      onCheckedChange={(checked) => 
                        updateFormData("remind_7_days", checked)
                      }
                    />
                    <label
                      htmlFor="remind_7_days"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {t("notifications.remind_7_days") || "แจ้งเตือนก่อน 7 วัน"}
                      {formData.billing_cycle === "yearly" && (
                        <Badge variant="secondary" className="ml-2">
                          {t("common.recommended") || "แนะนำ"}
                        </Badge>
                      )}
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Optional Context */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("addSub.additionalInfo") || "ข้อมูลเพิ่มเติม"} 
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({t("common.optional")})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usage_frequency">
                    {t("addSub.usageFrequency") || "ความถี่ในการใช้งาน"}
                  </Label>
                  <Select 
                    value={formData.usage_frequency} 
                    onValueChange={(value) => updateFormData("usage_frequency", value)}
                  >
                    <SelectTrigger id="usage_frequency">
                      <SelectValue placeholder={t("common.select")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="often">
                        {t("addSub.often") || "ใช้บ่อย (ทุกวัน)"}
                      </SelectItem>
                      <SelectItem value="sometimes">
                        {t("addSub.sometimes") || "ใช้บางครั้ง (สัปดาห์ละครั้ง)"}
                      </SelectItem>
                      <SelectItem value="rarely">
                        {t("addSub.rarely") || "ใช้นานๆ ครั้ง (เดือนละครั้ง)"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">{t("addSub.website")}</Label>
                  <Input
                    id="website_url"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website_url}
                    onChange={(e) => updateFormData("website_url", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t("addSub.notes")}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t("addSub.notesPlaceholder")}
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => updateFormData("notes", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("common.back") || "ย้อนกลับ"}
          </Button>

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !canProceedStep1()) ||
                (currentStep === 2 && !canProceedStep2()) ||
                isSubmitting
              }
              className="gap-2"
            >
              {t("common.next") || "ถัดไป"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("addSub.submitting")}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t("addSub.submit")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Live Summary Card (Sticky) */}
      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                {t("addSub.summary") || "สรุปค่าใช้จ่าย"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {formData.name && (
                <div>
                  <p className="text-sm text-gray-500">{t("addSub.subscription") || "บริการ"}</p>
                  <p className="text-lg font-semibold">{formData.name}</p>
                </div>
              )}

              {formData.amount && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500">{t("addSub.monthlyCost") || "ค่าใช้จ่ายต่อเดือน"}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {getCurrencySymbol()}{calculateMonthlyCost().toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border-2 border-green-200">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("addSub.yearlyCost") || "ค่าใช้จ่ายต่อปี"}
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {getCurrencySymbol()}{calculateYearlyCost().toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.billing_cycle === "yearly" 
                        ? t("addSub.billedYearly") || "เรียกเก็บรายปี"
                        : t("addSub.calculatedYearly") || "คำนวณจากรายเดือน"}
                    </p>
                  </div>

                  {isHighCost() && (
                    <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border-2 border-orange-200 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                          {t("addSub.highCostWarning") || "ค่าใช้จ่ายสูงกว่าปกติ"}
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          {t("addSub.highCostDesc") || "บริการนี้มีค่าใช้จ่ายสูงกว่าค่าเฉลี่ยรายเดือนของคุณ"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {formData.next_billing_date && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">{t("addSub.nextBilling") || "วันเรียกเก็บเงินถัดไป"}</p>
                  <p className="font-semibold">
                    {format(formData.next_billing_date, "d MMMM yyyy", {
                      locale: language === "th" ? th : enUS,
                    })}
                  </p>
                </div>
              )}

              {(formData.remind_3_days || formData.remind_7_days) && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">
                    {t("notifications.reminders") || "การแจ้งเตือน"}
                  </p>
                  <div className="space-y-1">
                    {formData.remind_3_days && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ {t("notifications.remind_3_days") || "แจ้งเตือนก่อน 3 วัน"}
                      </Badge>
                    )}
                    {formData.remind_7_days && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ {t("notifications.remind_7_days") || "แจ้งเตือนก่อน 7 วัน"}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}