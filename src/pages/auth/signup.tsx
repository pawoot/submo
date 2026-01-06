import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
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
import { useLanguage } from "@/contexts/LanguageContext";

// Country list in Thai
const COUNTRIES = [
  { code: "TH", name: "ไทย", nameEn: "Thailand", flag: "🇹🇭" },
  { code: "US", name: "สหรัฐอเมริกา", nameEn: "United States", flag: "🇺🇸" },
  { code: "GB", name: "สหราชอาณาจักร", nameEn: "United Kingdom", flag: "🇬🇧" },
  { code: "JP", name: "ญี่ปุ่น", nameEn: "Japan", flag: "🇯🇵" },
  { code: "CN", name: "จีน", nameEn: "China", flag: "🇨🇳" },
  { code: "KR", name: "เกาหลีใต้", nameEn: "South Korea", flag: "🇰🇷" },
  { code: "SG", name: "สิงคโปร์", nameEn: "Singapore", flag: "🇸🇬" },
  { code: "MY", name: "มาเลเซีย", nameEn: "Malaysia", flag: "🇲🇾" },
  { code: "ID", name: "อินโดนีเซีย", nameEn: "Indonesia", flag: "🇮🇩" },
  { code: "VN", name: "เวียดนาม", nameEn: "Vietnam", flag: "🇻🇳" },
  { code: "PH", name: "ฟิลิปปินส์", nameEn: "Philippines", flag: "🇵🇭" },
  { code: "IN", name: "อินเดีย", nameEn: "India", flag: "🇮🇳" },
  { code: "AU", name: "ออสเตรเลีย", nameEn: "Australia", flag: "🇦🇺" },
  { code: "CA", name: "แคนาดา", nameEn: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "เยอรมนี", nameEn: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "ฝรั่งเศส", nameEn: "France", flag: "🇫🇷" },
  { code: "IT", name: "อิตาลี", nameEn: "Italy", flag: "🇮🇹" },
  { code: "ES", name: "สเปน", nameEn: "Spain", flag: "🇪🇸" },
  { code: "NL", name: "เนเธอร์แลนด์", nameEn: "Netherlands", flag: "🇳🇱" },
  { code: "SE", name: "สวีเดน", nameEn: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "นอร์เวย์", nameEn: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "เดนมาร์ก", nameEn: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "ฟินแลนด์", nameEn: "Finland", flag: "🇫🇮" },
  { code: "CH", name: "สวิตเซอร์แลนด์", nameEn: "Switzerland", flag: "🇨🇭" },
  { code: "AT", name: "ออสเตรีย", nameEn: "Austria", flag: "🇦🇹" },
  { code: "BE", name: "เบลเยียม", nameEn: "Belgium", flag: "🇧🇪" },
  { code: "NZ", name: "นิวซีแลนด์", nameEn: "New Zealand", flag: "🇳🇿" },
  { code: "BR", name: "บราซิล", nameEn: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "เม็กซิโก", nameEn: "Mexico", flag: "🇲🇽" },
  { code: "AR", name: "อาร์เจนตินา", nameEn: "Argentina", flag: "🇦🇷" },
  { code: "RU", name: "รัสเซีย", nameEn: "Russia", flag: "🇷🇺" },
  { code: "ZA", name: "แอฟริกาใต้", nameEn: "South Africa", flag: "🇿🇦" },
  { code: "AE", name: "สหรัฐอาหรับเอมิเรตส์", nameEn: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", name: "ซาอุดีอาระเบีย", nameEn: "Saudi Arabia", flag: "🇸🇦" },
  { code: "IL", name: "อิสราเอล", nameEn: "Israel", flag: "🇮🇱" },
  { code: "TR", name: "ตุรกี", nameEn: "Turkey", flag: "🇹🇷" },
  { code: "EG", name: "อียิปต์", nameEn: "Egypt", flag: "🇪🇬" },
  { code: "NG", name: "ไนจีเรีย", nameEn: "Nigeria", flag: "🇳🇬" },
  { code: "KE", name: "เคนยา", nameEn: "Kenya", flag: "🇰🇪" },
  { code: "PK", name: "ปากีสถาน", nameEn: "Pakistan", flag: "🇵🇰" },
  { code: "BD", name: "บังกลาเทศ", nameEn: "Bangladesh", flag: "🇧🇩" },
].sort((a, b) => a.name.localeCompare(b.name, "th"));

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, language } = useLanguage();
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
  }, []);

  const validatePassword = () => {
    if (password.length < 6) {
      setError(t("auth.weakPassword"));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return false;
    }
    return true;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptTerms) {
      setError(t("validation.required"));
      return;
    }

    if (!country) {
      setError(t("validation.required"));
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
          title: t("auth.signupError"),
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
          title: t("auth.signupSuccess"),
          description: t("auth.checkEmail"),
        });
      }
    } catch (err) {
      setError(t("auth.signupError"));
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
          title: t("auth.signupError"),
          description: error.message,
          variant: "destructive",
        });
        setGoogleLoading(false);
      }
      // If successful, user will be redirected to Google OAuth
    } catch (err) {
      setError(t("auth.signupError"));
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <SEO 
          title={t("auth.checkEmail") + " - Submo.ai"}
          description={t("auth.resetLinkSent")}
        />
        
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
          <Card className="w-full max-w-md shadow-2xl border-0">
            <CardContent className="pt-12 pb-8 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">{t("auth.checkEmail")}</h2>
                <p className="text-gray-600">
                  {t("auth.resetLinkSent")}<br />
                  <span className="font-semibold text-indigo-600">{email}</span>
                </p>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-gray-700">
                  📧 {t("auth.checkEmail")}<br />
                  <span className="text-xs text-gray-500 mt-2 block">
                    {t("auth.checkSpam")}
                  </span>
                </AlertDescription>
              </Alert>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/auth/login")}
              >
                {t("auth.backToLogin")}
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
        title={t("auth.signup") + " - Submo.ai"}
        description={t("home.seo.description")}
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="w-full max-w-md">
          {/* Back to Home */}
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </Link>

          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t("auth.signup")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("home.description")}
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
                    {t("auth.signingUp")}
                  </>
                ) : (
                  <>
                    <Chrome className="mr-2 h-5 w-5 text-red-500" />
                    {t("auth.signup")} Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">{t("common.or")}</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("auth.emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading || googleLoading}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("auth.passwordPlaceholder")}
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
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t("auth.confirmPassword")}
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
                  <Label htmlFor="country">{t("profile.country")}</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                    <Select
                      value={country}
                      onValueChange={setCountry}
                      disabled={loading || googleLoading || detectingCountry}
                    >
                      <SelectTrigger className="pl-10 h-12">
                        <SelectValue placeholder={detectingCountry ? t("common.loading") : t("common.select")} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="flex items-center gap-2">
                              <span className="text-lg">{country.flag}</span>
                              <span className="text-base">{language === "th" ? country.name : country.nameEn}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {detectingCountry && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t("common.loading")}
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
                    {t("validation.required")}
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
                      {t("auth.signingUp")}
                    </>
                  ) : (
                    t("auth.signup")
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Separator />
              <div className="text-center text-sm text-gray-600">
                {t("auth.hasAccount")}{" "}
                <Link 
                  href="/auth/login" 
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  {t("auth.login")}
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 text-center">
                🔒 {t("home.description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}