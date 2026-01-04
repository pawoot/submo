import { useState } from "react";
import Link from "next/link";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await authService.resetPassword(email);

      if (error) {
        setError(error.message);
        toast({
          title: "ส่งอีเมลไม่สำเร็จ",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "ส่งอีเมลสำเร็จ!",
          description: "กรุณาตรวจสอบอีเมลเพื่อรีเซ็ตรหัสผ่าน",
        });
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการส่งอีเมล");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <SEO 
          title="ตรวจสอบอีเมล - Subscription Manager"
          description="ตรวจสอบอีเมลเพื่อรีเซ็ตรหัสผ่าน"
        />
        
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
          <Card className="w-full max-w-md shadow-2xl border-0">
            <CardContent className="pt-12 pb-8 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">ตรวจสอบอีเมลของคุณ</h2>
                <p className="text-gray-600">
                  เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง<br />
                  <span className="font-semibold text-indigo-600">{email}</span>
                </p>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-gray-700">
                  📧 กรุณาคลิกลิงก์ในอีเมลเพื่อรีเซ็ตรหัสผ่าน<br />
                  <span className="text-xs text-gray-500 mt-2 block">
                    ไม่เห็นอีเมล? ตรวจสอบในโฟลเดอร์ Spam
                  </span>
                </AlertDescription>
              </Alert>

              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href="/auth/login">
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="ลืมรหัสผ่าน - Subscription Manager"
        description="รีเซ็ตรหัสผ่านของคุณ"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าเข้าสู่ระบบ
          </Link>

          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ลืมรหัสผ่าน?
              </CardTitle>
              <CardDescription className="text-base">
                ใส่อีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      กำลังส่งอีเมล...
                    </>
                  ) : (
                    "ส่งลิงก์รีเซ็ตรหัสผ่าน"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info */}
          <p className="text-sm text-gray-600 text-center mt-6">
            จำรหัสผ่านได้แล้ว?{" "}
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}