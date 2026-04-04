
import { cn } from "@/lib/utils";

export function OROMeduLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center font-sans tracking-wide", className)}>
      <span className="text-orom-blue font-semibold">OROM</span>
      <span className="text-orom-red font-semibold">edu</span>
    </div>
  );
}
