import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, TrendingUp, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format, addMonths, addYears } from "date-fns";
import { th, enUS } from "date-fns/locale";

interface SubscriptionSummaryProps {
  name: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "quarterly" | "half-yearly";
  startDate: Date | null;
  nextBillingDate: Date | null;
  remind3Days: boolean;
  remind7Days: boolean;
}

export function SubscriptionSummary({
  name,
  amount,
  currency,
  billingCycle,
  startDate,
  nextBillingDate,
  remind3Days,
  remind7Days
}: SubscriptionSummaryProps) {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrency();

  // Calculate costs
  const monthlyCost = billingCycle === "monthly" ? amount :
    billingCycle === "yearly" ? amount / 12 :
    billingCycle === "quarterly" ? amount / 3 :
    amount / 6;

  const yearlyCost = billingCycle === "monthly" ? amount * 12 :
    billingCycle === "yearly" ? amount :
    billingCycle === "quarterly" ? amount * 4 :
    amount * 2;

  const locale = language === "th" ? th : enUS;

  // Calculate next billing if not provided
  const calculatedNextBilling = nextBillingDate || (startDate ? (
    billingCycle === "monthly" ? addMonths(startDate, 1) :
    billingCycle === "yearly" ? addYears(startDate, 1) :
    billingCycle === "quarterly" ? addMonths(startDate, 3) :
    addMonths(startDate, 6)
  ) : null);

  const hasReminders = remind3Days || remind7Days;

  return (
    <Card className="sticky top-4 border-2 border-indigo-100 dark:border-indigo-900 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {t("addSub.costSummary")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subscription Name */}
        {name && (
          <div>
            <p className="text-sm text-muted-foreground">{t("addSub.name")}</p>
            <p className="font-semibold text-lg">{name}</p>
          </div>
        )}

        {/* Monthly Cost */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-sm">{t("subscription.monthly_cost")}</span>
          </div>
          <span className="font-bold text-lg">
            {formatCurrency(monthlyCost, currency)}
          </span>
        </div>

        {/* Yearly Cost - Highlighted */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 rounded-lg text-white">
          <div>
            <p className="text-xs opacity-90">{t("subscription.yearly_cost")}</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(yearlyCost, currency)}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 opacity-80" />
        </div>

        {/* Billing Cycle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("addSub.billing")}</span>
          <Badge variant="secondary" className="capitalize">
            {billingCycle === "monthly" ? t("addSub.billingMonthly") :
             billingCycle === "yearly" ? t("addSub.billingYearly") :
             billingCycle === "quarterly" ? t("subscriptions.quarterly") :
             t("subscriptions.halfYearly")}
          </Badge>
        </div>

        {/* Next Billing Date */}
        {calculatedNextBilling && (
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{t("addSub.nextBillingDate")}</span>
            </div>
            <span className="font-medium">
              {format(calculatedNextBilling, "d MMM yyyy", { locale })}
            </span>
          </div>
        )}

        {/* Reminders */}
        {hasReminders && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                {t("addSub.remindersEnabled")}
              </p>
              <ul className="text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                {remind3Days && <li>• 3 {t("common.days")} {t("addSub.beforeBilling")}</li>}
                {remind7Days && <li>• 7 {t("common.days")} {t("addSub.beforeBilling")}</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Helpful Message */}
        {amount > 0 && (
          <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-center text-muted-foreground">
              {billingCycle === "yearly" 
                ? t("addSub.yearlyBillingInfo")
                : t("addSub.monthlyBillingInfo")
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}