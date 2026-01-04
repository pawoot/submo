import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionIcon } from "./SubscriptionIcon";
import type { SubscriptionTemplate } from "@/services/subscriptionTemplateService";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { subscriptionTemplateService } from "@/services/subscriptionTemplateService";

interface SubscriptionNameAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectTemplate: (template: SubscriptionTemplate) => void;
  templates?: SubscriptionTemplate[];
  error?: string;
  disabled?: boolean;
  selectedTemplate?: SubscriptionTemplate | null;
}

export function SubscriptionNameAutocomplete({
  value,
  onChange,
  onSelectTemplate,
  templates: initialTemplates,
  error,
  disabled = false,
  selectedTemplate
}: SubscriptionNameAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<SubscriptionTemplate[]>(initialTemplates || []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { t, language } = useLanguage();

  // Load templates if not provided (fallback)
  useEffect(() => {
    if (!initialTemplates || initialTemplates.length === 0) {
      loadTemplates();
    } else {
      setTemplates(initialTemplates);
    }
  }, [initialTemplates]);

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

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (template: SubscriptionTemplate) => {
    onChange(template.name);
    onSelectTemplate(template);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedTemplate && (
                <SubscriptionIcon 
                  name={selectedTemplate.name}
                  websiteUrl={selectedTemplate.website_url}
                  size="sm"
                />
              )}
              <span className="truncate">
                {value || t("common.select")}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <div className="relative">
              <CommandInput 
                placeholder={t("subscriptions.searchTemplates")} 
                value={searchQuery}
                onValueChange={(value) => {
                  setSearchQuery(value);
                  // Allow custom input - update parent value immediately
                  onChange(value);
                }}
              />
            </div>
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    {language === 'th' ? 'ไม่พบบริการที่ค้นหา' : 'No service found'}
                  </p>
                  {searchQuery && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {language === 'th' 
                        ? `กำลังใช้ชื่อ: "${searchQuery}"`
                        : `Using custom name: "${searchQuery}"`
                      }
                    </p>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredTemplates.map((template) => {
                  return (
                    <CommandItem
                      key={template.id}
                      value={template.name}
                      onSelect={() => {
                        handleSelect(template);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <SubscriptionIcon 
                          name={template.name}
                          websiteUrl={template.website_url}
                          size="sm"
                        />
                        <span className="truncate">{template.name}</span>
                      </div>
                      {value === template.name && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}