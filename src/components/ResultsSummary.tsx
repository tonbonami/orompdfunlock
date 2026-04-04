
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

  return (
    <div className="bg-white rounded-lg border border-border p-6 shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-3">
        {isCompleteSuccess ? (
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        ) : (
          <AlertCircle className="h-6 w-6 text-amber-500" />
        )}
        <h2 className="text-xl font-semibold">Processing Summary</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatItem label="Total" value={summary.total} />
        <StatItem label="Unlocked" value={summary.unlocked} color="text-green-600" />
        <StatItem label="Already Clear" value={summary.alreadyUnlocked} color="text-slate-600" />
        <StatItem label="Wrong Pass" value={summary.wrongPassword} color="text-amber-600" />
        <StatItem label="Failed" value={summary.failed} color="text-red-600" />
      </div>

      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center gap-3">
        <Button
          onClick={onDownloadZip}
          className="w-full sm:flex-1 bg-primary text-white hover:bg-primary/90"
        >
          <FileArchive className="h-4 w-4 mr-2" />
          Download Unlocked Files
        </Button>
        
        {!isCompleteSuccess && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Failed
          </Button>
        )}
        
        <Button
          variant="ghost"
          onClick={onReset}
          className="w-full sm:w-auto text-muted-foreground"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Start Over
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
