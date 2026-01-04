import { useState } from "react";

interface SubscriptionIconProps {
  name: string;
  website?: string | null;
  className?: string;
}

export function SubscriptionIcon({ name, website, className = "" }: SubscriptionIconProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Extract domain from URL
  const getDomain = (url: string): string | null => {
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return null;
    }
  };

  const domain = website ? getDomain(website) : null;
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;

  // Get first letter for fallback
  const firstLetter = name.charAt(0).toUpperCase();

  // Color mapping for fallback avatars (same as before)
  const getColorClass = (name: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-indigo-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const shouldShowFavicon = faviconUrl && !imageError && imageLoaded;

  return (
    <div className={`relative ${className}`}>
      {faviconUrl && !imageError && (
        <img
          src={faviconUrl}
          alt={`${name} favicon`}
          className={`w-full h-full object-contain rounded-lg transition-opacity duration-200 ${
            imageLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(false);
          }}
          loading="lazy"
        />
      )}
      
      {/* Fallback: Show first letter if no favicon or error */}
      {!shouldShowFavicon && (
        <div
          className={`w-full h-full rounded-lg ${getColorClass(name)} flex items-center justify-center text-white font-semibold`}
        >
          {firstLetter}
        </div>
      )}
    </div>
  );
}