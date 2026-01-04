import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SEO from "@/components/SEO";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Star, 
  StarOff, 
  ArrowLeft,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { subscriptionTemplateService, type SubscriptionTemplate } from "@/services/subscriptionTemplateService";
import { profileService } from "@/services/profileService";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SubscriptionIcon } from "@/components/SubscriptionIcon";

type TemplateFormData = {
  name: string;
  category: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  website_url: string;
  icon_url: string;
  popularity_score: number;
  is_active: boolean;
};

export default function AdminSubscriptionTemplates() {
  const [templates, setTemplates] = useState<SubscriptionTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<SubscriptionTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SubscriptionTemplate | null>(null);
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    category: "other",
    amount: 0,
    currency: "USD",
    billing_cycle: "monthly",
    website_url: "",
    icon_url: "",
    popularity_score: 0,
    is_active: true
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadTemplates();
      loadCategories();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const checkAdminAccess = async () => {
    try {
      const profile = await profileService.getCurrentProfile();
      if (profile?.role === "admin") {
        setIsAdmin(true);
      } else {
        router.push("/");
      }
    } catch (error) {
      router.push("/");
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await subscriptionTemplateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await subscriptionTemplateService.getCategories();
      setCategories(["All", ...cats]);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((t) => t.categories?.slug === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
    setCurrentPage(1);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      setUploading(true);
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `template-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("public")
        .upload(filePath, logoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("public")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      name: "",
      category: "other",
      amount: 0,
      currency: "USD",
      billing_cycle: "monthly",
      website_url: "",
      icon_url: "",
      popularity_score: 0,
      is_active: true
    });
    setLogoFile(null);
    setLogoPreview("");
    setShowAddDialog(true);
  };

  const handleEdit = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      category: template.categories?.slug || "other",
      amount: template.amount,
      currency: template.currency,
      billing_cycle: template.billing_cycle,
      website_url: template.website_url || "",
      icon_url: template.icon_url || "",
      popularity_score: template.popularity_score || 0,
      is_active: template.is_active || true
    });
    setLogoPreview(template.icon_url || "");
    setLogoFile(null);
    setShowEditDialog(true);
  };

  const handleDelete = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const confirmAdd = async () => {
    try {
      let iconUrl = formData.icon_url;

      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          iconUrl = uploadedUrl;
        }
      }

      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", formData.category)
        .single();

      await subscriptionTemplateService.createTemplate({
        name: formData.name,
        category_id: catData?.id,
        amount: formData.amount,
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        website_url: formData.website_url,
        icon_url: iconUrl,
        popularity_score: formData.popularity_score,
        is_active: formData.is_active,
        is_template: true
      });

      toast({
        title: "Success",
        description: "Template added successfully",
      });

      setShowAddDialog(false);
      loadTemplates();
    } catch (error) {
      console.error("Error adding template:", error);
      toast({
        title: "Error",
        description: "Failed to add template",
        variant: "destructive",
      });
    }
  };

  const confirmEdit = async () => {
    if (!selectedTemplate) return;

    try {
      let iconUrl = formData.icon_url;

      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          iconUrl = uploadedUrl;
        }
      }

       const { data: catData } = await supabase
       .from("categories")
       .select("id")
       .eq("slug", formData.category)
       .single();

      await subscriptionTemplateService.updateTemplate(selectedTemplate.id, {
        name: formData.name,
        category_id: catData?.id,
        amount: formData.amount,
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        website_url: formData.website_url,
        icon_url: iconUrl,
        popularity_score: formData.popularity_score,
        is_active: formData.is_active
      });

      toast({
        title: "Success",
        description: "Template updated successfully",
      });

      setShowEditDialog(false);
      loadTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await subscriptionTemplateService.deleteTemplate(selectedTemplate.id);
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      setShowDeleteDialog(false);
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const togglePopular = async (template: SubscriptionTemplate) => {
    try {
      const newScore = (template.popularity_score || 0) >= 50 ? 0 : 100;
      await subscriptionTemplateService.updateTemplate(template.id, {
        popularity_score: newScore,
      });
      loadTemplates();
    } catch (error) {
      console.error("Error toggling popular:", error);
    }
  };

  const toggleActive = async (template: SubscriptionTemplate) => {
    try {
      await subscriptionTemplateService.updateTemplate(template.id, {
        is_active: !template.is_active,
      });
      loadTemplates();
    } catch (error) {
      console.error("Error toggling active:", error);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

  return (
    <AuthGuard>
      <SEO title="Admin - Subscription Templates" />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
              </Link>
              <h1 className="text-xl font-bold">Subscription Templates</h1>
            </div>
            <Button onClick={handleAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Template</Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="mb-6">
            <CardContent className="pt-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search templates..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-center">Popular</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <SubscriptionIcon 
                          name={template.name} 
                          logoUrl={template.icon_url} 
                          className="w-8 h-8"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell><Badge variant="outline">{template.categories?.slug || "other"}</Badge></TableCell>
                      <TableCell>{template.amount} {template.currency}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" onClick={() => togglePopular(template)}>
                          {(template.popularity_score || 0) >= 50 ? 
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> : 
                            <StarOff className="w-4 h-4 text-gray-300" />
                          }
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(template)}>
                          {template.is_active ? 
                            <Eye className="w-4 h-4 text-green-500" /> : 
                            <EyeOff className="w-4 h-4 text-gray-300" />
                          }
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(template)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
           {filteredTemplates.length > itemsPerPage && (
            <div className="flex justify-center mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                     <span className="px-4">Page {currentPage} of {totalPages}</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </main>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
           <DialogHeader><DialogTitle>Add Template</DialogTitle></DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="flex items-center gap-4">
                {logoPreview && (
                  <img src={logoPreview} alt="Preview" className="w-16 h-16 rounded object-cover border" />
                )}
                <div className="flex-1">
                  <Label>Icon</Label>
                  <Input type="file" onChange={handleLogoChange} accept="image/*" className="mb-2" />
                  <Input 
                    placeholder="Or enter URL..." 
                    value={formData.icon_url} 
                    onChange={e => {
                      setFormData({...formData, icon_url: e.target.value});
                      setLogoPreview(e.target.value);
                    }} 
                  />
                </div>
             </div>

             <div className="grid gap-2">
               <Label>Name</Label>
               <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Netflix" />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Price</Label>
                  <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="THB">THB</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="grid gap-2">
               <Label>Billing Cycle</Label>
                <Select value={formData.billing_cycle} onValueChange={v => setFormData({...formData, billing_cycle: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="grid gap-2">
               <Label>Category</Label>
               <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>

             <div className="grid gap-2">
               <Label>Website URL</Label>
               <Input value={formData.website_url} onChange={e => setFormData({...formData, website_url: e.target.value})} placeholder="https://..." />
             </div>

             <div className="flex items-center justify-between">
                <Label>Popular (Score {formData.popularity_score})</Label>
                <Switch 
                  checked={formData.popularity_score >= 50} 
                  onCheckedChange={c => setFormData({...formData, popularity_score: c ? 100 : 0})} 
                />
             </div>
             
             <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch 
                  checked={formData.is_active} 
                  onCheckedChange={c => setFormData({...formData, is_active: c})} 
                />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
             <Button onClick={confirmAdd} disabled={uploading}>Save</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
           <DialogHeader><DialogTitle>Edit Template</DialogTitle></DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="flex items-center gap-4">
                {logoPreview && (
                  <img src={logoPreview} alt="Preview" className="w-16 h-16 rounded object-cover border" />
                )}
                <div className="flex-1">
                  <Label>Icon</Label>
                  <Input type="file" onChange={handleLogoChange} accept="image/*" className="mb-2" />
                  <Input 
                    placeholder="Or enter URL..." 
                    value={formData.icon_url} 
                    onChange={e => {
                      setFormData({...formData, icon_url: e.target.value});
                      setLogoPreview(e.target.value);
                    }} 
                  />
                </div>
             </div>

             <div className="grid gap-2">
               <Label>Name</Label>
               <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Price</Label>
                  <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="THB">THB</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="grid gap-2">
               <Label>Billing Cycle</Label>
                <Select value={formData.billing_cycle} onValueChange={v => setFormData({...formData, billing_cycle: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="grid gap-2">
               <Label>Category</Label>
               <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>

             <div className="grid gap-2">
               <Label>Website URL</Label>
               <Input value={formData.website_url} onChange={e => setFormData({...formData, website_url: e.target.value})} />
             </div>

             <div className="flex items-center justify-between">
                <Label>Popular</Label>
                <Switch 
                  checked={formData.popularity_score >= 50} 
                  onCheckedChange={c => setFormData({...formData, popularity_score: c ? 100 : 0})} 
                />
             </div>
             
             <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch 
                  checked={formData.is_active} 
                  onCheckedChange={c => setFormData({...formData, is_active: c})} 
                />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
             <Button onClick={confirmEdit} disabled={uploading}>Update</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
           <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
           <p>Are you sure you want to delete {selectedTemplate?.name}?</p>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
             <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}