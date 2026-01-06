import { useState } from "react";
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
  "lineman": "lineman.line.me",
  "grab": "grab.com",
  "foodpanda": "foodpanda.co.th",
  "trueid": "trueid.net",
  "ais": "ais.th",
  "dtac": "dtac.co.th"
};

export function SubscriptionIcon({ name, websiteUrl, size = "md", className }: SubscriptionIconProps) {
  const [imageError, setImageError] = useState(false);
  
  // Determine the best URL to use for favicon fetching
  let targetUrl = websiteUrl;
  
  // If no URL provided, or if we have a better known domain for this service name
  if (!targetUrl) {
    const lowerName = name.toLowerCase().trim();
    // Check exact match or partial match
    const knownKey = Object.keys(KNOWN_DOMAINS).find(key => lowerName.includes(key));
    if (knownKey) {
      targetUrl = `https://${KNOWN_DOMAINS[knownKey]}`;
    }
  }
  
  const faviconUrl = targetUrl 
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(targetUrl).hostname)}&sz=128`
    : null;

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