import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AdminLayout } from "@/components/AdminLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from "lucide-react";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
} from "@/services/adminCategoryService";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface CategoryStats {
  categoryId: string;
  categoryName: string;
  subscriptionCount: number;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats[]>([]);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name_en: "",
    name_th: "",
    slug: "",
    icon: "",
    color: "#6366f1",
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, statsData] = await Promise.all([
        getAllCategories(),
        getCategoryStats(),
      ]);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name_en: "",
      name_th: "",
      slug: "",
      icon: "",
      color: "#6366f1",
    });
  };

  // Open create dialog
  const handleCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  // Open edit dialog
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name_en: category.name_en,
      name_th: category.name_th,
      slug: category.slug,
      icon: category.icon || "",
      color: category.color || "#6366f1",
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  // Create category
  const handleCreateSubmit = async () => {
    if (!formData.name_en || !formData.name_th || !formData.slug) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await createCategory({
        name_en: formData.name_en,
        name_th: formData.name_th,
        slug: formData.slug,
        icon: formData.icon || null,
        color: formData.color || "#6366f1",
        display_order: categories.length,
      });

      toast({
        title: "Success",
        description: "Category created successfully",
      });

      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Update category
  const handleEditSubmit = async () => {
    if (!selectedCategory) return;

    if (!formData.name_en || !formData.name_th || !formData.slug) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await updateCategory(selectedCategory.id, {
        name_en: formData.name_en,
        name_th: formData.name_th,
        slug: formData.slug,
        icon: formData.icon || null,
        color: formData.color || "#6366f1",
      });

      toast({
        title: "Success",
        description: "Category updated successfully",
      });

      setShowEditDialog(false);
      setSelectedCategory(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    try {
      setSaving(true);
      await deleteCategory(selectedCategory.id);

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      setShowDeleteDialog(false);
      setSelectedCategory(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Get subscription count for category
  const getSubscriptionCount = (categoryId: string) => {
    const stat = stats.find(s => s.categoryId === categoryId);
    return stat?.subscriptionCount || 0;
  };

  return (
    <AdminLayout>
      <SEO 
        title="Manage Categories - Admin - Submo.ai"
        description="Manage subscription categories"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">Manage subscription categories</p>
          </div>
          <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
            <CardDescription>
              Total: {categories.length} categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No categories found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name (EN)</TableHead>
                    <TableHead>Name (TH)</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-right">Subscriptions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      </TableCell>
                      <TableCell>
                        <span className="text-2xl">{category.icon || "📦"}</span>
                      </TableCell>
                      <TableCell className="font-medium">{category.name_en}</TableCell>
                      <TableCell>{category.name_th}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.slug}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-200"
                            style={{ backgroundColor: category.color || "#6366f1" }}
                          />
                          <span className="text-sm text-gray-600 font-mono">
                            {category.color || "#6366f1"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {getSubscriptionCount(category.id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(category)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>
              Add a new subscription category
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name_en">Name (English) *</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="e.g., Productivity"
              />
            </div>

            <div>
              <Label htmlFor="name_th">Name (Thai) *</Label>
              <Input
                id="name_th"
                value={formData.name_th}
                onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                placeholder="e.g., ผลิตภาพ"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="e.g., productivity"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lowercase, no spaces (used in URLs and code)
              </p>
            </div>

            <div>
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., 📊"
                maxLength={2}
              />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_name_en">Name (English) *</Label>
              <Input
                id="edit_name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="e.g., Productivity"
              />
            </div>

            <div>
              <Label htmlFor="edit_name_th">Name (Thai) *</Label>
              <Input
                id="edit_name_th"
                value={formData.name_th}
                onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                placeholder="e.g., ผลิตภาพ"
              />
            </div>

            <div>
              <Label htmlFor="edit_slug">Slug *</Label>
              <Input
                id="edit_slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="e.g., productivity"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lowercase, no spaces (used in URLs and code)
              </p>
            </div>

            <div>
              <Label htmlFor="edit_icon">Icon (Emoji)</Label>
              <Input
                id="edit_icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., 📊"
                maxLength={2}
              />
            </div>

            <div>
              <Label htmlFor="edit_color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit_color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedCategory?.name_en}&quot;?
              {getSubscriptionCount(selectedCategory?.id || "") > 0 && (
                <span className="block mt-2 text-red-600 font-semibold">
                  ⚠️ This category is being used by {getSubscriptionCount(selectedCategory?.id || "")} subscription(s). 
                  You cannot delete it until all subscriptions are moved to another category.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={saving || getSubscriptionCount(selectedCategory?.id || "") > 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}