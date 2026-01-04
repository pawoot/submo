import { useState, useEffect } from "react";
import { subscriptionTemplateService, type SubscriptionTemplate } from "@/services/subscriptionTemplateService";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2 } from "lucide-react";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";
import { cn } from "@/lib/utils";

interface SubscriptionTemplateBrowserProps {
  onSelectTemplate?: (template: SubscriptionTemplate) => void;
  compact?: boolean;
}

export function SubscriptionTemplateBrowser({ 
  onSelectTemplate, 
  compact = false 
}: SubscriptionTemplateBrowserProps) {
  const { t, language } = useLanguage();
  const { formatCurrency, preferredCurrency } = useCurrency();
  const [templates, setTemplates] = useState<SubscriptionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

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

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === "all" || 
      (template.categories && template.categories.slug === selectedCategory);
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Unique categories from templates
  const categories = Array.from(new Set(templates.map(t => t.categories?.slug).filter(Boolean)));

  const handleSelect = (template: SubscriptionTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  if (compact) {
    // Compact Horizontal Scroll View for Wizard
    if (loading) return <div className="h-24 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

    const popularTemplates = templates.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0)).slice(0, 10);

    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        {popularTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => handleSelect(template)}
            className="flex flex-col items-center gap-2 min-w-[80px] p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <div className="relative">
              <SubscriptionIcon 
                name={template.name}
                iconUrl={template.icon_url}
                size="lg"
                className="group-hover:scale-110 transition-transform duration-200"
              />
            </div>
            <span className="text-xs text-center font-medium truncate w-full max-w-[80px]">
              {template.name}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
            <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat as string} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:border-indigo-500 transition-colors group"
              onClick={() => handleSelect(template)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-3 overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700"
                  style={{ backgroundColor: `${template.categories?.color}20` || "#f1f5f9" }}
                >
                  {template.website_url ? (
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${new URL(template.website_url).hostname}&sz=128`}
                      alt={template.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.style.backgroundColor = template.categories?.color ? `${template.categories.color}20` : '#f1f5f9';
                          parent.innerHTML = `<span style="color: ${template.categories?.color || '#64748b'}">${template.name.charAt(0).toUpperCase()}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span style={{ color: template.categories?.color || "#64748b" }}>
                      {template.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="text-center w-full">
                  <h4 className="font-semibold text-sm truncate w-full mb-1">{template.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {template.categories?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(template.amount || 0, template.currency || preferredCurrency)}
                  </p>
                  <p className="text-xs text-slate-500">/{template.billing_cycle === 'yearly' ? 'yr' : 'mo'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredTemplates.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              {t("common.no_results")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}