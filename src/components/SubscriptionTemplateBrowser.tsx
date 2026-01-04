import { useState, useEffect } from "react";
import { Search, Grid3x3, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionTemplate } from "@/services/subscriptionTemplateService";
import { subscriptionTemplateService } from "@/services/subscriptionTemplateService";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  onSelectTemplate: (template: SubscriptionTemplate) => void;
  selectedTemplateId?: string;
  compact?: boolean;
};

export function SubscriptionTemplateBrowser({ onSelectTemplate, selectedTemplateId, compact = false }: Props) {
  const { t, language } = useLanguage();
  const [popularTemplates, setPopularTemplates] = useState<SubscriptionTemplate[]>([]);
  const [allTemplatesByCategory, setAllTemplatesByCategory] = useState<Record<string, SubscriptionTemplate[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    loadPopularTemplates();
  }, []);

  const loadPopularTemplates = async () => {
    try {
      setLoading(true);
      const templates = await subscriptionTemplateService.getPopularTemplates(10);
      setPopularTemplates(templates);
    } catch (error) {
      console.error("Failed to load popular templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTemplates = async () => {
    try {
      const grouped = await subscriptionTemplateService.getAllTemplatesByCategory();
      setAllTemplatesByCategory(grouped);
    } catch (error) {
      console.error("Failed to load all templates:", error);
    }
  };

  const handleShowAll = async () => {
    setShowAllModal(true);
    await loadAllTemplates();
  };

  const handleTemplateClick = async (template: SubscriptionTemplate) => {
    onSelectTemplate(template);
    // Increment usage count
    try {
      await subscriptionTemplateService.incrementUsageCount(template.id);
    } catch (error) {
      console.error("Failed to increment usage count:", error);
    }
    setShowAllModal(false);
  };

  const getCategoryName = (category: SubscriptionTemplate["categories"]) => {
    if (!category) return "Other";
    if (language === "th" && category.name_th) return category.name_th;
    if (language === "en" && category.name_en) return category.name_en;
    return category.name;
  };

  const getFaviconUrl = (websiteUrl: string | null) => {
    if (!websiteUrl) return null;
    try {
      const url = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
    } catch {
      return null;
    }
  };

  const filteredCategories = Object.entries(allTemplatesByCategory).reduce((acc, [category, templates]) => {
    const filtered = templates.filter(template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, SubscriptionTemplate[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Popular Templates - Top 10 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {t("subscriptions.popularTemplates")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {popularTemplates.map((template) => {
            const faviconUrl = getFaviconUrl(template.website_url);
            
            return (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="group relative flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:border-primary hover:shadow-md bg-card"
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-2 text-white font-bold text-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: template.categories?.color || "#6366f1" }}
                >
                  {faviconUrl ? (
                    <img 
                      src={faviconUrl} 
                      alt={template.name}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) (fallback as HTMLElement).style.display = "block";
                      }}
                    />
                  ) : null}
                  <span style={{ display: faviconUrl ? "none" : "block" }}>
                    {template.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium text-center line-clamp-2 mb-1">
                  {template.name}
                </p>
                {template.usage_count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {template.usage_count} {language === "th" ? "คน" : "users"}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Browse All Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={handleShowAll}
          className="gap-2"
        >
          <Grid3x3 className="w-4 h-4" />
          {t("subscriptions.browseAllTemplates")}
        </Button>
      </div>

      {/* All Templates Modal */}
      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{t("subscriptions.allTemplates")}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAllModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("subscriptions.searchTemplates")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Templates Grouped by Category */}
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {Object.entries(filteredCategories).map(([categoryName, templates]) => (
                <div key={categoryName}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-2">
                    {categoryName}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {templates.map((template) => {
                      const faviconUrl = getFaviconUrl(template.website_url);
                      
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateClick(template)}
                          className="group relative flex flex-col items-center p-3 rounded-lg border-2 transition-all hover:border-primary hover:shadow-md bg-card"
                        >
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center mb-2 text-white font-bold text-xl transition-transform group-hover:scale-110"
                            style={{ backgroundColor: template.categories?.color || "#6366f1" }}
                          >
                            {faviconUrl ? (
                              <img 
                                src={faviconUrl} 
                                alt={template.name}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.nextElementSibling;
                                  if (fallback) (fallback as HTMLElement).style.display = "block";
                                }}
                              />
                            ) : null}
                            <span style={{ display: faviconUrl ? "none" : "block" }}>
                              {template.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-center line-clamp-2 mb-1">
                            {template.name}
                          </p>
                          <p className="text-xs text-muted-foreground mb-1">
                            {template.currency} {template.default_amount}
                          </p>
                          {template.usage_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {template.usage_count}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {Object.keys(filteredCategories).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {t("subscriptions.noTemplatesFound")}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}