import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import SEO from "@/components/SEO";
import MobileHeader from "@/components/MobileHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { SUPPORTED_CURRENCIES } from "@/services/currencyService";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  LogOut, 
  Trash2, 
  Save,
  Upload,
  ArrowLeft,
  CreditCard,
  TrendingUp,
  Package,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { preferredCurrency, setPreferredCurrency } = useCurrency();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<{
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null>(null);

  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalMonthlySpend: 0,
    totalYearlySpend: 0,
  });

  const [formData, setFormData] = useState({
    full_name: "",
    avatar_url: "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadProfile();
    loadStats();
    loadUserData();
    loadUnreadNotifications();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileService.getCurrentProfile();
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await profileService.getUserStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Check if user is admin
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        
        if (profileData?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id)
          .eq("is_read", false);
        
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await profileService.updateProfile({
        full_name: formData.full_name || null,
        avatar_url: formData.avatar_url || null,
      });

      toast({
        title: "สำเร็จ!",
        description: "อัปเดตโปรไฟล์เรียบร้อยแล้ว",
      });

      loadProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตโปรไฟล์ได้",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "ไฟล์ใหญ่เกินไป",
        description: "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 2MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "ไฟล์ไม่ถูกต้อง",
        description: "กรุณาเลือกไฟล์รูปภาพเท่านั้น",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const avatarUrl = await profileService.uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));

      await profileService.updateProfile({ avatar_url: avatarUrl });

      toast({
        title: "สำเร็จ!",
        description: "อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว",
      });

      loadProfile();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดรูปภาพได้",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "กรุณากรอกรหัสผ่านให้ตรงกันทั้งสองช่อง",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "รหัสผ่านสั้นเกินไป",
        description: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await profileService.changePassword(passwordData.newPassword);

      toast({
        title: "สำเร็จ!",
        description: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
      });

      setPasswordData({ newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเปลี่ยนรหัสผ่านได้",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await profileService.deleteAccount();
      
      toast({
        title: "บัญชีถูกลบแล้ว",
        description: "ขอบคุณที่ใช้บริการ",
      });

      router.push("/auth/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบบัญชีได้",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลด...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <SEO title="โปรไฟล์ผู้ใช้" description="จัดการข้อมูลโปรไฟล์และการตั้งค่าบัญชีของคุณ" />
      
      {/* Mobile Header */}
      <MobileHeader user={user} isAdmin={isAdmin} unreadCount={unreadCount} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        {/* Desktop Header - Hidden on mobile */}
        <header className="hidden lg:block bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    กลับ
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
                  <p className="text-sm text-gray-600">จัดการข้อมูลส่วนตัวและการตั้งค่า</p>
                </div>
              </div>

              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Card & Stats */}
            <div className="space-y-6">
              {/* Profile Card */}
              <Card className="border-2 border-indigo-100">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold">
                          {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                        <Upload className="h-4 w-4" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={saving}
                        />
                      </label>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {profile?.full_name || "ไม่ระบุชื่อ"}
                    </h2>
                    <p className="text-sm text-gray-600 mb-3">{profile?.email}</p>

                    <Badge variant="secondary" className="mb-4">
                      <Calendar className="h-3 w-3 mr-1" />
                      สมาชิกตั้งแต่ {new Date(profile?.created_at || "").toLocaleDateString("th-TH", { year: "numeric", month: "long" })}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <Card className="border-2 border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    สถิติการใช้งาน
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subscriptions ทั้งหมด</span>
                    <span className="text-2xl font-bold text-gray-900">{stats.totalSubscriptions}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">กำลังใช้งาน</span>
                    <span className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ค่าใช้จ่ายรายเดือน</span>
                    <span className="text-xl font-bold text-indigo-600">${formatCurrency(stats.totalMonthlySpend, preferredCurrency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ค่าใช้จ่ายรายปี</span>
                    <span className="text-xl font-bold text-purple-600">${formatCurrency(stats.totalYearlySpend, preferredCurrency)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Edit Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Edit Profile Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    ข้อมูลส่วนตัว
                  </CardTitle>
                  <CardDescription>อัปเดตข้อมูลโปรไฟล์ของคุณ</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <Mail className="h-4 w-4 inline mr-2" />
                        อีเมล
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">อีเมลไม่สามารถเปลี่ยนแปลงได้</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name">
                        <User className="h-4 w-4 inline mr-2" />
                        ชื่อ-นามสกุล
                      </Label>
                      <Input
                        id="full_name"
                        type="text"
                        placeholder="กรอกชื่อ-นามสกุล"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">URL รูปโปรไฟล์</Label>
                      <Input
                        id="avatar_url"
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500">หรือคลิกที่รูปด้านซ้ายเพื่ออัปโหลดรูปใหม่</p>
                    </div>

                    <Button type="submit" disabled={saving} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    ความปลอดภัย
                  </CardTitle>
                  <CardDescription>เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชี</CardDescription>
                </CardHeader>
                <CardContent>
                  {!showPasswordForm ? (
                    <Button variant="outline" onClick={() => setShowPasswordForm(true)} className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      เปลี่ยนรหัสผ่าน
                    </Button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new_password">รหัสผ่านใหม่</Label>
                        <div className="relative">
                          <Input
                            id="new_password"
                            type={showPassword ? "text" : "password"}
                            placeholder="กรอกรหัสผ่านใหม่"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">ยืนยันรหัสผ่านใหม่</Label>
                        <div className="relative">
                          <Input
                            id="confirm_password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="กรอกรหัสผ่านอีกครั้ง"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={saving} className="flex-1">
                          {saving ? "กำลังบันทึก..." : "บันทึก"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordData({ newPassword: "", confirmPassword: "" });
                          }}
                          className="flex-1"
                        >
                          ยกเลิก
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Currency Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    💱 การตั้งค่าสกุลเงิน
                  </CardTitle>
                  <CardDescription>เลือกสกุลเงินที่ต้องการแสดงในระบบ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">สกุลเงินที่แสดง</Label>
                    <Select
                      value={preferredCurrency}
                      onValueChange={async (value) => {
                        try {
                          await setPreferredCurrency(value);
                          toast({
                            title: "✅ สำเร็จ!",
                            description: "เปลี่ยนสกุลเงินเรียบร้อยแล้ว",
                          });
                          
                          // Reload page to update all displays
                          window.location.reload();
                        } catch (error) {
                          console.error("Error updating currency:", error);
                          toast({
                            title: "เกิดข้อผิดพลาด",
                            description: "ไม่สามารถเปลี่ยนสกุลเงินได้",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="เลือกสกุลเงิน" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <span>{currency.flag}</span>
                              <span className="font-medium">{currency.code}</span>
                              <span className="text-muted-foreground">- {currency.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      ระบบจะแปลงค่าเงินทั้งหมดเป็นสกุลที่คุณเลือกโดยอัตโนมัติ
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{SUPPORTED_CURRENCIES.find(c => c.code === preferredCurrency)?.flag}</div>
                      <div>
                        <p className="font-semibold text-blue-900">
                          สกุลเงินปัจจุบัน: {preferredCurrency}
                        </p>
                        <p className="text-sm text-blue-700">
                          {SUPPORTED_CURRENCIES.find(c => c.code === preferredCurrency)?.name}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          ตัวอย่าง: {SUPPORTED_CURRENCIES.find(c => c.code === preferredCurrency)?.symbol}1,000.00
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>การดำเนินการเหล่านี้ไม่สามารถย้อนกลับได้</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    ลบบัญชีถาวร
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
            <AlertDialogDescription>
              การลบบัญชีจะทำให้ข้อมูลทั้งหมดของคุณถูกลบอย่างถาวร รวมถึง:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>ข้อมูลโปรไฟล์</li>
                <li>Subscriptions ทั้งหมด ({stats.totalSubscriptions} รายการ)</li>
                <li>ประวัติการใช้งาน</li>
              </ul>
              <p className="mt-3 font-semibold text-red-600">การกระทำนี้ไม่สามารถยกเลิกได้</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              ยืนยันการลบบัญชี
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthGuard>
  );
}