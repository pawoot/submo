import { useState } from "react";

interface SubscriptionIconProps {
  name: string;
  website?: string | null;
  logoUrl?: string | null;
  className?: string;
}

export function SubscriptionIcon({ name, website, logoUrl, className = "w-12 h-12" }: SubscriptionIconProps) {
  const [faviconError, setFaviconError] = useState(false);
  const [faviconLoaded, setFaviconLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

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

  // Priority: 1. Favicon, 2. Logo URL, 3. Letter fallback
  const shouldShowFavicon = faviconUrl && !faviconError && faviconLoaded;
  const shouldShowLogo = !shouldShowFavicon && logoUrl && !logoError && logoLoaded;
  const shouldShowFallback = !shouldShowFavicon && !shouldShowLogo;

  // Get first letter and color for fallback
  const firstLetter = name.charAt(0).toUpperCase();
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
  const colorIndex = firstLetter.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div className={`relative ${className} rounded-lg overflow-hidden`}>
      {/* Priority 1: Favicon */}
      {faviconUrl && (
        <img
          src={faviconUrl}
          alt={`${name} favicon`}
          className={`w-full h-full object-contain bg-white p-1 transition-opacity duration-200 ${
            shouldShowFavicon ? "opacity-100" : "opacity-0 absolute"
          }`}
          onLoad={() => setFaviconLoaded(true)}
          onError={() => setFaviconError(true)}
          loading="lazy"
        />
      )}

      {/* Priority 2: Uploaded Logo */}
      {logoUrl && !shouldShowFavicon && (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            shouldShowLogo ? "opacity-100" : "opacity-0 absolute"
          }`}
          onLoad={() => setLogoLoaded(true)}
          onError={() => setLogoError(true)}
          loading="lazy"
        />
      )}

      {/* Priority 3: Letter Fallback */}
      {shouldShowFallback && (
        <div
          className={`w-full h-full flex items-center justify-center ${bgColor} text-white font-semibold`}
        >
          {firstLetter}
        </div>
      )}
    </div>
  );
}