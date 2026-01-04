import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { subscriptionTemplateService } from "@/services/subscriptionTemplateService";
import type { Database } from "@/integrations/supabase/types";

type SubscriptionTemplate = Database["public"]["Tables"]["subscription_templates"]["Row"];

interface SubscriptionNameAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onTemplateSelect?: (template: SubscriptionTemplate) => void;
  disabled?: boolean;
}

export function SubscriptionNameAutocomplete({
  value,
  onChange,
  onTemplateSelect,
  disabled = false,
}: SubscriptionNameAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<SubscriptionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SubscriptionTemplate | null>(null);

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

  const handleSelect = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    onChange(template.name);
    setOpen(false);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleCustomInput = (customValue: string) => {
    setSelectedTemplate(null);
    onChange(customValue);
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
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedTemplate && (
                <div className="w-6 h-6 rounded overflow-hidden bg-white shadow-sm flex-shrink-0">
                  <img
                    src={selectedTemplate.logo_url}
                    alt={selectedTemplate.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <span className="truncate">
                {value || "เลือกหรือพิมพ์ชื่อ Subscription"}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="ค้นหาหรือพิมพ์ชื่อใหม่..."
                value={value}
                onChange={(e) => handleCustomInput(e.target.value)}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList>
              <CommandEmpty>
                {value ? (
                  <div className="py-6 text-center text-sm">
                    <p className="text-muted-foreground">ไม่พบ "{value}" ในระบบ</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      กดปุ่ม Enter หรือปิด popup เพื่อใช้ชื่อนี้
                    </p>
                  </div>
                ) : (
                  "พิมพ์เพื่อค้นหา..."
                )}
              </CommandEmpty>
              {templates.length > 0 && (
                <CommandGroup heading="เลือกจาก Templates">
                  {templates
                    .filter((template) =>
                      template.name.toLowerCase().includes(value.toLowerCase())
                    )
                    .slice(0, 10)
                    .map((template) => (
                      <CommandItem
                        key={template.id}
                        value={template.name}
                        onSelect={() => handleSelect(template)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
                            <img
                              src={template.logo_url}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{template.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {template.category}
                            </p>
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4 flex-shrink-0",
                            selectedTemplate?.id === template.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedTemplate && (
        <p className="text-xs text-blue-600 dark:text-blue-400">
          ✓ ใช้ข้อมูลจาก Template - {selectedTemplate.category}
        </p>
      )}
      
      {!selectedTemplate && value && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ ชื่อใหม่ - กรุณากรอกข้อมูลเพิ่มเติม
        </p>
      )}
    </div>
  );
}