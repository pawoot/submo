import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Bell, Lightbulb, AlertTriangle, Sparkles } from "lucide-react";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface InsightPanelProps {
  subscriptions: Subscription[];
}

type InsightType = "high-spending" | "upcoming-renewal" | "savings-opportunity" | "category-duplicate" | "trend";

interface Insight {
  type: InsightType;
  message: string;
  priority: 1 | 2 | 3; // 1 = primary, 2-3 = secondary
  icon: React.ReactNode;
  variant: "default" | "warning" | "success" | "info";
}

export function InsightPanel({ subscriptions }: InsightPanelProps) {
  const { language } = useLanguage();
  const { preferredCurrency } = useCurrency();

  const insights = generateInsights(subscriptions, preferredCurrency, language);

  // Separate primary and secondary insights
  const primaryInsight = insights.find(i => i.priority === 1);
  const secondaryInsights = insights.filter(i => i.priority > 1).slice(0, 2);

  if (insights.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {language === "th" ? "ข้อมูลเชิงลึก" : "Submo Insights"}
          </h3>
        </div>

        <div className="space-y-4">
          {/* Primary Insight - Visually Prominent */}
          {primaryInsight && (
            <div className={`
              p-4 rounded-lg border-2 
              ${primaryInsight.variant === "warning" ? "border-yellow-500/50 bg-yellow-500/5" : ""}
              ${primaryInsight.variant === "success" ? "border-green-500/50 bg-green-500/5" : ""}
              ${primaryInsight.variant === "info" ? "border-blue-500/50 bg-blue-500/5" : ""}
              ${primaryInsight.variant === "default" ? "border-primary/50 bg-primary/5" : ""}
            `}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {primaryInsight.icon}
                </div>
                <p className="text-base font-medium text-foreground leading-relaxed">
                  {primaryInsight.message}
                </p>
              </div>
            </div>
          )}

          {/* Secondary Insights - Subtle */}
          {secondaryInsights.length > 0 && (
            <div className="space-y-2">
              {secondaryInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5 opacity-70">
                    {insight.icon}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function generateInsights(
  subscriptions: Subscription[],
  preferredCurrency: string,
  language: "th" | "en"
): Insight[] {
  const insights: Insight[] = [];

  // Calculate total monthly spending
  const totalMonthly = subscriptions.reduce((sum, sub) => {
    // Amount is already converted in the parent component
    const monthlyCost = sub.billing_cycle === "yearly" 
      ? (sub.amount / 12)
      : sub.amount;
    return sum + monthlyCost;
  }, 0);

  // Calculate baseline (simple average for now - can be enhanced)
  const baseline = totalMonthly * 0.85; // Assume baseline is 85% of current

  // Calculate previous month (mock - would come from historical data)
  const previousMonth = totalMonthly * 0.88;
  const changePercent = ((totalMonthly - previousMonth) / previousMonth * 100).toFixed(0);

  // Priority 1: High spending or trend
  if (totalMonthly > baseline * 1.15) {
    insights.push({
      type: "high-spending",
      priority: 1,
      variant: "warning",
      icon: <TrendingUp className="w-5 h-5 text-yellow-600" />,
      message: language === "th"
        ? `คุณใช้จ่ายมากกว่าค่าเฉลี่ยปกติ (฿${baseline.toFixed(0)})`
        : `You're spending more than your usual average (${preferredCurrency}${baseline.toFixed(0)})`
    });
  } else if (Math.abs(parseFloat(changePercent)) >= 10) {
    const isIncrease = parseFloat(changePercent) > 0;
    insights.push({
      type: "trend",
      priority: 1,
      variant: isIncrease ? "warning" : "success",
      icon: isIncrease 
        ? <TrendingUp className="w-5 h-5 text-yellow-600" />
        : <TrendingDown className="w-5 h-5 text-green-600" />,
      message: language === "th"
        ? `การใช้จ่ายของคุณ${isIncrease ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(parseFloat(changePercent))}% จากเดือนที่แล้ว`
        : `Your spending ${isIncrease ? "increased" : "decreased"} by ${Math.abs(parseFloat(changePercent))}% from last month`
    });
  } else {
    insights.push({
      type: "high-spending",
      priority: 1,
      variant: "default",
      icon: <Sparkles className="w-5 h-5 text-primary" />,
      message: language === "th"
        ? `คุณใช้จ่าย ฿${totalMonthly.toFixed(0)} ต่อเดือนสำหรับ Subscriptions`
        : `You spend ${preferredCurrency}${totalMonthly.toFixed(0)}/month on subscriptions`
    });
  }

  // Priority 2: Upcoming renewals
  const now = new Date();
  const upcomingSoon = subscriptions.filter(sub => {
    if (!sub.next_billing_date) return false;
    const nextDate = new Date(sub.next_billing_date);
    const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  });

  if (upcomingSoon.length > 0) {
    insights.push({
      type: "upcoming-renewal",
      priority: 2,
      variant: "info",
      icon: <Bell className="w-4 h-4 text-blue-600" />,
      message: language === "th"
        ? `${upcomingSoon.length} บริการจะต่ออายุภายใน 7 วัน`
        : `${upcomingSoon.length} ${upcomingSoon.length === 1 ? "subscription" : "subscriptions"} renewing within 7 days`
    });
  }

  // Priority 3: Savings opportunity (highest cost item)
  const sortedByCost = [...subscriptions]
    .map(sub => {
      const yearlyCost = sub.billing_cycle === "yearly" 
        ? sub.amount
        : sub.amount * 12;
      return { ...sub, yearlyCost };
    })
    .sort((a, b) => b.yearlyCost - a.yearlyCost);

  if (sortedByCost.length > 0 && sortedByCost[0].yearlyCost > 1000) {
    const topSub = sortedByCost[0];
    insights.push({
      type: "savings-opportunity",
      priority: 3,
      variant: "success",
      icon: <Lightbulb className="w-4 h-4 text-green-600" />,
      message: language === "th"
        ? `ยกเลิก ${topSub.name} สามารถประหยัดได้ ฿${topSub.yearlyCost.toFixed(0)}/ปี`
        : `Canceling ${topSub.name} could save you ${preferredCurrency}${topSub.yearlyCost.toFixed(0)}/year`
    });
  }

  // Priority 3: Category duplicates
  const categoryCount = new Map<string, number>();
  subscriptions.forEach(sub => {
    if (sub.category) {
      categoryCount.set(sub.category, (categoryCount.get(sub.category) || 0) + 1);
    }
  });

  const duplicateCategories = Array.from(categoryCount.entries())
    .filter(([, count]) => count > 1);

  if (duplicateCategories.length > 0) {
    const [topCategory, count] = duplicateCategories[0];
    insights.push({
      type: "category-duplicate",
      priority: 3,
      variant: "warning",
      icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
      message: language === "th"
        ? `คุณมี ${count} บริการในหมวด ${topCategory}`
        : `You have ${count} subscriptions in ${topCategory}`
    });
  }

  // Sort by priority and return max 3
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 3);
}