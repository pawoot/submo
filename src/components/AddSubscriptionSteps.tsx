import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubscriptionTemplateBrowser } from "@/components/SubscriptionTemplateBrowser";
import { SubscriptionNameAutocomplete } from "@/components/SubscriptionNameAutocomplete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  CreditCard, 
  Wallet, 
  Tag,
  Sparkles,
  FileText,
  DollarSign,
  ChevronLeft,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, addYears } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SubscriptionTemplate } from "@/services/subscriptionTemplateService";
import type { Database } from "@/integrations/supabase/types";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import { th, enUS } from "date-fns/locale";
import { useCurrency } from "@/contexts/CurrencyContext";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

interface AddSubscriptionStepsProps {
  popularTemplates: SubscriptionTemplate[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onSubmit: (data: any) => void;
  onTemplateSelect: (template: SubscriptionTemplate) => void;
  isSubmitting: boolean;
}

// Form Schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default("USD"),
  billing_cycle: z.string().default("monthly"),
  category_id: z.string().min(1, "Category is required"),
  start_date: z.date(),
  next_billing_date: z.date(),
  payment_method_id: z.string().optional(),
  card_last_4: z.string().optional(),
  remind_3_days: z.boolean().default(true),
  remind_7_days: z.boolean().default(false),
  website_url: z.string().optional(),
  notes: z.string().optional(),
  usage_frequency: z.string().optional(),
  icon_url: z.string().optional(),
  template_id: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

export function AddSubscriptionSteps({
  popularTemplates,
  categories,
  paymentMethods,
  onSubmit,
  onTemplateSelect,
  isSubmitting
}: AddSubscriptionStepsProps) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const dateLocale = language === 'th' ? th : enUS;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: "",
      currency: "USD",
      billing_cycle: "monthly",
      category_id: "",
      start_date: new Date(),
      next_billing_date: addMonths(new Date(), 1),
      payment_method_id: "",
      card_last_4: "",
      remind_3_days: true,
      remind_7_days: false,
      website_url: "",
      notes: "",
      usage_frequency: "daily",
      icon_url: "",
      template_id: ""
    }
  });

  // Watch values for preview
  const watchedValues = form.watch();

  // Update next billing date when start date or billing cycle changes
  useEffect(() => {
    const startDate = form.getValues("start_date");
    const cycle = form.getValues("billing_cycle");
    
    if (startDate) {
      if (cycle === "monthly") {
        form.setValue("next_billing_date", addMonths(startDate, 1));
      } else if (cycle === "yearly") {
        form.setValue("next_billing_date", addYears(startDate, 1));
      }
    }
  }, [form.watch("start_date"), form.watch("billing_cycle")]);

  const handleTemplateSelect = (template: SubscriptionTemplate) => {
    // Determine category based on template category slug
    const category = categories.find(c => c.slug === template.categories?.slug);
    
    form.setValue("name", template.name);
    form.setValue("amount", template.amount.toString());
    form.setValue("currency", template.currency);
    form.setValue("billing_cycle", template.billing_cycle);
    form.setValue("website_url", template.website_url || "");
    form.setValue("icon_url", template.icon_url || "");
    form.setValue("template_id", template.id);
    
    if (category) {
      form.setValue("category_id", category.id);
      setSelectedCategory(category);
    }

    // Move to next step if it was a quick add click
    if (step === 1) {
      setStep(2);
    }

    onTemplateSelect(template);
  };

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(step);
    const result = await form.trigger(fieldsToValidate);
    
    if (result) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const getFieldsForStep = (currentStep: number): (keyof FormData)[] => {
    switch (currentStep) {
      case 1:
        return ["name", "amount", "currency", "category_id"];
      case 2:
        return ["billing_cycle", "start_date", "next_billing_date"];
      case 3:
        return ["payment_method_id"];
      default:
        return [];
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {step} of 4</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      Quick Add from Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SubscriptionTemplateBrowser 
                      templates={popularTemplates}
                      onSelect={handleTemplateSelect}
                    />
                  </CardContent>
                </Card>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or enter details manually</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription Name</FormLabel>
                        <div className="relative">
                          <SubscriptionNameAutocomplete
                            value={field.value}
                            onChange={field.onChange}
                            onSelectTemplate={handleTemplateSelect}
                            templates={popularTemplates}
                          />
                          {field.value && (
                             <div className="absolute left-3 top-2.5">
                               <SubscriptionIcon name={field.value} logoUrl={form.getValues("icon_url")} className="w-5 h-5" />
                             </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="THB">THB (฿)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="JPY">JPY (¥)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            const cat = categories.find(c => c.id === value);
                            setSelectedCategory(cat || null);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <span>{category.icon}</span>
                                  <span>{language === 'th' ? category.name_th : category.name_en}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <CalendarIcon className="w-5 h-5 text-blue-500" />
                     Billing Schedule
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="billing_cycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Cycle</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cycle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4">
                       <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>First Payment Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: dateLocale })
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date("2100-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="next_billing_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Next Payment Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: dateLocale })
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                 </CardContent>
               </Card>
            </div>
          )}

          {/* Step 3: Payment & Reminders */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-500" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="payment_method_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("payment_method_id") && (
                     <FormField
                      control={form.control}
                      name="card_last_4"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last 4 Digits (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="1234" maxLength={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-orange-500" />
                     Reminders
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="remind_3_days"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Remind me 3 days before
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remind_7_days"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Remind me 7 days before
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-500" />
                      Review Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <SubscriptionIcon name={watchedValues.name} logoUrl={watchedValues.icon_url} className="w-12 h-12" />
                        <div>
                          <h3 className="font-bold text-lg">{watchedValues.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">{selectedCategory?.name_en || "No Category"}</Badge>
                            <span>•</span>
                            <span>{watchedValues.billing_cycle}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {formatAmount(Number(watchedValues.amount), watchedValues.currency)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per {watchedValues.billing_cycle === 'monthly' ? 'month' : 'year'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                       <div className="space-y-1">
                         <span className="text-muted-foreground">Next Billing</span>
                         <p className="font-medium">{format(watchedValues.next_billing_date, "PPP", { locale: dateLocale })}</p>
                       </div>
                       <div className="space-y-1">
                         <span className="text-muted-foreground">Payment Method</span>
                         <p className="font-medium">
                           {paymentMethods.find(p => p.id === watchedValues.payment_method_id)?.name_en || "Not selected"}
                           {watchedValues.card_last_4 && ` (**** ${watchedValues.card_last_4})`}
                         </p>
                       </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Notes (Optional)</Label>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea placeholder="Add any notes about this subscription..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
             </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : (
              <div /> // Spacer
            )}
            
            {step < 4 ? (
              <Button type="button" onClick={handleNext}>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Confirm Subscription"}
                {!isSubmitting && <Check className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}