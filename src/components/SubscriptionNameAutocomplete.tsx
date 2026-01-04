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
  templates: SubscriptionTemplate[];
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
  const { t } = useLanguage();

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
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedTemplate && (
                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                   <SubscriptionIcon name={selectedTemplate.name} logoUrl={selectedTemplate.icon_url} className="w-full h-full" />
                </div>
              )}
              <span className="truncate">
                {value || t("common.select") + " / " + t("common.type_name")}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={t("common.search") + "..."} 
              onValueChange={(val) => {
                if (!open) setOpen(true);
                // Allow custom value if not found
                onChange(val);
              }}
            />
            <CommandList>
              <CommandEmpty>{t("common.no_results")}</CommandEmpty>
              <CommandGroup heading="Templates">
                {templates.map((template) => (
                  <CommandItem
                    key={template.id}
                    value={template.name}
                    onSelect={() => handleSelect(template)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <SubscriptionIcon name={template.name} logoUrl={template.icon_url} className="w-5 h-5" />
                      <span>{template.name}</span>
                    </div>
                    {value === template.name && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}