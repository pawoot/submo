import { useEffect } from "react";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { profileService } from "@/services/profileService";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Handle OAuth callback
    const handleCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          router.push("/auth/login");
          return;
        }

        if (session?.user) {
          // Extract user metadata from OAuth provider (Google)
          const { user } = session;
          const metadata = user.user_metadata;
          
          // Get first name and last name from Google OAuth
          const firstName = metadata?.given_name || metadata?.first_name || null;
          const lastName = metadata?.family_name || metadata?.last_name || null;
          const fullName = metadata?.full_name || 
                          (firstName && lastName ? `${firstName} ${lastName}` : null) ||
                          metadata?.name || null;
          const email = user.email || null;

          // Update profile with OAuth data
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              first_name: firstName,
              last_name: lastName,
              full_name: fullName,
              email: email,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (updateError) {
            console.error("Error updating profile:", updateError);
          }
        }

        // Wait a moment for processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirect to dashboard page
        router.push("/");
      } catch (error) {
        console.error("Callback error:", error);
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
      </div>
    </div>
  );
}