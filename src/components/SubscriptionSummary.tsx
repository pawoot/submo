import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Calendar, DollarSign } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";

interface SubscriptionSummaryProps {
  name: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "quarterly" | "half-yearly";
  nextBillingDate?: Date;
  remind3Days?: boolean;
  remind7Days?: boolean;
}

export function SubscriptionSummary({
  name,
  amount,
  currency,
  billingCycle,
  nextBillingDate,
  remind3Days = false,
  remind7Days = false
}: SubscriptionSummaryProps) {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  // Calculate monthly and yearly costs
  const getMonthlyCost = () => {
    switch (billingCycle) {
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

  const getYearlyCost = () => {
    switch (billingCycle) {
      case "monthly":
        return amount * 12;
      case "quarterly":
        return amount * 4;
      case "half-yearly":
        return amount * 2;
      case "yearly":
        return amount;
      default:
        return amount * 12;
    }
  };

  const monthlyCost = getMonthlyCost();
  const yearlyCost = getYearlyCost();

  // Check if this is a high-cost subscription (> 2x monthly average assumption of 500)
  const isHighCost = monthlyCost > 1000;

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
      <CardHeader className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-indigo-600" />
          {t("addSub.costSummary")}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Subscription Name */}
        {name && (
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t("addSub.subscription")}</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{name}</p>
          </div>
        )}

        {/* Monthly Cost */}
        {amount > 0 && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t("subscription.monthly_cost")}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(monthlyCost, currency)}
              </p>
            </div>

            {/* Yearly Cost (Highlighted) */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                {t("subscription.yearly_cost")}
              </p>
              <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                {formatCurrency(yearlyCost, currency)}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                {billingCycle === "yearly" ? t("addSub.billedYearly") : t("addSub.calculatedYearly")}
              </p>
            </div>

            {/* Billing Info */}
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>
                {billingCycle === "yearly" 
                  ? t("addSub.yearlyBillingInfo")
                  : t("addSub.monthlyBillingInfo")
                }
              </p>
            </div>
          </div>
        )}

        {/* Next Billing Date */}
        {nextBillingDate && (
          <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <Calendar className="w-4 h-4 mt-0.5 text-slate-600 dark:text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {t("addSub.nextBilling")}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {format(nextBillingDate, "PPP")}
              </p>
            </div>
          </div>
        )}

        {/* Reminders Status */}
        {(remind3Days || remind7Days) && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {t("addSub.remindersEnabled")}
            </p>
            {remind3Days && (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>3 {t("common.days")} {t("addSub.beforeBilling")}</span>
              </div>
            )}
            {remind7Days && (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>7 {t("common.days")} {t("addSub.beforeBilling")}</span>
              </div>
            )}
          </div>
        )}

        {/* High Cost Warning */}
        {isHighCost && amount > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                {t("addSub.highCostWarning")}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                {t("addSub.highCostDesc")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}