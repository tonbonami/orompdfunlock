
import { cn } from "@/lib/utils";
import { PDFStatus } from "@/types/pdf";

interface StatusBadgeProps {
  status: PDFStatus;
  className?: string;
}

const statusConfig: Record<PDFStatus, { label: string; bg: string; text: string }> = {
  'Ready': { label: 'Ready', bg: 'bg-[#E9ECEF]', text: 'text-[#495057]' },
  'Processing': { label: 'Processing', bg: 'bg-[#DEE2E6]', text: 'text-[#495057]' },
  'Unlocked': { label: 'Unlocked', bg: 'bg-[#D4EDDA]', text: 'text-[#155724]' },
  'Already Unlocked': { label: 'Already Unlocked', bg: 'bg-[#E2E3E5]', text: 'text-[#383D41]' },
  'Wrong Password': { label: 'Wrong Password', bg: 'bg-[#FFF3CD]', text: 'text-[#856404]' },
  'Failed': { label: 'Failed', bg: 'bg-[#F8D7DA]', text: 'text-[#721C24]' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
