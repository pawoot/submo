import { cn } from "@/lib/utils";

interface SubscriptionIconProps {
  name: string;
  websiteUrl?: string | null;
  iconUrl?: string | null; // Keep for backward compatibility or direct URLs
  className?: string;
}

export function SubscriptionIcon({ name, websiteUrl, iconUrl, className }: SubscriptionIconProps) {
  // Generate favicon URL if websiteUrl is provided
  const faviconUrl = websiteUrl 
    ? `https://www.google.com/s2/favicons?domain=${new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).hostname}&sz=128`
    : iconUrl;

  return (
    <div 
      className={cn(
        "flex items-center justify-center bg-indigo-500 text-white font-bold rounded-full overflow-hidden",
        className
      )}
    >
      {faviconUrl ? (
        <img 
          src={faviconUrl} 
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) (fallback as HTMLElement).style.display = "block";
          }}
        />
      ) : null}
      <span style={{ display: faviconUrl ? "none" : "block" }}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}