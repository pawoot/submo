import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Filter, X } from "lucide-react";
import { useState } from "react";

interface Subscription {
  id: number;
  name: string;
  cost: number;
  currency: string;
  billing: string;
  category: string;
  nextBillingDate: string;
}

interface SubscriptionChartsProps {
  subscriptions: Subscription[];
}

const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ef4444", // red
  "#06b6d4", // cyan
  "#84cc16", // lime
];

const categoryLabels: { [key: string]: string } = {
  design: "Design",
  development: "Development",
  productivity: "Productivity",
  entertainment: "Entertainment",
  storage: "Storage",
  communication: "Communication",
  marketing: "Marketing",
  education: "Education",
  other: "Other"
};

const billingLabels: { [key: string]: string } = {
  monthly: "รายเดือน",
  yearly: "รายปี",
  quarterly: "ราย 3 เดือน",
  biannually: "ราย 6 เดือน"
};

export function SubscriptionCharts({ subscriptions }: SubscriptionChartsProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBilling, setSelectedBilling] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("all");

  // ดึงหมวดหมู่ทั้งหมดที่มีใน subscriptions
  const availableCategories = Array.from(new Set(subscriptions.map(sub => sub.category)));

  // กรองข้อมูลตาม filters
  const filteredSubscriptions = subscriptions.filter(sub => {
    // กรองตามหมวดหมู่
    if (selectedCategories.length > 0 && !selectedCategories.includes(sub.category)) {
      return false;
    }

    // กรองตามรอบชำระ
    if (selectedBilling !== "all" && sub.billing !== selectedBilling) {
      return false;
    }

    // กรองตามช่วงเวลา
    if (timeRange !== "all") {
      const today = new Date();
      const nextBilling = new Date(sub.nextBillingDate);
      const daysDiff = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (timeRange === "this-month" && daysDiff > 30) return false;
      if (timeRange === "this-quarter" && daysDiff > 90) return false;
      if (timeRange === "this-year" && daysDiff > 365) return false;
      if (timeRange === "expiring-soon" && daysDiff > 7) return false;
    }

    return true;
  });

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedBilling("all");
    setTimeRange("all");
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedBilling !== "all" || timeRange !== "all";

  // คำนวณค่าใช้จ่ายรายเดือนตามหมวดหมู่
  const categoryData = filteredSubscriptions.reduce((acc, sub) => {
    const category = categoryLabels[sub.category] || sub.category;
    const monthlyCost = sub.billing === "monthly" ? sub.cost :
                       sub.billing === "yearly" ? sub.cost / 12 :
                       sub.billing === "quarterly" ? sub.cost / 3 :
                       sub.billing === "biannually" ? sub.cost / 6 : sub.cost;

    const existing = acc.find(item => item.category === category);
    if (existing) {
      existing.cost += monthlyCost;
      existing.count += 1;
    } else {
      acc.push({ category, cost: monthlyCost, count: 1 });
    }
    return acc;
  }, [] as { category: string; cost: number; count: number }[]);

  // เรียงตามค่าใช้จ่ายจากมากไปน้อย
  categoryData.sort((a, b) => b.cost - a.cost);

  // สร้างข้อมูลสำหรับกราฟเส้นแนวโน้ม (6 เดือนย้อนหลัง)
  const monthlyTrendData = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleDateString("th-TH", { month: "short" });
    
    const totalCost = filteredSubscriptions.reduce((sum, sub) => {
      const monthlyCost = sub.billing === "monthly" ? sub.cost :
                         sub.billing === "yearly" ? sub.cost / 12 :
                         sub.billing === "quarterly" ? sub.cost / 3 :
                         sub.billing === "biannually" ? sub.cost / 6 : sub.cost;
      return sum + monthlyCost;
    }, 0);

    monthlyTrendData.push({
      month: monthName,
      cost: totalCost,
    });
  }

  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Filters Section */}
      <Card className="mb-6 border-2 border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-indigo-600" />
            ตัวกรองข้อมูล
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {selectedCategories.length + (selectedBilling !== "all" ? 1 : 0) + (timeRange !== "all" ? 1 : 0)} ตัวกรอง
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Time Range Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">ช่วงเวลา</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="this-month">เดือนนี้ (30 วัน)</SelectItem>
                  <SelectItem value="this-quarter">ไตรมาสนี้ (90 วัน)</SelectItem>
                  <SelectItem value="this-year">ปีนี้ (365 วัน)</SelectItem>
                  <SelectItem value="expiring-soon">ใกล้หมดอายุ (7 วัน)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Billing Cycle Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">รอบชำระเงิน</label>
              <Select value={selectedBilling} onValueChange={setSelectedBilling}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกรอบชำระ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="monthly">รายเดือน</SelectItem>
                  <SelectItem value="quarterly">ราย 3 เดือน</SelectItem>
                  <SelectItem value="biannually">ราย 6 เดือน</SelectItem>
                  <SelectItem value="yearly">รายปี</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">หมวดหมู่</label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map(category => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => toggleCategory(category)}
                  >
                    {categoryLabels[category] || category}
                    {selectedCategories.includes(category) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                ล้างตัวกรองทั้งหมด
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">ไม่พบข้อมูลที่ตรงกับตัวกรอง</p>
            <Button
              variant="link"
              onClick={resetFilters}
              className="mt-2"
            >
              ล้างตัวกรอง
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {hasActiveFilters && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-900">
                แสดงผล {filteredSubscriptions.length} จาก {subscriptions.length} รายการ
              </p>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* กราฟแท่ง - ค่าใช้จ่ายตามหมวดหมู่ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  ค่าใช้จ่ายรายเดือนตามหมวดหมู่
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="cost" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* กราฟวงกลม - สัดส่วนค่าใช้จ่าย */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  สัดส่วนค่าใช้จ่ายตามหมวดหมู่
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="cost"
                      nameKey="category"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* กราฟเส้น - แนวโน้มค่าใช้จ่าย */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  แนวโน้มค่าใช้จ่ายรายเดือน (6 เดือนย้อนหลัง)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      name="ค่าใช้จ่ายรายเดือน"
                      dot={{ fill: "#6366f1", r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}