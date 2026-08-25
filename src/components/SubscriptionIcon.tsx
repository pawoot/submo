import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SubscriptionIconProps {
  name: string;
  websiteUrl?: string | null;
  iconUrl?: string | null; // Keep for backward compatibility or direct URLs
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Known domains map to ensure correct favicons
const KNOWN_DOMAINS: Record<string, string> = {
  "google one": "one.google.com",
  "1password": "1password.com",
  "google": "google.com",
  "youtube": "youtube.com",
  "youtube premium": "youtube.com",
  "netflix": "netflix.com",
  "spotify": "spotify.com",
  "apple": "apple.com",
  "icloud": "icloud.com",
  "icloud+": "icloud.com",
  "adobe": "adobe.com",
  "adobe creative cloud": "adobe.com",
  "aws": "aws.amazon.com",
  "amazon prime": "amazon.com",
  "disney+": "disneyplus.com",
  "disney plus": "disneyplus.com",
  "hbo": "hbomax.com",
  "hbo go": "hbogo.co.th",
  "canva": "canva.com",
  "figma": "figma.com",
  "notion": "notion.so",
  "chatgpt": "openai.com",
  "openai": "openai.com",
  "claude": "claude.ai",
  "anthropic": "anthropic.com",
  "myfitness pal": "myfitnesspal.com",
  "myfitnesspal": "myfitnesspal.com",
  "midjourney": "midjourney.com",
  "zoom": "zoom.us",
  "microsoft": "microsoft.com",
  "microsoft 365": "microsoft.com",
  "office 365": "office.com",
  "dropbox": "dropbox.com",
  "slack": "slack.com",
  "github": "github.com",
  "gitlab": "gitlab.com",
  "vercel": "vercel.com",
  "digitalocean": "digitalocean.com",
  "telegram": "telegram.org",
  "tradingview": "tradingview.com",
  "tldv": "tldv.io",
  "whoscall": "whoscall.com",
  "lineman": "lineman.line.me",
  "grab": "grab.com",
  "foodpanda": "foodpanda.co.th",
  "trueid": "trueid.net",
  "ais": "ais.th",
  "dtac": "dtac.co.th"
};

const KNOWN_ICON_URLS: Record<string, string> = {
  myxd: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/dc/d5/6e/dcd56e24-a411-0f7e-d52e-346cb84c1275/AppIcon-0-1x_U007emarketing-0-7-0-sRGB-85-220.png/1200x630wa.jpg",
};

export function SubscriptionIcon({ name, websiteUrl, iconUrl, size = "md", className }: SubscriptionIconProps) {
  const [imageError, setImageError] = useState(false);
  const lowerName = name.toLowerCase().trim();
  
  // Determine the best URL to use for favicon fetching
  let targetUrl = websiteUrl;
  
  // If no URL provided, or if we have a better known domain for this service name
  if (!targetUrl) {
    // Check exact match or partial match
    const knownKey = Object.keys(KNOWN_DOMAINS).find(key => lowerName.includes(key));
    if (knownKey) {
      targetUrl = `https://${KNOWN_DOMAINS[knownKey]}`;
    }
  }
  
  let faviconUrl = iconUrl?.trim() || KNOWN_ICON_URLS[lowerName] || null;
  if (!faviconUrl && targetUrl) {
    try {
      faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(targetUrl).hostname)}&sz=128`;
    } catch {
      // A malformed website URL should not prevent the subscription from rendering.
      faviconUrl = null;
    }
  }

  useEffect(() => {
    setImageError(false);
  }, [faviconUrl]);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
  };

  const showFavicon = faviconUrl && !imageError;

  return (
    <div className={cn(
      "relative rounded-full flex items-center justify-center overflow-hidden",
      "bg-white border border-slate-200 dark:border-slate-700 shadow-sm",
      sizeClasses[size],
      className
    )}>
      {showFavicon ? (
        <img 
          src={faviconUrl}
          alt={name}
          className="w-full h-full object-cover p-2"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
