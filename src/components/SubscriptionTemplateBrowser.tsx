import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { subscriptionTemplateService } from "@/services/subscriptionTemplateService";
import type { Database } from "@/integrations/supabase/types";

type SubscriptionTemplate = Database["public"]["Tables"]["subscription_templates"]["Row"];

interface SubscriptionTemplateBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: SubscriptionTemplate) => void;
}

export function SubscriptionTemplateBrowser({
  open,
  onOpenChange,
  onSelect,
}: SubscriptionTemplateBrowserProps) {
  const [templates, setTemplates] = useState<SubscriptionTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<SubscriptionTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
      loadCategories();
    }
  }, [open]);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await subscriptionTemplateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await subscriptionTemplateService.getCategories();
      setCategories(["All", ...cats]);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleSelect = (template: SubscriptionTemplate) => {
    onSelect(template);
    onOpenChange(false);
    setSearchQuery("");
    setSelectedCategory("All");
  };

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, SubscriptionTemplate[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Browse Subscriptions</DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Search className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">ไม่พบบริการที่ค้นหา</p>
              <p className="text-sm">ลองค้นหาด้วยคำอื่น หรือเพิ่มบริการเองได้</p>
            </div>
          ) : (
            Object.entries(groupedTemplates).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {items.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelect(template)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white shadow-sm group-hover:shadow-md transition-shadow">
                        <img
                          src={template.logo_url}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {template.name}
                        </p>
                        {template.default_price && (
                          <p className="text-sm text-gray-600">
                            ${template.default_price.toFixed(2)}/{template.default_billing_cycle === "monthly" ? "mo" : "yr"}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500 text-center">
            ไม่พบบริการที่ต้องการ?{" "}
            <button
              onClick={() => {
                onOpenChange(false);
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              เพิ่มบริการเอง
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}