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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Star, 
  StarOff, 
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  BarChart3,
  Eye,
  EyeOff,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { subscriptionTemplateService } from "@/services/subscriptionTemplateService";
import { profileService } from "@/services/profileService";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
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

type SubscriptionTemplate = Database["public"]["Tables"]["subscription_templates"]["Row"];
type SubscriptionTemplateInsert = Database["public"]["Tables"]["subscription_templates"]["Insert"];

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
  const [formData, setFormData] = useState<Partial<SubscriptionTemplateInsert>>({});
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
        toast({
          title: "⛔ ไม่มีสิทธิ์เข้าถึง",
          description: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
          variant: "destructive",
          duration: 3000,
        });
        router.push("/");
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/");
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await subscriptionTemplateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
        duration: 3000,
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
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
    setCurrentPage(1); // Reset to first page when filters change
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
      toast({
        title: "❌ อัปโหลดโลโก้ไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
        duration: 3000,
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      name: "",
      category: "other",
      logo_url: "",
      default_price: 0,
      default_currency: "USD",
      default_billing_cycle: "monthly",
      website_url: "",
      is_popular: false,
      is_active: true,
      display_order: templates.length + 1,
    });
    setLogoFile(null);
    setLogoPreview("");
    setShowAddDialog(true);
  };

  const handleEdit = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      logo_url: template.logo_url,
      default_price: template.default_price,
      default_currency: template.default_currency,
      default_billing_cycle: template.default_billing_cycle,
      website_url: template.website_url,
      is_popular: template.is_popular,
      is_active: template.is_active,
      display_order: template.display_order,
    });
    setLogoPreview(template.logo_url || "");
    setLogoFile(null);
    setShowEditDialog(true);
  };

  const handleDelete = (template: SubscriptionTemplate) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const confirmAdd = async () => {
    try {
      let logoUrl = formData.logo_url;

      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      await subscriptionTemplateService.createTemplate({
        ...formData,
        logo_url: logoUrl,
      } as SubscriptionTemplateInsert);

      toast({
        title: "✅ เพิ่มสำเร็จ!",
        description: `เพิ่ม ${formData.name} เรียบร้อยแล้ว`,
        duration: 3000,
      });

      setShowAddDialog(false);
      loadTemplates();
    } catch (error) {
      console.error("Error adding template:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const confirmEdit = async () => {
    if (!selectedTemplate) return;

    try {
      let logoUrl = formData.logo_url;

      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      await subscriptionTemplateService.updateTemplate(selectedTemplate.id, {
        ...formData,
        logo_url: logoUrl,
      });

      toast({
        title: "✅ แก้ไขสำเร็จ!",
        description: `แก้ไข ${formData.name} เรียบร้อยแล้ว`,
        duration: 3000,
      });

      setShowEditDialog(false);
      loadTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await subscriptionTemplateService.deleteTemplate(selectedTemplate.id);

      toast({
        title: "✅ ลบสำเร็จ!",
        description: `ลบ ${selectedTemplate.name} เรียบร้อยแล้ว`,
        duration: 3000,
      });

      setShowDeleteDialog(false);
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const togglePopular = async (template: SubscriptionTemplate) => {
    try {
      await subscriptionTemplateService.updateTemplate(template.id, {
        is_popular: !template.is_popular,
      });

      toast({
        title: "✅ อัปเดตสำเร็จ!",
        description: `${template.name} ${!template.is_popular ? "เป็น" : "ไม่เป็น"}บริการยอดนิยมแล้ว`,
        duration: 3000,
      });

      loadTemplates();
    } catch (error) {
      console.error("Error toggling popular:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตได้",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const toggleActive = async (template: SubscriptionTemplate) => {
    try {
      await subscriptionTemplateService.updateTemplate(template.id, {
        is_active: !template.is_active,
      });

      toast({
        title: "✅ อัปเดตสำเร็จ!",
        description: `${template.name} ${!template.is_active ? "เปิด" : "ปิด"}ใช้งานแล้ว`,
        duration: 3000,
      });

      loadTemplates();
    } catch (error) {
      console.error("Error toggling active:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตได้",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);
  const showingFrom = filteredTemplates.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, filteredTemplates.length);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <AuthGuard>
      <SEO 
        title="จัดการ Subscription Templates - Admin"
        description="Admin panel สำหรับจัดการ Subscription Templates"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-pink-950">
        {/* Header */}
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    จัดการ Subscription Templates
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Admin Panel - เพิ่ม แก้ไข ลบ Subscription Templates
                  </p>
                </div>
              </div>
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="w-5 h-5" />
                เพิ่ม Template
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      ทั้งหมด
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {templates.length}
                    </p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      ยอดนิยม
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {templates.filter((t) => t.is_popular).length}
                    </p>
                  </div>
                  <Star className="w-10 h-10 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      เปิดใช้งาน
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {templates.filter((t) => t.is_active).length}
                    </p>
                  </div>
                  <Eye className="w-10 h-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      หมวดหมู่
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {categories.length - 1}
                    </p>
                  </div>
                  <ImageIcon className="w-10 h-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="ค้นหา Subscription Template..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="หมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Templates Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>รายการ Templates ({filteredTemplates.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-sm text-slate-600 whitespace-nowrap">
                    แสดง
                  </Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger id="itemsPerPage" className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-slate-600 whitespace-nowrap">รายการ</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">ไม่พบ Template</p>
                  <p className="text-sm">ลองค้นหาด้วยคำอื่น หรือเพิ่ม Template ใหม่</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">โลโก้</TableHead>
                        <TableHead>ชื่อ</TableHead>
                        <TableHead>หมวดหมู่</TableHead>
                        <TableHead>ราคา</TableHead>
                        <TableHead>สกุลเงิน</TableHead>
                        <TableHead>รอบ</TableHead>
                        <TableHead className="text-center">ยอดนิยม</TableHead>
                        <TableHead className="text-center">สถานะ</TableHead>
                        <TableHead className="text-center">ลำดับ</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <SubscriptionIcon
                              name={template.name}
                              website={template.website_url}
                              logoUrl={template.logo_url}
                              className="w-12 h-12"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{template.category}</Badge>
                          </TableCell>
                          <TableCell>
                            {template.default_price ? `$${template.default_price.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>{template.default_currency || "-"}</TableCell>
                          <TableCell>{template.default_billing_cycle || "-"}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePopular(template)}
                            >
                              {template.is_popular ? (
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                              ) : (
                                <StarOff className="w-5 h-5 text-gray-400" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleActive(template)}
                            >
                              {template.is_active ? (
                                <Eye className="w-5 h-5 text-green-500" />
                              ) : (
                                <EyeOff className="w-5 h-5 text-gray-400" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">{template.display_order}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(template)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(template)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>

            {/* Pagination */}
            {filteredTemplates.length > 0 && (
              <div className="border-t px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Showing info */}
                  <div className="text-sm text-slate-600">
                    แสดง <span className="font-medium">{showingFrom}</span> ถึง{" "}
                    <span className="font-medium">{showingTo}</span> จากทั้งหมด{" "}
                    <span className="font-medium">{filteredTemplates.length}</span> รายการ
                  </div>

                  {/* Pagination controls */}
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {getPageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                          {page === "..." ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => setCurrentPage(page as number)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>เพิ่ม Subscription Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>โลโก้</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm">
                    <img
                      src={logoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="mb-2"
                  />
                  <p className="text-xs text-gray-500">
                    หรือ ใส่ URL โลโก้โดยตรง:
                  </p>
                  <Input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formData.logo_url || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, logo_url: e.target.value });
                      setLogoPreview(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น Netflix"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">หมวดหมู่ *</Label>
              <Select
                value={formData.category || "other"}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streaming">Streaming</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="cloud">Cloud</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">ราคา</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.default_price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, default_price: parseFloat(e.target.value) })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">สกุลเงิน</Label>
                <Select
                  value={formData.default_currency || "USD"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, default_currency: value })
                  }
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="THB">THB</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycle">รอบ</Label>
                <Select
                  value={formData.default_billing_cycle || "monthly"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, default_billing_cycle: value })
                  }
                >
                  <SelectTrigger id="cycle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">เว็บไซต์</Label>
              <Input
                id="website"
                type="url"
                value={formData.website_url || ""}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="order">ลำดับการแสดง</Label>
              <Input
                id="order"
                type="number"
                value={formData.display_order || 1}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) })
                }
              />
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="popular">บริการยอดนิยม</Label>
                <Switch
                  id="popular"
                  checked={formData.is_popular || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_popular: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">เปิดใช้งาน</Label>
                <Switch
                  id="active"
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={confirmAdd} disabled={uploading || !formData.name}>
              {uploading ? "กำลังอัปโหลด..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไข Subscription Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>โลโก้</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm">
                    <img
                      src={logoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="mb-2"
                  />
                  <p className="text-xs text-gray-500">
                    หรือ ใส่ URL โลโก้โดยตรง:
                  </p>
                  <Input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formData.logo_url || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, logo_url: e.target.value });
                      setLogoPreview(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">ชื่อ *</Label>
              <Input
                id="edit-name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น Netflix"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="edit-category">หมวดหมู่ *</Label>
              <Select
                value={formData.category || "other"}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streaming">Streaming</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="cloud">Cloud</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">ราคา</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.default_price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, default_price: parseFloat(e.target.value) })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-currency">สกุลเงิน</Label>
                <Select
                  value={formData.default_currency || "USD"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, default_currency: value })
                  }
                >
                  <SelectTrigger id="edit-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="THB">THB</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cycle">รอบ</Label>
                <Select
                  value={formData.default_billing_cycle || "monthly"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, default_billing_cycle: value })
                  }
                >
                  <SelectTrigger id="edit-cycle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="edit-website">เว็บไซต์</Label>
              <Input
                id="edit-website"
                type="url"
                value={formData.website_url || ""}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="edit-order">ลำดับการแสดง</Label>
              <Input
                id="edit-order"
                type="number"
                value={formData.display_order || 1}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) })
                }
              />
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-popular">บริการยอดนิยม</Label>
                <Switch
                  id="edit-popular"
                  checked={formData.is_popular || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_popular: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">เปิดใช้งาน</Label>
                <Switch
                  id="edit-active"
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={confirmEdit} disabled={uploading || !formData.name}>
              {uploading ? "กำลังอัปโหลด..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-600">
              คุณแน่ใจหรือไม่ที่จะลบ <strong>{selectedTemplate?.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              ⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}