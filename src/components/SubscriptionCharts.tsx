import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, PieChart as PieChartIcon, Search, Filter, PackagePlus, TrendingUp, Sparkles, CreditCard, Building2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { subscriptionService } from "@/services/subscriptionService";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import type { Database } from "@/integrations/supabase/types";

// Types
type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"] & {
  categories?: {
    id: string;
    name_en: string;
    name_th: string;
    slug: string;
    icon: string;
    color: string;
  } | null;
  payment_methods?: {
    id: string;
    name_en: string;
    name_th: string;
    slug: string;
    icon: string;
    color: string;
  } | null;
};

type Category = Database["public"]["Tables"]["categories"]["Row"];
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

interface ChartDataPoint {
  name: string;
  amount: number;
  icon: string;
  color: string;
  percentage?: string;
  services?: CategoryChartService[];
  [key: string]: any;
}

interface CategoryChartService {
  id: string;
  name: string;
  websiteUrl: string | null;
  iconUrl: string | null;
  monthlyAmount: number;
}

function chartColor(color: string | null | undefined, fallback: string) {
  const hex = color?.trim().replace("#", "");
  if (!hex || !/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return color || fallback;

  const expanded = hex.length === 3 ? hex.split("").map((value) => value + value).join("") : hex;
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  const luminance = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;

  return luminance < 0.18 ? fallback : `#${expanded}`;
}

function ServicesTooltip({ active, payload, preferredCurrency, formatCurrency, totalLabel }: any) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as ChartDataPoint | undefined;
  if (!point) return null;

  return (
    <div className="min-w-52 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-semibold">{point.name}</p>
        <p className="text-xs text-muted-foreground">{formatCurrency(point.amount, preferredCurrency)}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{totalLabel}</p>
      {point.services?.length ? (
        <div className="mt-3 space-y-2 border-t border-border/70 pt-2">
          {point.services.map((service) => (
            <div key={service.id} className="flex items-center gap-2">
              <SubscriptionIcon
                name={service.name}
                websiteUrl={service.websiteUrl}
                iconUrl={service.iconUrl}
                size="sm"
                bare
                className="h-5 w-5 shrink-0"
              />
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{service.name}</span>
              <span className="text-xs text-muted-foreground">{formatCurrency(service.monthlyAmount, preferredCurrency)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CategoryBarWithServices(props: any) {
  const { x, y, width, height, fill, payload } = props;
  const services: CategoryChartService[] = payload?.services || [];
  const visibleServices = services.slice(0, 3);
  const hiddenServiceCount = Math.max(0, services.length - visibleServices.length);
  const itemCount = visibleServices.length + (hiddenServiceCount > 0 ? 1 : 0);

  if (![x, y, width, height].every((value) => Number.isFinite(Number(value)))) return null;

  const iconSize = 24;
  const gap = 3;
  const stackHeight = itemCount ? itemCount * iconSize + (itemCount - 1) * gap : 0;
  const stackFitsInsideBar = height >= stackHeight + 18;
  const stackY = stackFitsInsideBar
    ? y + 10
    : Math.max(6, y - stackHeight + Math.min(height, iconSize));
  const stackX = x + width / 2 - iconSize / 2;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} ry={6} fill={fill} />
      {itemCount > 0 && (
        <foreignObject x={stackX} y={stackY} width={iconSize} height={stackHeight} style={{ overflow: "visible", pointerEvents: "none" }}>
          <div className="flex flex-col items-center gap-[3px]">
            {visibleServices.map((service) => (
              <SubscriptionIcon
                key={service.id}
                name={service.name}
                websiteUrl={service.websiteUrl}
                iconUrl={service.iconUrl}
                size="sm"
                bare
                title={service.name}
                className="h-6 w-6 shrink-0 shadow-sm"
              />
            ))}
            {hiddenServiceCount > 0 && (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-[9px] font-bold text-foreground shadow-sm">
                +{hiddenServiceCount}
              </span>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

function PaymentBarWithServices(props: any) {
  const { x, y, width, height, fill, payload } = props;
  const services: CategoryChartService[] = payload?.services || [];
  const visibleServices = services.slice(0, 3);
  const hiddenServiceCount = Math.max(0, services.length - visibleServices.length);
  const itemCount = visibleServices.length + (hiddenServiceCount > 0 ? 1 : 0);

  if (![x, y, width, height].every((value) => Number.isFinite(Number(value)))) return null;

  const iconSize = 24;
  const overlap = 5;
  const rowWidth = itemCount ? iconSize + (itemCount - 1) * (iconSize - overlap) : 0;
  const rowFitsInsideBar = width >= rowWidth + 18;
  const rowX = rowFitsInsideBar ? x + 9 : x + width + 7;
  const rowY = y + height / 2 - iconSize / 2;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} ry={6} fill={fill} />
      {itemCount > 0 && (
        <foreignObject x={rowX} y={rowY} width={rowWidth} height={iconSize} style={{ overflow: "visible", pointerEvents: "none" }}>
          <div className="flex items-center">
            {visibleServices.map((service, index) => (
              <SubscriptionIcon
                key={service.id}
                name={service.name}
                websiteUrl={service.websiteUrl}
                iconUrl={service.iconUrl}
                size="sm"
                bare
                title={service.name}
                className={`h-6 w-6 shrink-0 shadow-sm ${index > 0 ? "-ml-[5px]" : ""}`}
              />
            ))}
            {hiddenServiceCount > 0 && (
              <span className="-ml-[5px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-[9px] font-bold text-foreground shadow-sm">
                +{hiddenServiceCount}
              </span>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export function SubscriptionCharts() {
  // Data State
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chart Data State
  const [categoryChartData, setCategoryChartData] = useState<ChartDataPoint[]>([]);
  const [paymentChartData, setPaymentChartData] = useState<ChartDataPoint[]>([]);
  const [calculating, setCalculating] = useState(false);
  
  // Context
  const { preferredCurrency, convertAmount } = useCurrency();
  const { t, language } = useLanguage();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBilling, setSelectedBilling] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("all");

  // Load Initial Data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsData, catsData, paymentData] = await Promise.all([
        subscriptionService.getUserSubscriptions(),
        subscriptionService.getCategories(),
        subscriptionService.getPaymentMethods()
      ]);
      setSubscriptions(subsData);
      setCategories(catsData);
      setPaymentMethods(paymentData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Calculate Monthly Cost
  const calculateMonthlyCost = (sub: Subscription) => {
    let monthlyCost = sub.amount;
    switch (sub.billing_cycle) {
      case "yearly": monthlyCost = sub.amount / 12; break;
      case "quarterly": monthlyCost = sub.amount / 3; break;
      case "half-yearly": monthlyCost = sub.amount / 6; break;
    }
    return monthlyCost;
  };

  // Labels Maps
  const categoryLabels = useMemo(() => {
    const labels: { [key: string]: { label: string; icon: string; color: string } } = {};
    categories.forEach(cat => {
      labels[cat.id] = {
        label: language === 'th' ? cat.name_th : cat.name_en,
        icon: cat.icon,
        color: cat.color
      };
    });
    return labels;
  }, [categories, language]);

  const paymentMethodLabels = useMemo(() => {
    const labels: { [key: string]: { label: string; icon: string; color: string } } = {};
    paymentMethods.forEach(pm => {
      labels[pm.id] = {
        label: language === 'th' ? pm.name_th : pm.name_en,
        icon: pm.icon,
        color: pm.color
      };
    });
    return labels;
  }, [paymentMethods, language]);

  // Filter Subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      // Only show active subscriptions
      if (!sub.is_active) return false;
      
      if (searchQuery && !sub.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategory !== "all" && sub.category_id !== selectedCategory) return false;
      if (selectedBilling !== "all" && sub.billing_cycle !== selectedBilling) return false;
      
      if (timeRange !== "all") {
        const nextBilling = new Date(sub.next_billing_date);
        const now = new Date();
        const daysUntil = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (timeRange === "this-month" && daysUntil > 30) return false;
        if (timeRange === "this-quarter" && daysUntil > 90) return false;
        if (timeRange === "this-year" && daysUntil > 365) return false;
        if (timeRange === "expiring-soon" && daysUntil > 7) return false;
      }
      return true;
    });
  }, [subscriptions, searchQuery, selectedCategory, selectedBilling, timeRange]);

  // Calculate Chart Data (Async)
  useEffect(() => {
    const calculateData = async () => {
      setCalculating(true);
      try {
        // 1. Initialize maps
        const catMap: { [key: string]: number } = {};
        const payMap: { [key: string]: number } = {};
        const categoryServices: { [key: string]: Map<string, CategoryChartService> } = {};
        const paymentServices: { [key: string]: Map<string, CategoryChartService> } = {};

        // 2. Process each subscription sequentially
        for (const sub of filteredSubscriptions) {
          try {
            const monthlyRaw = calculateMonthlyCost(sub);
            // Convert to preferred currency
            const convertedAmount = await convertAmount(monthlyRaw, sub.currency || "THB");
            
            // Aggregate Category
            const catId = sub.category_id || "unknown";
            catMap[catId] = (catMap[catId] || 0) + convertedAmount;
            if (!categoryServices[catId]) categoryServices[catId] = new Map();
            categoryServices[catId].set(sub.id, {
              id: sub.id,
              name: sub.name,
              websiteUrl: sub.website_url,
              iconUrl: sub.icon_url || sub.logo_url,
              monthlyAmount: convertedAmount,
            });

            // Aggregate Payment Method
            const payId = sub.payment_method_id || "unknown";
            payMap[payId] = (payMap[payId] || 0) + convertedAmount;
            if (!paymentServices[payId]) paymentServices[payId] = new Map();
            paymentServices[payId].set(sub.id, {
              id: sub.id,
              name: sub.name,
              websiteUrl: sub.website_url,
              iconUrl: sub.icon_url || sub.logo_url,
              monthlyAmount: convertedAmount,
            });
          } catch (error) {
            console.error(`Error processing subscription ${sub.id}:`, error);
            // Continue with next subscription if one fails
          }
        }

        // 3. Format Category Data
        const totalCatAmount = Object.values(catMap).reduce((sum, val) => sum + val, 0);
        
        const catData: ChartDataPoint[] = Object.entries(catMap)
          .map(([id, amount]) => ({
            name: categoryLabels[id]?.label || t("common.unknown"),
            amount: amount,
            icon: categoryLabels[id]?.icon || "📦",
            color: chartColor(categoryLabels[id]?.color, "#6366f1"),
            percentage: totalCatAmount > 0 ? ((amount / totalCatAmount) * 100).toFixed(0) : "0",
            services: Array.from(categoryServices[id]?.values() || []).sort((a, b) => b.monthlyAmount - a.monthlyAmount),
          }))
          .sort((a, b) => b.amount - a.amount);

        // 4. Format Payment Data
        const totalPayAmount = Object.values(payMap).reduce((sum, val) => sum + val, 0);

        const payData: ChartDataPoint[] = Object.entries(payMap)
          .map(([id, amount]) => ({
            name: paymentMethodLabels[id]?.label || t("common.unknown"),
            amount: amount,
            icon: paymentMethodLabels[id]?.icon || "💳",
            color: chartColor(paymentMethodLabels[id]?.color, "#64748b"),
            percentage: totalPayAmount > 0 ? ((amount / totalPayAmount) * 100).toFixed(0) : "0",
            services: Array.from(paymentServices[id]?.values() || []).sort((a, b) => b.monthlyAmount - a.monthlyAmount),
          }))
          .sort((a, b) => b.amount - a.amount);

        setCategoryChartData(catData);
        setPaymentChartData(payData);

      } catch (error) {
        console.error("Error calculating chart data:", error);
      } finally {
        setCalculating(false);
      }
    };

    if (!loading) {
      calculateData();
    }
  }, [filteredSubscriptions, preferredCurrency, categoryLabels, paymentMethodLabels, loading, convertAmount, t]);

  // Empty State
  if (!loading && subscriptions.length === 0) {
    return (
      <div className="mb-8">
        <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 shadow-xl overflow-hidden">
          <CardContent className="py-20 px-8">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-8 shadow-2xl">
                  <PackagePlus className="w-20 h-20 text-white" strokeWidth={1.5} />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-bounce" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t("charts.emptyTitle")}</h2>
                <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">{t("charts.emptyDesc")}</p>
              </div>
              <div className="pt-4">
                <Link href="/add-subscription">
                  <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-10 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <PackagePlus className="w-6 h-6 mr-3" />
                    {t("charts.addFirst")}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{t("common.loading")}</p>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-2 border-gray-100 bg-card dark:border-slate-800">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-slate-100">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                  {t("charts.monthlyByCategory")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  {calculating ? (
                    <div className="flex h-full items-center justify-center text-gray-400">{t("common.loading")}</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80} 
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip content={<ServicesTooltip preferredCurrency={preferredCurrency} formatCurrency={formatCurrency} totalLabel={t("dashboard.totalCost")} />} />
                        <Bar dataKey="amount" fill="#6366f1" shape={CategoryBarWithServices}>
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Cost */}
            <Card className="shadow-lg border-2 border-gray-100 bg-card dark:border-slate-800">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-slate-100">
                  <CreditCard className="w-6 h-6 text-indigo-600" />
                  {t("charts.paymentMethodCost")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentChartData} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip content={<ServicesTooltip preferredCurrency={preferredCurrency} formatCurrency={formatCurrency} totalLabel={t("dashboard.totalCost")} />} />
                      <Bar dataKey="amount" shape={PaymentBarWithServices}>
                        {paymentChartData.map((entry, index) => (
                          <Cell key={`payment-cell-${index}`} fill={entry.color || "#2563eb"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
