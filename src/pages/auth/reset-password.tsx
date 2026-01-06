import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);

  // Check if user has valid session (came from email link)
  useEffect(() => {
    const checkSession = async () => {
      const session = await authService.getCurrentSession();
      if (!session) {
        // No valid session - redirect to forgot password
        toast({
          title: t("auth.invalidLink"),
          description: t("auth.requestNewLink"),
          variant: "destructive",
        });
        router.push("/auth/forgot-password");
      }
    };
    checkSession();
  }, [router, toast, t]);

  // Password strength checker
  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordStrength(null);
      return;
    }

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
    if (/\d/.test(newPassword)) strength++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;

    if (strength <= 2) setPasswordStrength("weak");
    else if (strength <= 3) setPasswordStrength("medium");
    else setPasswordStrength("strong");
  }, [newPassword]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (newPassword.length < 8) {
      setError(t("auth.weakPassword"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    if (passwordStrength === "weak") {
      setError(t("auth.weakPasswordDesc"));
      return;
    }

    setLoading(true);

    try {
      const { error } = await authService.updatePassword(newPassword);

      if (error) {
        setError(error.message);
        toast({
          title: t("auth.changePasswordFailed"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: t("auth.passwordChanged"),
          description: t("auth.redirectingLogin"),
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    } catch (err) {
      setError(t("auth.changePasswordError"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <SEO 
          title={`${t("auth.passwordChanged")} - Submo.ai`}
          description={t("auth.passwordChangedDesc")}
        />
        
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
          <Card className="w-full max-w-md shadow-2xl border-0">
            <CardContent className="pt-12 pb-8 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">{t("auth.passwordChanged")}</h2>
                <p className="text-gray-600">
                  {t("auth.passwordChangedDesc")}<br />
                  {t("auth.redirectingLogin")}
                </p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-[progress_3s_ease-in-out]" style={{ width: "100%" }}></div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href="/auth/login">
                  {t("auth.backToLogin")}
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
        title={`${t("auth.resetPassword")} - Submo.ai`}
        description={t("auth.enterNewPassword")}
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t("auth.resetPassword")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("auth.enterNewPassword")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 pr-10 h-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordStrength && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        <div className={`h-1 flex-1 rounded ${passwordStrength === "weak" ? "bg-red-500" : passwordStrength === "medium" ? "bg-yellow-500" : "bg-green-500"}`}></div>
                        <div className={`h-1 flex-1 rounded ${passwordStrength === "medium" || passwordStrength === "strong" ? passwordStrength === "medium" ? "bg-yellow-500" : "bg-green-500" : "bg-gray-200"}`}></div>
                        <div className={`h-1 flex-1 rounded ${passwordStrength === "strong" ? "bg-green-500" : "bg-gray-200"}`}></div>
                      </div>
                      <p className={`text-xs ${passwordStrength === "weak" ? "text-red-600" : passwordStrength === "medium" ? "text-yellow-600" : "text-green-600"}`}>
                        {passwordStrength === "weak" && t("auth.strength.weak")}
                        {passwordStrength === "medium" && t("auth.strength.medium")}
                        {passwordStrength === "strong" && t("auth.strength.strong")}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    {t("auth.passwordRequirements")}
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirmNewPassword")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 pr-10 h-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <p className={`text-xs ${newPassword === confirmPassword ? "text-green-600" : "text-red-600"}`}>
                      {newPassword === confirmPassword ? `✓ ${t("auth.passwordMatch")}` : `✗ ${t("auth.passwordMismatchDesc")}`}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("auth.changingPassword")}
                    </>
                  ) : (
                    t("auth.changePassword")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info */}
          <p className="text-sm text-gray-600 text-center mt-6">
            {t("auth.rememberPassword")}{" "}
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}