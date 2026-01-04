import { useState } from "react";
import { cn } from "@/lib/utils";

interface SubscriptionIconProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  iconUrl?: string | null;
}

export function SubscriptionIcon({ name, className, size = "md", iconUrl }: SubscriptionIconProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg"
  };

  if (iconUrl && !imageError) {
    return (
      <div className={cn("relative rounded-full overflow-hidden shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700", sizeClasses[size], className)}>
        <img 
          src={iconUrl} 
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }
}