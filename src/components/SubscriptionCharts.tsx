import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, PieChart as PieChartIcon, Search, Filter, PackagePlus, TrendingUp, Sparkles } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

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

  // Empty State Component สำหรับเมื่อไม่มี Subscription เลย
  if (subscriptions.length === 0) {
    return (
      <div className="mb-8">
        <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 shadow-xl overflow-hidden">
          <CardContent className="py-20 px-8">
            <div className="max-w-2xl mx-auto text-center space-y-6 animate-fade-in">
              {/* Icon with Animation */}
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-8 shadow-2xl">
                  <PackagePlus className="w-20 h-20 text-white" strokeWidth={1.5} />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-bounce" />
              </div>

              {/* Main Heading */}
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                  เริ่มต้นบริหารจัดการ Subscription
                </h2>
                <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
                  ยังไม่มี Subscription ในระบบ<br />
                  เพิ่มรายการแรกของคุณเพื่อเริ่มติดตามค่าใช้จ่าย
                </p>
              </div>

              {/* Benefits List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 pb-4">
                <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-indigo-100 shadow-sm">
                  <TrendingUp className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">ติดตามค่าใช้จ่าย</p>
                  <p className="text-xs text-gray-500 mt-1">ดูกราฟและสถิติ</p>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-purple-100 shadow-sm">
                  <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">วิเคราะห์รายจ่าย</p>
                  <p className="text-xs text-gray-500 mt-1">แยกตามหมวดหมู่</p>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-pink-100 shadow-sm">
                  <PieChartIcon className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">แจ้งเตือนอัตโนมัติ</p>
                  <p className="text-xs text-gray-500 mt-1">ก่อนครบกำหนด</p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-4">
                <Link href="/add-subscription">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-10 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <PackagePlus className="w-6 h-6 mr-3" />
                    เพิ่ม Subscription แรก
                  </Button>
                </Link>
              </div>

              {/* Helper Text */}
              <p className="text-sm text-gray-500 pt-4">
                💡 เริ่มต้นง่ายๆ ใช้เวลาแค่ไม่กี่วินาที
              </p>
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

      {/* Results - Empty State for No Search Results */}
      {filteredSubscriptions.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 shadow-lg">
          <CardContent className="py-16 text-center">
            <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
              {/* Icon */}
              <div className="relative inline-block">
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-full p-6 shadow-inner">
                  <Search className="w-16 h-16 text-gray-400" strokeWidth={1.5} />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-700">
                  ไม่พบข้อมูลที่ค้นหา
                </h3>
                <p className="text-gray-500 text-base max-w-sm mx-auto">
                  ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง<br />
                  เพื่อแสดงผลลัพธ์ที่ต้องการ
                </p>
              </div>

              {/* Current Filters Display */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 inline-block text-left">
                <p className="text-xs font-semibold text-gray-600 mb-2">เงื่อนไขที่ใช้:</p>
                <div className="space-y-1 text-sm text-gray-600">
                  {searchQuery && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span>ค้นหา: <span className="font-medium text-indigo-600">"{searchQuery}"</span></span>
                    </div>
                  )}
                  {selectedCategory !== "all" && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span>หมวดหมู่: <span className="font-medium text-indigo-600">{categoryLabels[selectedCategory]}</span></span>
                    </div>
                  )}
                  {selectedBilling !== "all" && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span>รอบชำระ: <span className="font-medium text-indigo-600">{selectedBilling === "monthly" ? "รายเดือน" : selectedBilling === "yearly" ? "รายปี" : selectedBilling === "quarterly" ? "ราย 3 เดือน" : "ราย 6 เดือน"}</span></span>
                    </div>
                  )}
                  {timeRange !== "all" && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span>ช่วงเวลา: <span className="font-medium text-indigo-600">{timeRange === "this-month" ? "เดือนนี้" : timeRange === "this-quarter" ? "ไตรมาสนี้" : timeRange === "this-year" ? "ปีนี้" : "ใกล้หมดอายุ"}</span></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reset Button */}
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
                ล้างตัวกรองทั้งหมด
              </Button>
            </div>
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