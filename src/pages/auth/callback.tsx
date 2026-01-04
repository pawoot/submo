import { useEffect } from "react";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Handle OAuth callback
    const handleCallback = async () => {
      // Wait a moment for Supabase to process the session
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to home page
      router.push("/");
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