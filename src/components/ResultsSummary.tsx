
"use client";

import { CheckCircle2, AlertCircle, RefreshCw, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessingSummary } from "@/types/pdf";

interface ResultsSummaryProps {
  summary: ProcessingSummary;
  onRetry: () => void;
  onReset: () => void;
  onDownload: () => void;
  format: 'pdf' | 'zip';
}

export function ResultsSummary({ summary, onRetry, onReset, onDownload, format }: ResultsSummaryProps) {
  const isCompleteSuccess = summary.failed === 0 && summary.wrongPassword === 0;
  const canDownload = summary.unlocked > 0 || summary.alreadyUnlocked > 0;

  return (
    <div className="bg-white rounded-lg border border-border p-6 shadow-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-3">
        {isCompleteSuccess ? (
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        ) : (
          <AlertCircle className="h-6 w-6 text-amber-500" />
        )}
        <h2 className="text-lg font-bold">처리 결과 요약</h2>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 border border-border rounded-lg bg-background p-4">
        <StatItem label="전체" value={summary.total} />
        <StatItem label="해제 완료" value={summary.unlocked} color="text-green-600" />
        <StatItem label="이미 해제됨" value={summary.alreadyUnlocked} color="text-slate-500" />
        <StatItem label="비번 오류" value={summary.wrongPassword} color="text-amber-600" />
        <StatItem label="실패" value={summary.failed} color="text-red-600" />
      </div>

      <div className="pt-4 border-t border-border flex flex-col gap-3">
        {canDownload && (
          <Button
            onClick={onDownload}
            className="w-full bg-primary text-white hover:bg-primary/90 font-bold h-11"
          >
            <Download className="h-4 w-4 mr-2" />
            {format === 'pdf' ? '결과 PDF 다운로드' : 'ZIP 파일 다운로드'}
          </Button>
        )}
        
        <div className="flex gap-2">
          {!isCompleteSuccess && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="flex-1 h-10 text-xs font-medium"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              실패 파일 재시도
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={onReset}
            className="flex-1 h-10 text-muted-foreground text-xs font-medium"
          >
            <XCircle className="h-3 w-3 mr-1" />
            처음부터 다시 시작
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color = "text-foreground" }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-[10px] text-muted-foreground font-semibold mb-1 truncate w-full">{label}</span>
      <span className={`text-lg font-extrabold ${color}`}>{value}</span>
    </div>
  );
}
