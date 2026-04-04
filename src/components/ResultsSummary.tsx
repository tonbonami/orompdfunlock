
"use client";

import { CheckCircle2, AlertCircle, RefreshCw, XCircle, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessingSummary } from "@/types/pdf";

interface ResultsSummaryProps {
  summary: ProcessingSummary;
  onRetry: () => void;
  onReset: () => void;
  onDownloadZip: () => void;
}

export function ResultsSummary({ summary, onRetry, onReset, onDownloadZip }: ResultsSummaryProps) {
  const isCompleteSuccess = summary.failed === 0 && summary.wrongPassword === 0;
  const canDownload = summary.unlocked > 0 || summary.alreadyUnlocked > 0;

  return (
    <div className="bg-white rounded-lg border border-border p-6 shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-3">
        {isCompleteSuccess ? (
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        ) : (
          <AlertCircle className="h-6 w-6 text-amber-500" />
        )}
        <h2 className="text-xl font-semibold">처리 결과 요약</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatItem label="전체" value={summary.total} />
        <StatItem label="해제 완료" value={summary.unlocked} color="text-green-600" />
        <StatItem label="이미 해제됨" value={summary.alreadyUnlocked} color="text-slate-600" />
        <StatItem label="비밀번호 오류" value={summary.wrongPassword} color="text-amber-600" />
        <StatItem label="실패" value={summary.failed} color="text-red-600" />
      </div>

      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center gap-3">
        {canDownload && (
          <Button
            onClick={onDownloadZip}
            className="w-full sm:flex-1 bg-primary text-white hover:bg-primary/90"
          >
            <FileArchive className="h-4 w-4 mr-2" />
            잠금 해제된 파일 다운로드
          </Button>
        )}
        
        {!isCompleteSuccess && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            실패한 파일 다시 시도
          </Button>
        )}
        
        <Button
          variant="ghost"
          onClick={onReset}
          className="w-full sm:w-auto text-muted-foreground"
        >
          <XCircle className="h-4 w-4 mr-2" />
          모두 지우고 다시 시작
        </Button>
      </div>
    </div>
  );
}

function StatItem({ label, value, color = "text-foreground" }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}
