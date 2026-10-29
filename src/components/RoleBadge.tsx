import type { UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";

const styles: Record<UserRole, string> = {
  shogun: "border-kin/60 bg-kin/10 text-kin",
  samurai: "border-torii/60 bg-torii/10 text-torii-400",
  ronin: "border-washi-50/20 bg-washi-50/5 text-washi-100",
};

export default function RoleBadge({
  role,
  className,
}: {
  role: UserRole;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        styles[role],
        className
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
