import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fixSubscriptionCategory } from "@/services/adminMigrationService";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name_en: string;
  name_th: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface FixCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  subscriptionName: string;
  currentCategoryId: string | null;
  onSuccess: () => void;
}

export function FixCategoryDialog({
  open,
  onOpenChange,
  subscriptionId,
  subscriptionName,
  currentCategoryId,
  onSuccess,
}: FixCategoryDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name_en: "",
    name_th: "",
    slug: "",
    icon: "",
    color: "#3B82F6",
  });
  const { toast } = useToast();

  // Fetch categories
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  async function fetchCategories() {
    setLoadingCategories(true);
    const { data, error } = await supabase
      .from("categories")
      .select("id, name_en, name_th, slug, icon, color")
      .order("name_en");

    if (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } else {
      setCategories(data || []);
    }
    setLoadingCategories(false);
  }

  async function handleCreateNewCategory() {
    if (!newCategory.name_en || !newCategory.slug) {
      toast({
        title: "Validation Error",
        description: "Name (EN) and Slug are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name_en: newCategory.name_en,
        name_th: newCategory.name_th || newCategory.name_en,
        slug: newCategory.slug,
        icon: newCategory.icon || null,
        color: newCategory.color,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Add to list and select it
    setCategories([...categories, data]);
    setSelectedCategoryId(data.id);
    setShowCreateNew(false);
    setNewCategory({ name_en: "", name_th: "", slug: "", icon: "", color: "#3B82F6" });
    setLoading(false);

    toast({
      title: "Category Created",
      description: `"${data.name_en}" has been created successfully`,
    });
  }

  async function handleApplyFix() {
    if (!selectedCategoryId) {
      toast({
        title: "Validation Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await fixSubscriptionCategory(subscriptionId, selectedCategoryId);

    if (result.success) {
      toast({
        title: "Category Fixed",
        description: `Successfully updated category for "${subscriptionName}"`,
      });
      onSuccess();
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to fix category",
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fix Category</DialogTitle>
          <DialogDescription>
            Update category for <strong>{subscriptionName}</strong>
          </DialogDescription>
        </DialogHeader>

        {!showCreateNew ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Select Category</Label>
              {loadingCategories ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon && <span className="mr-2">{category.icon}</span>}
                        {category.name_en}
                        {category.name_th && category.name_th !== category.name_en && (
                          <span className="text-muted-foreground ml-1">({category.name_th})</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedCategory && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Preview</p>
                    <p className="text-sm text-muted-foreground">
                      This will update <strong>1 subscription</strong> to category:{" "}
                      <strong>{selectedCategory.name_en}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCreateNew(true)}
            >
              Create New Category
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_en">Name (English) *</Label>
              <Input
                id="name_en"
                placeholder="e.g., Streaming Services"
                value={newCategory.name_en}
                onChange={(e) => setNewCategory({ ...newCategory, name_en: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_th">Name (Thai)</Label>
              <Input
                id="name_th"
                placeholder="e.g., บริการสตรีมมิ่ง"
                value={newCategory.name_th}
                onChange={(e) => setNewCategory({ ...newCategory, name_th: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="e.g., streaming-services"
                value={newCategory.slug}
                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                placeholder="e.g., 📺"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateNew(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateNewCategory}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create & Select
              </Button>
            </div>
          </div>
        )}

        {!showCreateNew && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleApplyFix} disabled={loading || !selectedCategoryId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Fix
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}