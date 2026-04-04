
import { cn } from "@/lib/utils";
import { PDFStatus } from "@/types/pdf";

interface StatusBadgeProps {
  status: PDFStatus;
  className?: string;
}

const statusConfig: Record<PDFStatus, { label: string; bg: string; text: string }> = {
  'Ready': { label: '준비됨', bg: 'bg-[#E9ECEF]', text: 'text-[#495057]' },
  'Processing': { label: '처리 중', bg: 'bg-[#DEE2E6]', text: 'text-[#495057]' },
  'Unlocked': { label: '잠금 해제 완료', bg: 'bg-[#D4EDDA]', text: 'text-[#155724]' },
  'Already Unlocked': { label: '이미 잠금 해제됨', bg: 'bg-[#E2E3E5]', text: 'text-[#383D41]' },
  'Wrong Password': { label: '비밀번호 오류', bg: 'bg-[#FFF3CD]', text: 'text-[#856404]' },
  'Failed': { label: '실패', bg: 'bg-[#F8D7DA]', text: 'text-[#721C24]' },
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
