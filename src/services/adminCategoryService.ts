import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

/**
 * Admin Category Service
 * Manages categories (CRUD operations) - Admin only
 */

/**
 * Get all categories (ordered by display_order)
 */
export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }

  return data || [];
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching category:", error);
    throw new Error("Failed to fetch category");
  }

  return data;
}

/**
 * Create new category (Admin only)
 */
export async function createCategory(
  categoryData: Omit<CategoryInsert, "id" | "created_at" | "updated_at">
): Promise<Category> {
  // Check if slug already exists
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categoryData.slug)
    .single();

  if (existing) {
    throw new Error("Category with this slug already exists");
  }

  const { data, error } = await supabase
    .from("categories")
    .insert(categoryData)
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    throw new Error("Failed to create category");
  }

  return data;
}

/**
 * Update category (Admin only)
 */
export async function updateCategory(
  id: string,
  updates: CategoryUpdate
): Promise<Category> {
  // If slug is being updated, check if it already exists
  if (updates.slug) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", updates.slug)
      .neq("id", id)
      .single();

    if (existing) {
      throw new Error("Category with this slug already exists");
    }
  }

  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating category:", error);
    throw new Error("Failed to update category");
  }

  return data;
}

/**
 * Delete category (Admin only)
 * NOTE: Will fail if any subscriptions use this category (foreign key constraint)
 */
export async function deleteCategory(id: string): Promise<void> {
  // Check if any subscriptions use this category
  const { data: subscriptions, error: checkError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("category", id)
    .limit(1);

  if (checkError) {
    console.error("Error checking category usage:", checkError);
    throw new Error("Failed to check category usage");
  }

  if (subscriptions && subscriptions.length > 0) {
    throw new Error("Cannot delete category: it is being used by subscriptions");
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting category:", error);
    throw new Error("Failed to delete category");
  }
}

/**
 * Reorder categories (update display_order)
 */
export async function reorderCategories(
  categoryIds: string[]
): Promise<void> {
  // Update display_order for each category
  const updates = categoryIds.map((id, index) => 
    supabase
      .from("categories")
      .update({ display_order: index })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  
  const errors = results.filter(result => result.error);
  if (errors.length > 0) {
    console.error("Error reordering categories:", errors);
    throw new Error("Failed to reorder categories");
  }
}

/**
 * Get category usage statistics
 */
export async function getCategoryStats(): Promise<{
  categoryId: string;
  categoryName: string;
  subscriptionCount: number;
}[]> {
  const { data, error } = await supabase
    .from("categories")
    .select(`
      id,
      name_en,
      subscriptions:subscriptions(count)
    `);

  if (error) {
    console.error("Error fetching category stats:", error);
    throw new Error("Failed to fetch category statistics");
  }

  return (data || []).map(cat => ({
    categoryId: cat.id,
    categoryName: cat.name_en,
    subscriptionCount: (cat.subscriptions as any)[0]?.count || 0
  }));
}