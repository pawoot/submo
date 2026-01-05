import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          router.push("/auth/login");
        } else if (event === "SIGNED_IN") {
          if (requireAdmin) {
            checkAdminStatus(session?.user?.id);
          } else {
            setAuthenticated(true);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, requireAdmin]);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        if (requireAdmin) {
          await checkAdminStatus(session.user.id);
        } else {
          setAuthenticated(true);
        }
      } else {
        // Only redirect if we're sure user is not authenticated
        setAuthenticated(false);
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthenticated(false);
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  }

  async function checkAdminStatus(userId?: string) {
    if (!userId) {
      router.push("/dashboard");
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile?.role === "admin") {
        setAuthenticated(true);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Admin check error:", error);
      router.push("/dashboard");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}