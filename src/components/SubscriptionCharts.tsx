import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, PieChart as PieChartIcon, Search, Filter, PackagePlus, TrendingUp, Sparkles, CreditCard, Building2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { subscriptionService } from "@/services/subscriptionService";
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
        subscriptionService.getAll(),
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

        // 2. Process each subscription
        await Promise.all(filteredSubscriptions.map(async (sub) => {
          const monthlyRaw = calculateMonthlyCost(sub);
          // Convert to preferred currency
          const convertedAmount = await convertAmount(monthlyRaw, sub.currency || "THB");
          
          // Aggregate Category
          const catId = sub.category_id || "unknown";
          catMap[catId] = (catMap[catId] || 0) + convertedAmount;

          // Aggregate Payment Method
          const payId = sub.payment_method_id || "unknown";
          payMap[payId] = (payMap[payId] || 0) + convertedAmount;
        }));

        // 3. Format Category Data
        const catData = Object.entries(catMap)
          .map(([id, amount]) => ({
            name: categoryLabels[id]?.label || t("common.unknown"),
            amount: amount,
            icon: categoryLabels[id]?.icon || "📦",
            color: categoryLabels[id]?.color || "#94a3b8"
          }))
          .sort((a, b) => b.amount - a.amount);

        // Add percentages
        const totalCat = catData.reduce((sum, item) => sum + item.amount, 0);
        catData.forEach(item => {
          item.percentage = totalCat > 0 ? ((item.amount / totalCat) * 100).toFixed(0) : "0";
        });

        // 4. Format Payment Data
        const payData = Object.entries(payMap)
          .map(([id, amount]) => ({
            name: paymentMethodLabels[id]?.label || t("common.unknown"),
            amount: amount,
            icon: paymentMethodLabels[id]?.icon || "💳",
            color: paymentMethodLabels[id]?.color || "#94a3b8"
          }))
          .sort((a, b) => b.amount - a.amount);

        // Add percentages
        const totalPay = payData.reduce((sum, item) => sum + item.amount, 0);
        payData.forEach(item => {
          item.percentage = totalPay > 0 ? ((item.amount / totalPay) * 100).toFixed(0) : "0";
        });

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
    <div className="mb-8 space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search Box */}
          <div className="md:col-span-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">{t("search.label")}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t("search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* Time Range Dropdown */}
          <div className="md:col-span-3">
            <label className="text-sm font-medium text-gray-700 mb-2 block">{t("filter.timePeriod")}</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t("filter.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.all")}</SelectItem>
                <SelectItem value="this-month">{t("charts.thisMonth")}</SelectItem>
                <SelectItem value="this-quarter">{t("charts.thisQuarter")}</SelectItem>
                <SelectItem value="this-year">{t("charts.thisYear")}</SelectItem>
                <SelectItem value="expiring-soon">{t("charts.expiringSoon")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Billing Cycle Dropdown */}
          <div className="md:col-span-3">
            <label className="text-sm font-medium text-gray-700 mb-2 block">{t("addSub.billing")}</label>
            <Select value={selectedBilling} onValueChange={setSelectedBilling}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t("filter.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.all")}</SelectItem>
                <SelectItem value="monthly">{t("subscriptions.monthly")}</SelectItem>
                <SelectItem value="quarterly">{t("subscriptions.quarterly")}</SelectItem>
                <SelectItem value="half-yearly">{t("subscriptions.halfYearly")}</SelectItem>
                <SelectItem value="yearly">{t("subscriptions.yearly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="md:col-span-2">
            <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {t("common.search")}
            </Button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-between bg-white rounded-xl border-2 border-gray-100 p-4">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 w-full">
          <TabsList className="bg-gray-50 flex flex-wrap h-auto p-1 gap-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-semibold">
              {t("filter.all")}
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger 
                key={category.id}
                value={category.id} 
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 gap-2"
              >
                <span>{category.icon}</span>
                <span>{language === 'th' ? category.name_th : category.name_en}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filteredSubscriptions.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 shadow-lg">
          <CardContent className="py-16 text-center">
            <div className="max-w-lg mx-auto space-y-4">
              <div className="relative inline-block">
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-full p-6 shadow-inner">
                  <Search className="w-16 h-16 text-gray-400" strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-700">{t("charts.noResults")}</h3>
                <p className="text-gray-500 text-base max-w-sm mx-auto">{t("charts.noResultsDesc")}</p>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedBilling("all");
                  setTimeRange("all");
                }}
                className="mt-4 border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 font-semibold"
              >
                <Filter className="w-4 h-4 mr-2" />
                {t("charts.clearFilters")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Category Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-white">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                  {t("charts.monthlyByCategory")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[350px] w-full">
                  {calculating ? (
                    <div className="flex h-full items-center justify-center text-gray-400">Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: number) => [new Intl.NumberFormat(undefined, { style: 'currency', currency: preferredCurrency }).format(value), 'Cost']}
                          contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.98)", borderRadius: "12px", border: "2px solid #e2e8f0" }}
                        />
                        <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]}>
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <PieChartIcon className="w-6 h-6 text-purple-600" />
                  {t("charts.categoryDistribution")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[350px] w-full">
                  {calculating ? (
                    <div className="flex h-full items-center justify-center text-gray-400">Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percentage }: any) => `${name} ${percentage}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="name"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [new Intl.NumberFormat(undefined, { style: 'currency', currency: preferredCurrency }).format(value), 'Cost']}
                          contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.98)", borderRadius: "12px", border: "2px solid #e2e8f0" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  {t("charts.paymentMethodCost")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[350px] w-full">
                  {calculating ? (
                    <div className="flex h-full items-center justify-center text-gray-400">Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={paymentChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: number) => [new Intl.NumberFormat(undefined, { style: 'currency', currency: preferredCurrency }).format(value), 'Cost']}
                          contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.98)", borderRadius: "12px", border: "2px solid #e2e8f0" }}
                        />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                          {paymentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <PieChartIcon className="w-6 h-6 text-green-600" />
                  {t("charts.paymentMethodDistribution")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[350px] w-full">
                  {calculating ? (
                    <div className="flex h-full items-center justify-center text-gray-400">Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percentage }: any) => {
                             const label = name;
                             return `${label} ${percentage}%`;
                          }}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="name"
                        >
                          {paymentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [new Intl.NumberFormat(undefined, { style: 'currency', currency: preferredCurrency }).format(value), 'Cost']}
                          contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.98)", borderRadius: "12px", border: "2px solid #e2e8f0" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}