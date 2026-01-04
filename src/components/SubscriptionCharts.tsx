import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, PieChart as PieChartIcon, Search, Filter } from "lucide-react";
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
  "#6366f1", // indigo (Design)
  "#ec4899", // pink (Development)
  "#8b5cf6", // purple (Productivity)
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

export function SubscriptionCharts({ subscriptions }: SubscriptionChartsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBilling, setSelectedBilling] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // ดึงหมวดหมู่ทั้งหมดที่มีใน subscriptions
  const availableCategories = Array.from(new Set(subscriptions.map(sub => sub.category)));

  // กรองข้อมูลตาม filters
  const filteredSubscriptions = subscriptions.filter(sub => {
    // กรองตามคำค้นหา
    if (searchQuery && !sub.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // กรองตามหมวดหมู่
    if (selectedCategory !== "all" && sub.category !== selectedCategory) {
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

  // คำนวณเปอร์เซ็นต์
  const totalCost = categoryData.reduce((sum, item) => sum + item.cost, 0);
  const pieData = categoryData.map(item => ({
    ...item,
    percentage: ((item.cost / totalCost) * 100).toFixed(0)
  }));

  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search Box */}
          <div className="md:col-span-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">ค้นหา</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="ค้นหาชื่อ Subscription..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* Time Range Dropdown */}
          <div className="md:col-span-3">
            <label className="text-sm font-medium text-gray-700 mb-2 block">ช่วงเวลา</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="this-month">เดือนนี้</SelectItem>
                <SelectItem value="this-quarter">ไตรมาสนี้</SelectItem>
                <SelectItem value="this-year">ปีนี้</SelectItem>
                <SelectItem value="expiring-soon">ใกล้หมดอายุ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Billing Cycle Dropdown */}
          <div className="md:col-span-3">
            <label className="text-sm font-medium text-gray-700 mb-2 block">รอบชำระเงิน</label>
            <Select value={selectedBilling} onValueChange={setSelectedBilling}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="ทั้งหมด" />
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

          {/* Search Button */}
          <div className="md:col-span-2">
            <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              ค้นหา
            </Button>
          </div>
        </div>
      </div>

      {/* Category Tabs and Filter Toggle */}
      <div className="flex items-center justify-between bg-white rounded-xl border-2 border-gray-100 p-4">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1">
          <TabsList className="bg-gray-50">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-semibold">
              หมวดหมู่
            </TabsTrigger>
            {availableCategories.includes("design") && (
              <TabsTrigger value="design" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                Design
              </TabsTrigger>
            )}
            {availableCategories.includes("development") && (
              <TabsTrigger value="development" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                Development
              </TabsTrigger>
            )}
            {availableCategories.includes("productivity") && (
              <TabsTrigger value="productivity" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                Productivity
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium"
        >
          <Filter className="w-4 h-4 mr-2" />
          ตัวกรองข้อมูล
        </Button>
      </div>

      {/* Results Summary */}
      {filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 text-lg">ไม่พบข้อมูลที่ตรงกับการค้นหา</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedBilling("all");
                setTimeRange("all");
              }}
              className="mt-2 text-indigo-600"
            >
              ล้างการค้นหา
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts Grid - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart - ค่าใช้จ่ายตามหมวดหมู่ */}
            <Card className="shadow-lg border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-white">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                  ค่าใช้จ่ายรายเดือนตามหมวดหมู่
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 13, fontWeight: 500 }}
                    />
                    <YAxis tick={{ fontSize: 13 }} />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.98)",
                        border: "2px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                    <Bar dataKey="cost" fill="#6366f1" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart - สัดส่วนค่าใช้จ่าย */}
            <Card className="shadow-lg border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <PieChartIcon className="w-6 h-6 text-purple-600" />
                  สัดส่วนค่าใช้จ่ายตามหมวดหมู่
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ category, percentage }: any) => `${category} ${percentage}%`}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="cost"
                      nameKey="category"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.98)",
                        border: "2px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}