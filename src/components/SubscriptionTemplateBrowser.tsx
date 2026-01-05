import { useState, useEffect } from "react";
import { Search, Grid3x3, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { SubscriptionIcon } from "./SubscriptionIcon";
import type { SubscriptionTemplate } from "@/services/subscriptionTemplateService";
import { subscriptionTemplateService } from "@/services/subscriptionTemplateService";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubscriptionTemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: SubscriptionTemplate) => void;
  onCustom?: () => void;
}

export function SubscriptionTemplateBrowser({
  isOpen,
  onClose,
  onSelect,
  onCustom,
}: SubscriptionTemplateBrowserProps) {
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
    onSelect(template);
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
    return category.name_en || "Other";
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

  // Group templates by category
  const groupTemplatesByCategory = (templates: SubscriptionTemplate[]) => {
    const grouped: Record<string, SubscriptionTemplate[]> = {};
    
    templates.forEach(template => {
      const categoryName = template.categories?.name_en || "Other";
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(template);
    });

    return grouped;
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
    <>
      {/* Popular Templates Section */}
      <div className="mb-8">
        {/* Popular templates grid - without heading, without user counts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {popularTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all"
            >
              <SubscriptionIcon 
                name={template.name}
                websiteUrl={template.website_url}
                size="lg"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 text-center line-clamp-2">
                {template.name}
              </span>
            </button>
          ))}
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
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t("subscriptions.browseAllTemplates")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("subscriptions.searchTemplates")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Template Grid */}
            <div className="space-y-6 max-h-[400px] overflow-y-auto">
              {searchQuery && Object.keys(filteredCategories).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    {t("subscriptions.noTemplatesFound")}
                  </p>
                  <Button
                    onClick={() => {
                      setShowAllModal(false);
                      // Focus on subscription name input
                      setTimeout(() => {
                        const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
                        if (nameInput) {
                          nameInput.focus();
                          nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 100);
                    }}
                    variant="outline"
                    className="mx-auto"
                  >
                    {language === 'th' ? '+ เพิ่มบริการใหม่' : '+ Add Custom Service'}
                  </Button>
                </div>
              ) : (
                Object.entries(filteredCategories).map(([category, templates]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 sticky top-0 bg-white dark:bg-slate-900 py-2">
                      {category} ({templates.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            handleTemplateClick(template);
                            setShowAllModal(false);
                          }}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all"
                        >
                          <SubscriptionIcon 
                            name={template.name}
                            websiteUrl={template.website_url}
                            size="md"
                          />
                          <span className="text-xs font-medium text-slate-900 dark:text-slate-100 text-center line-clamp-2">
                            {template.name}
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {template.currency} {template.amount}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Custom Service Link */}
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <span className="text-sm text-slate-500 mr-2">
                {t("subscriptions.cantFindAddCustom")}
              </span>
              <button
                onClick={() => {
                  onClose();
                  onCustom();
                }}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                + {t("subscriptions.addCustomService")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}