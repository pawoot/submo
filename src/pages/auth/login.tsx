import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/services/authService";
import { Mail, Lock, Chrome, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user, error } = await authService.signIn(email, password);

      if (error) {
        setError(error.message);
        toast({
          title: t("auth.loginError"),
          description: error.message,
          variant: "destructive",
        });
      } else if (user) {
        toast({
          title: t("auth.loginSuccess"),
          description: `${t("home.welcome")} ${user.email}`,
        });
        router.push("/dashboard");
      }
    } catch (err) {
      setError(t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const { error } = await authService.signInWithGoogle();

      if (error) {
        setError(error.message);
        toast({
          title: t("auth.loginError"),
          description: error.message,
          variant: "destructive",
        });
        setGoogleLoading(false);
      }
      // If successful, user will be redirected to Google OAuth
    } catch (err) {
      setError(t("auth.loginError"));
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title={t("auth.login") + " - Submo.ai"}
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
                <Lock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t("auth.login")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("home.welcome")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-medium hover:bg-gray-50 border-2"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("auth.loggingIn")}
                  </>
                ) : (
                  <>
                    <Chrome className="mr-2 h-5 w-5 text-red-500" />
                    {t("auth.login")} Google
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
              <form onSubmit={handleEmailLogin} className="space-y-4">
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
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("auth.loggingIn")}
                    </>
                  ) : (
                    t("auth.login")
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Separator />
              <div className="text-center text-sm text-gray-600">
                {t("auth.noAccount")}{" "}
                <Link 
                  href="/auth/signup" 
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  {t("auth.signup")}
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