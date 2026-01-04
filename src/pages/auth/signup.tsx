import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { Mail, Lock, Chrome, Loader2, ArrowLeft, CheckCircle2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Country list in Thai
const COUNTRIES = [
  { code: "TH", name: "ไทย", nameEn: "Thailand" },
  { code: "US", name: "สหรัฐอเมริกา", nameEn: "United States" },
  { code: "GB", name: "สหราชอาณาจักร", nameEn: "United Kingdom" },
  { code: "JP", name: "ญี่ปุ่น", nameEn: "Japan" },
  { code: "CN", name: "จีน", nameEn: "China" },
  { code: "KR", name: "เกาหลีใต้", nameEn: "South Korea" },
  { code: "SG", name: "สิงคโปร์", nameEn: "Singapore" },
  { code: "MY", name: "มาเลเซีย", nameEn: "Malaysia" },
  { code: "ID", name: "อินโดนีเซีย", nameEn: "Indonesia" },
  { code: "VN", name: "เวียดนาม", nameEn: "Vietnam" },
  { code: "PH", name: "ฟิลิปปินส์", nameEn: "Philippines" },
  { code: "IN", name: "อินเดีย", nameEn: "India" },
  { code: "AU", name: "ออสเตรเลีย", nameEn: "Australia" },
  { code: "CA", name: "แคนาดา", nameEn: "Canada" },
  { code: "DE", name: "เยอรมนี", nameEn: "Germany" },
  { code: "FR", name: "ฝรั่งเศส", nameEn: "France" },
  { code: "IT", name: "อิตาลี", nameEn: "Italy" },
  { code: "ES", name: "สเปน", nameEn: "Spain" },
  { code: "NL", name: "เนเธอร์แลนด์", nameEn: "Netherlands" },
  { code: "SE", name: "สวีเดน", nameEn: "Sweden" },
  { code: "NO", name: "นอร์เวย์", nameEn: "Norway" },
  { code: "DK", name: "เดนมาร์ก", nameEn: "Denmark" },
  { code: "FI", name: "ฟินแลนด์", nameEn: "Finland" },
  { code: "CH", name: "สวิตเซอร์แลนด์", nameEn: "Switzerland" },
  { code: "AT", name: "ออสเตรีย", nameEn: "Austria" },
  { code: "BE", name: "เบลเยียม", nameEn: "Belgium" },
  { code: "NZ", name: "นิวซีแลนด์", nameEn: "New Zealand" },
  { code: "BR", name: "บราซิล", nameEn: "Brazil" },
  { code: "MX", name: "เม็กซิโก", nameEn: "Mexico" },
  { code: "AR", name: "อาร์เจนตินา", nameEn: "Argentina" },
  { code: "RU", name: "รัสเซีย", nameEn: "Russia" },
  { code: "ZA", name: "แอฟริกาใต้", nameEn: "South Africa" },
  { code: "AE", name: "สหรัฐอาหรับเอมิเรตส์", nameEn: "United Arab Emirates" },
  { code: "SA", name: "ซาอุดีอาระเบีย", nameEn: "Saudi Arabia" },
  { code: "IL", name: "อิสราเอล", nameEn: "Israel" },
  { code: "TR", name: "ตุรกี", nameEn: "Turkey" },
  { code: "EG", name: "อียิปต์", nameEn: "Egypt" },
  { code: "NG", name: "ไนจีเรีย", nameEn: "Nigeria" },
  { code: "KE", name: "เคนยา", nameEn: "Kenya" },
  { code: "PK", name: "ปากีสถาน", nameEn: "Pakistan" },
  { code: "BD", name: "บังกลาเทศ", nameEn: "Bangladesh" },
].sort((a, b) => a.name.localeCompare(b.name, "th"));

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [detectingCountry, setDetectingCountry] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const session = await authService.getCurrentSession();
      if (session) {
        router.push("/");
      }
    };
    checkAuth();

    // Detect country from IP
    const detectCountry = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        
        if (data.country_code) {
          // Check if detected country is in our list
          const countryExists = COUNTRIES.find(c => c.code === data.country_code);
          if (countryExists) {
            setCountry(data.country_code);
          }
        }
      } catch (error) {
        console.error("Failed to detect country:", error);
      } finally {
        setDetectingCountry(false);
      }
    };
    
    detectCountry();
  }, [router]);

  const validatePassword = () => {
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return false;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return false;
    }
    return true;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptTerms) {
      setError("กรุณายอมรับข้อกำหนดและเงื่อนไข");
      return;
    }

    if (!country) {
      setError("กรุณาเลือกประเทศ");
      return;
    }

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const { user, error } = await authService.signUp(email, password);

      if (error) {
        setError(error.message);
        toast({
          title: "สมัครสมาชิกไม่สำเร็จ",
          description: error.message,
          variant: "destructive",
        });
      } else if (user) {
        // Update profile with country
        try {
          await profileService.updateProfile({ country });
        } catch (profileError) {
          console.error("Failed to update country:", profileError);
        }

        setSuccess(true);
        toast({
          title: "สมัครสมาชิกสำเร็จ!",
          description: "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี",
        });
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const { error } = await authService.signInWithGoogle();

      if (error) {
        setError(error.message);
        toast({
          title: "สมัครสมาชิกไม่สำเร็จ",
          description: error.message,
          variant: "destructive",
        });
        setGoogleLoading(false);
      }
      // If successful, user will be redirected to Google OAuth
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการสมัครสมาชิกด้วย Google");
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <SEO 
          title="ยืนยันอีเมล - Subscription Manager"
          description="ยืนยันอีเมลเพื่อเข้าใช้งานระบบ"
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
                  เราได้ส่งลิงก์ยืนยันไปยัง<br />
                  <span className="font-semibold text-indigo-600">{email}</span>
                </p>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-gray-700">
                  📧 กรุณาคลิกลิงก์ในอีเมลเพื่อยืนยันบัญชีของคุณ<br />
                  <span className="text-xs text-gray-500 mt-2 block">
                    ไม่เห็นอีเมล? ตรวจสอบในโฟลเดอร์ Spam
                  </span>
                </AlertDescription>
              </Alert>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/auth/login")}
              >
                ไปหน้าเข้าสู่ระบบ
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
        title="สมัครสมาชิก - Subscription Manager"
        description="สมัครสมาชิกเพื่อเริ่มจัดการ Software Subscriptions"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="w-full max-w-md">
          {/* Back to Home */}
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าแรก
          </Link>

          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                สมัครสมาชิก
              </CardTitle>
              <CardDescription className="text-base">
                เริ่มต้นจัดการ Subscriptions ของคุณวันนี้
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Google Sign Up */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-medium hover:bg-gray-50 border-2"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    กำลังเชื่อมต่อ...
                  </>
                ) : (
                  <>
                    <Chrome className="mr-2 h-5 w-5 text-red-500" />
                    สมัครด้วย Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">หรือ</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailSignUp} className="space-y-4">
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
                      disabled={loading || googleLoading}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading || googleLoading}
                      className="pl-10 h-12"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading || googleLoading}
                      className="pl-10 h-12"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">ประเทศ</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                    <Select
                      value={country}
                      onValueChange={setCountry}
                      disabled={loading || googleLoading || detectingCountry}
                    >
                      <SelectTrigger className="pl-10 h-12">
                        <SelectValue placeholder={detectingCountry ? "กำลังตรวจสอบ..." : "เลือกประเทศ"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="flex items-center gap-2">
                              <span className="text-base">{country.name}</span>
                              <span className="text-xs text-gray-500">({country.nameEn})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {detectingCountry && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      กำลังตรวจสอบประเทศจาก IP ของคุณ...
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    disabled={loading || googleLoading}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    ฉันยอมรับ{" "}
                    <Link href="/terms" className="text-indigo-600 hover:text-indigo-700 font-medium">
                      ข้อกำหนดและเงื่อนไข
                    </Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      กำลังสมัครสมาชิก...
                    </>
                  ) : (
                    "สมัครสมาชิก"
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Separator />
              <div className="text-center text-sm text-gray-600">
                มีบัญชีอยู่แล้ว?{" "}
                <Link 
                  href="/auth/login" 
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 text-center">
                🔒 ข้อมูลของคุณปลอดภัยด้วย Supabase Authentication
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}