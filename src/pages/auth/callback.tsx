import { useEffect } from "react";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Handle OAuth callback
    const handleCallback = async () => {
      try {
        console.log("🔄 Starting OAuth callback handling...");
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          router.push("/auth/login");
          return;
        }

        if (!session?.user) {
          console.error("❌ No session or user found");
          router.push("/auth/login");
          return;
        }

        console.log("✅ Session found for user:", session.user.email);
        const { user } = session;
        const metadata = user.user_metadata;
        
        // Extract user metadata from OAuth provider (Google)
        const firstName = metadata?.given_name || metadata?.first_name || null;
        const lastName = metadata?.family_name || metadata?.last_name || null;
        const fullName = metadata?.full_name || 
                        (firstName && lastName ? `${firstName} ${lastName}` : null) ||
                        metadata?.name || null;
        const email = user.email || null;
        const avatarUrl = metadata?.avatar_url || metadata?.picture || null;

        console.log("👤 User metadata:", { firstName, lastName, fullName, email });

        // Check if profile exists
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (profileCheckError && profileCheckError.code !== "PGRST116") {
          console.error("❌ Error checking profile:", profileCheckError);
        }

        if (existingProfile) {
          console.log("✅ Profile exists, updating with OAuth data...");
          // Profile exists - UPDATE with OAuth data
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              first_name: firstName,
              last_name: lastName,
              full_name: fullName,
              email: email,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (updateError) {
            console.error("❌ Error updating profile:", updateError);
          } else {
            console.log("✅ Profile updated successfully");
          }
        } else {
          console.log("📝 Profile doesn't exist, creating new profile...");
          // Profile doesn't exist - CREATE new profile
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: email,
              first_name: firstName,
              last_name: lastName,
              full_name: fullName,
              avatar_url: avatarUrl,
              role: "user",
              is_admin: false,
              currency: "USD",
              country: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error("❌ Error creating profile:", insertError);
            // Don't stop - continue to dashboard, AuthGuard will handle it
          } else {
            console.log("✅ Profile created successfully");
          }
        }

        // Wait longer for database operations to complete
        console.log("⏳ Waiting for database sync...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify session one more time before redirect
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (finalSession?.user) {
          console.log("✅ Final session verified, redirecting to dashboard...");
          router.push("/dashboard");
        } else {
          console.error("❌ Final session check failed");
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("❌ Callback error:", error);
        router.push("/auth/login");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
        <p className="text-lg text-gray-600">กำลังเข้าสู่ระบบ...</p>
        <p className="text-sm text-gray-500">กรุณารอสักครู่</p>
      </div>
    </div>
  );
}