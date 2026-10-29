import Image from "next/image";
import type { Profile } from "@/lib/types";
import { cn, getInitials } from "@/lib/utils";

export default function Avatar({
  profile,
  size = 40,
  className,
}: {
  profile: Profile;
  size?: number;
  className?: string;
}) {
  if (profile.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt={profile.username}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-torii to-sakura-400 font-display font-bold text-washi-50",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {getInitials(profile.display_name, profile.username)}
    </div>
  );
}
