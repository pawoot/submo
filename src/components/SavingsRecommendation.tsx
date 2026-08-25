import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSubscriptionCosts, type SubscriptionCost } from "@/hooks/useSubscriptionCosts";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Eye, Clock, Bell } from "lucide-react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface SavingsRecommendationProps {
  subscriptions: Subscription[];
  onToggleReminder?: (id: string, currentEnabled: boolean) => Promise<void>;
}

type RecommendationType = "high-cost" | "duplicate-category" | "rarely-used";

interface Recommendation {
  subscription: Subscription;
  reason: RecommendationType;
  monthlyCost: number;
  yearlyCost: number;
  reasonText: string;
}

export function SavingsRecommendation({ subscriptions, onToggleReminder }: SavingsRecommendationProps) {
  const { language, t } = useLanguage();
  const { preferredCurrency, formatCurrency } = useCurrency();
  const router = useRouter();
  const { toast } = useToast();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const { costs, isLoading } = useSubscriptionCosts(subscriptions);
  const recommendations = generateRecommendations(costs, language)
    .filter(rec => !dismissedIds.includes(rec.subscription.id))
    .slice(0, 3); // Limit to top 3

  const handleEnableReminder = async (subId: string) => {
    if (onToggleReminder) {
      await onToggleReminder(subId, false);
    } else {
      toast({
        title: t("dashboard.reminderEnabled"),
        description: language === "th" ? "คุณจะได้รับการแจ้งเตือนก่อนวันต่ออายุ" : "You'll receive a notification before renewal",
      });
    }
  };

  const handleRemindLater = (subId: string) => {
    setDismissedIds(prev => [...prev, subId]);
    toast({
      title: t("dashboard.remindedLater"),
      description: language === "th" ? "เราจะแสดงคำแนะนำนี้อีกครั้งในภายหลัง" : "We'll show this recommendation again later",
    });
  };

  if (isLoading || recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 via-background to-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-green-600" />
          {t("dashboard.savingsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.subscription.id}
            className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <SubscriptionIcon
                  name={rec.subscription.name}
                  iconUrl={rec.subscription.icon_url || rec.subscription.logo_url}
                  websiteUrl={rec.subscription.website_url}
                  className="w-10 h-10"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-foreground truncate">{rec.subscription.name}</h4>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {getReasonBadgeText(rec.reason, language)}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  {rec.reasonText}
                </p>

                <div className="flex items-center gap-2 text-sm mb-3">
                  <span className="font-medium text-foreground">
                    {formatCurrency(rec.monthlyCost, preferredCurrency)}/{t("dashboard.month")}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(rec.yearlyCost, preferredCurrency)}/{t("dashboard.year")}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/edit-subscription/${rec.subscription.id}`)}
                    className="gap-2"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t("dashboard.review")}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEnableReminder(rec.subscription.id)}
                    className="gap-2"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {t("dashboard.enableReminder")}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemindLater(rec.subscription.id)}
                    className="gap-2"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {t("dashboard.remindLater")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function generateRecommendations(
  subsWithCosts: SubscriptionCost[],
  language: "th" | "en"
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Calculate total monthly spending
  const totalMonthly = subsWithCosts.reduce((sum, sub) => sum + sub.monthlyCost, 0);

  // Find high-cost subscriptions (top 30% or > 20% of total)
  const sorted = [...subsWithCosts].sort((a, b) => b.yearlyCost - a.yearlyCost);
  const top30PercentCount = Math.max(1, Math.ceil(sorted.length * 0.3));

  sorted.slice(0, top30PercentCount).forEach(sub => {
    const percentOfTotal = (sub.monthlyCost / totalMonthly) * 100;
    if (percentOfTotal > 20 || sub.yearlyCost > 3000) {
      recommendations.push({
        subscription: sub.subscription,
        reason: "high-cost",
        monthlyCost: sub.monthlyCost,
        yearlyCost: sub.yearlyCost,
        reasonText: language === "th"
          ? `คิดเป็น ${percentOfTotal.toFixed(0)}% ของค่าใช้จ่ายรวม`
          : `Represents ${percentOfTotal.toFixed(0)}% of your total spending`
      });
    }
  });

  // Find duplicate categories
  const categoryMap = new Map<string, typeof subsWithCosts>();
  subsWithCosts.forEach(sub => {
    if (sub.subscription.category) {
      const existing = categoryMap.get(sub.subscription.category) || [];
      categoryMap.set(sub.subscription.category, [...existing, sub]);
    }
  });

  categoryMap.forEach((subs, category) => {
    if (subs.length > 1) {
      // Add all but the most expensive one
      const sortedSubs = [...subs].sort((a, b) => b.yearlyCost - a.yearlyCost);
      sortedSubs.slice(1).forEach(sub => {
        // Avoid duplicates
        if (!recommendations.find(r => r.subscription.id === sub.subscription.id)) {
          recommendations.push({
            subscription: sub.subscription,
            reason: "duplicate-category",
            monthlyCost: sub.monthlyCost,
            yearlyCost: sub.yearlyCost,
            reasonText: language === "th"
              ? `คุณมี ${subs.length} บริการในหมวด ${category}`
              : `You have ${subs.length} subscriptions in ${category}`
          });
        }
      });
    }
  });

  // Sort by potential savings (yearly cost)
  return recommendations.sort((a, b) => b.yearlyCost - a.yearlyCost);
}

function getReasonBadgeText(reason: RecommendationType, language: "th" | "en"): string {
  const badges = {
    "high-cost": { th: "ค่าใช้จ่ายสูง", en: "High Cost" },
    "duplicate-category": { th: "หมวดหมู่ซ้ำ", en: "Duplicate" },
    "rarely-used": { th: "ใช้ไม่บ่อย", en: "Rarely Used" }
  };
  return badges[reason][language];
}
