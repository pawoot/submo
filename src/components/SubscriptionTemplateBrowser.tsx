import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SubscriptionIcon } from "./SubscriptionIcon";
import { SubscriptionTemplate } from "@/services/subscriptionTemplateService";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubscriptionTemplateBrowserProps {
  templates: SubscriptionTemplate[];
  onSelect: (template: SubscriptionTemplate) => void;
  selectedCategory?: string;
}

export function SubscriptionTemplateBrowser({ 
  templates, 
  onSelect,
  selectedCategory 
}: SubscriptionTemplateBrowserProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className="cursor-pointer hover:border-blue-500 transition-all hover:shadow-md group"
            onClick={() => onSelect(template)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <SubscriptionIcon 
                name={template.name}
                website={template.website_url}
                logoUrl={template.icon_url}
                className="w-12 h-12 group-hover:scale-110 transition-transform duration-200"
              />
              <div className="space-y-1">
                <h4 className="font-medium text-sm line-clamp-1" title={template.name}>
                  {template.name}
                </h4>
                {template.amount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {template.amount} {template.currency}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}