import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from "lucide-react";

interface Subscription {
  id: number;
  name: string;
  cost: number;
  currency: string;
  billing: string;
  category: string;
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

export function SubscriptionCharts({ subscriptions }: SubscriptionChartsProps) {
  // คำนวณค่าใช้จ่ายรายเดือนตามหมวดหมู่
  const categoryData = subscriptions.reduce((acc, sub) => {
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
    
    const totalCost = subscriptions.reduce((sum, sub) => {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
  );
}