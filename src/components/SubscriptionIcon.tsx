import { useState } from "react";
import { cn } from "@/lib/utils";

interface SubscriptionIconProps {
  name: string;
  websiteUrl?: string | null;
  iconUrl?: string | null; // Keep for backward compatibility or direct URLs
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SubscriptionIcon({ name, websiteUrl, size = "md" }: SubscriptionIconProps) {
  const [imageError, setImageError] = useState(false);
  
  const faviconUrl = websiteUrl 
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(websiteUrl).hostname)}&sz=128`
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
      sizeClasses[size]
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