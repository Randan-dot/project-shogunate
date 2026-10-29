import { cn } from "@/lib/utils";

export default function KatanaDivider({ className }: { className?: string }) {
  return (
    <div className={cn("katana-divider", className)} aria-hidden="true">
      <svg
        viewBox="0 0 40 40"
        className="h-7 w-7 -rotate-[35deg] text-torii"
        fill="currentColor"
      >
        {/* blade */}
        <path d="M20 1 L23 8 L22 27 L18 27 L17 8 Z" />
        {/* tsuba — guard */}
        <rect x="14" y="27" width="12" height="3" rx="1" />
        {/* tsuka — handle */}
        <rect x="16.5" y="30" width="7" height="9" rx="1.5" />
      </svg>
    </div>
  );
}
