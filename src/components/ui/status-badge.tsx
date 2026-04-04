
import { cn } from "@/lib/utils";
import { PDFStatus } from "@/types/pdf";

interface StatusBadgeProps {
  status: PDFStatus;
  className?: string;
}

const statusConfig: Record<PDFStatus, { label: string; bg: string; text: string }> = {
  'Ready': { label: '준비됨', bg: 'bg-slate-100', text: 'text-slate-600' },
  'Processing': { label: '처리 중', bg: 'bg-blue-100', text: 'text-blue-600' },
  'Unlocked': { label: '잠금 해제 완료', bg: 'bg-green-100', text: 'text-green-700' },
  'Already Unlocked': { label: '이미 잠금 해제됨', bg: 'bg-slate-200', text: 'text-slate-700' },
  'Wrong Password': { label: '비밀번호 오류', bg: 'bg-amber-100', text: 'text-amber-700' },
  'Failed': { label: '잠금 해제 실패', bg: 'bg-red-100', text: 'text-red-700' },
  'Save Failed': { label: '저장 실패', bg: 'bg-red-100', text: 'text-red-700' },
  'Verification Failed': { label: '검증 실패', bg: 'bg-red-100', text: 'text-red-700' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig['Failed'];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
