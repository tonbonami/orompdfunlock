
"use client";

import { useState, useCallback, useRef } from "react";
import { PDFFile, ProcessingSummary, ExportOptions } from "@/types/pdf";
import { processPDF } from "@/lib/pdf-service";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionPanel } from "@/components/ActionPanel";
import { ResultsSummary } from "@/components/ResultsSummary";
import { OROMeduLogo } from "@/components/OROMeduLogo";
import { Progress } from "@/components/ui/progress";
import { FileText, X, UploadCloud, FileType, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import JSZip from "jszip";
import { format } from "date-fns";

export default function PDFUnlockerApp() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(-1);
  const [summary, setSummary] = useState<ProcessingSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string[] | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeLogo: true,
    includeDate: true,
    downloadFormat: 'pdf',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const pdfs: PDFFile[] = Array.from(newFiles)
      .filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"))
      .map((f) => ({
        id: Math.random().toString(36).substring(7),
        file: f,
        name: f.name,
        size: f.size,
        status: "Ready",
      }));
    
    setFiles((prev) => [...prev, ...pdfs]);
    setSummary(null);
    setErrorMsg(null);
  };

  const removeFile = (id: string) => {
    if (isProcessing) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSummary(null);
    setErrorMsg(null);
  };

  const clearAll = () => {
    setFiles([]);
    setSummary(null);
    setErrorMsg(null);
    setCurrentProcessingIndex(-1);
  };

  const startUnlocking = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setSummary(null);
    setErrorMsg(null);
    setCurrentProcessingIndex(0);

    const updatedFiles = [...files];
    let unlockedCount = 0;
    let alreadyCount = 0;
    let wrongPassCount = 0;
    let failedCount = 0;

    for (let i = 0; i < updatedFiles.length; i++) {
      setCurrentProcessingIndex(i);
      const current = updatedFiles[i];
      
      updatedFiles[i] = { ...current, status: "Processing" };
      setFiles([...updatedFiles]);

      const result = await processPDF(current, exportOptions);
      
      updatedFiles[i] = { 
        ...updatedFiles[i], 
        status: result.status, 
        errorMessage: result.error,
        unlockedBlob: result.blob
      };

      if (result.status === "Unlocked") unlockedCount++;
      else if (result.status === "Already Unlocked") alreadyCount++;
      else if (result.status === "Wrong Password") wrongPassCount++;
      else failedCount++;

      setFiles([...updatedFiles]);
    }

    const finalSummary: ProcessingSummary = {
      total: files.length,
      unlocked: unlockedCount,
      alreadyUnlocked: alreadyCount,
      wrongPassword: wrongPassCount,
      failed: failedCount,
    };

    setSummary(finalSummary);
    setIsProcessing(false);
    setCurrentProcessingIndex(-1);
    
    if (unlockedCount === 0 && alreadyCount === 0) {
      setErrorMsg([
        "유효한 PDF를 잠금 해제할 수 없습니다.",
        "일부 파일이 암호로 보호되어 있거나 손상되었을 수 있습니다.",
        "파일의 형식을 확인한 후 다시 시도해 주세요."
      ]);
    } else {
      handleDownload(updatedFiles);
    }
  };

  const handleDownload = (currentFiles: PDFFile[]) => {
    if (exportOptions.downloadFormat === 'zip') {
      downloadAsZip(currentFiles);
    } else {
      downloadAsPDFs(currentFiles);
    }
  };

  const downloadAsPDFs = (currentFiles: PDFFile[]) => {
    const downloadableFiles = currentFiles.filter(
      (f) => (f.status === "Unlocked" || f.status === "Already Unlocked") && 
             f.unlockedBlob && f.unlockedBlob.size > 0
    );

    downloadableFiles.forEach((f, idx) => {
      // Small delay between triggers to help some browsers handle multiple downloads
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(f.unlockedBlob!);
        link.download = `unlocked_${f.name}`;
        link.click();
      }, idx * 300);
    });
  };

  const downloadAsZip = async (currentFiles: PDFFile[]) => {
    const zip = new JSZip();
    const downloadableFiles = currentFiles.filter(
      (f) => (f.status === "Unlocked" || f.status === "Already Unlocked") && 
             f.unlockedBlob && f.unlockedBlob.size > 0
    );

    if (downloadableFiles.length === 0) return;

    for (const f of downloadableFiles) {
      zip.file(`unlocked_${f.name}`, f.unlockedBlob!);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `unlocked_pdfs_${format(new Date(), "yyyyMMdd_HHmm")}.zip`;
    link.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
            PDF Unlocker Pro
          </h1>
          <p className="text-muted-foreground">전문가용 배치 PDF 잠금 해제 및 브랜딩 도구</p>
        </div>
        <OROMeduLogo className="mb-1 text-2xl" />
      </div>

      {errorMsg && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 font-bold">처리 실패</AlertTitle>
          <AlertDescription className="text-red-700 mt-2 space-y-1">
            {errorMsg.map((msg, i) => (
              <p key={i}>• {msg}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-300 min-h-[300px]",
              isDragging 
                ? "border-primary bg-primary/5 scale-[1.01]" 
                : "border-border bg-white hover:border-muted-foreground/30",
            )}
          >
            <input
              type="file"
              multiple
              accept=".pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => handleFileUpload(e.target.files)}
              ref={fileInputRef}
            />
            <div className={cn(
              "p-5 rounded-full bg-background mb-4 transition-transform duration-300 shadow-sm",
              isDragging ? "scale-110" : ""
            )}>
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold">PDF 파일을 클릭하거나 여기로 드래그하세요</p>
            <p className="text-sm text-muted-foreground mt-1">.pdf 파일만 안전하게 처리 가능합니다</p>
          </div>

          {files.length > 0 && (
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div className="p-4 bg-background border-b border-border flex justify-between items-center">
                <span className="text-sm font-bold flex items-center gap-2">
                  <FileType className="h-4 w-4" />
                  업로드된 파일 목록 ({files.length})
                </span>
                {isProcessing && (
                  <span className="text-xs font-bold text-primary animate-pulse">
                    처리 중: {currentProcessingIndex + 1} / {files.length}
                  </span>
                )}
              </div>
              
              <div className="divide-y divide-border max-h-[450px] overflow-y-auto">
                {files.map((file) => (
                  <div 
                    key={file.id} 
                    className={cn(
                      "p-4 flex items-center justify-between group transition-colors",
                      file.status === 'Processing' ? "bg-primary/5" : "hover:bg-background"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <FileText className={cn(
                        "h-5 w-5 shrink-0",
                        (file.status === 'Unlocked' || file.status === 'Already Unlocked') ? "text-green-500" : "text-muted-foreground"
                      )} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatSize(file.size)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      <StatusBadge status={file.status} />
                      {!isProcessing && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isProcessing && (
                <div className="p-4 bg-background/50">
                  <Progress 
                    value={((currentProcessingIndex + 1) / files.length) * 100} 
                    className="h-2 bg-border"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          <ActionPanel
            fileCount={files.length}
            isProcessing={isProcessing}
            onUnlock={startUnlocking}
            onClear={clearAll}
            exportOptions={exportOptions}
            onExportOptionsChange={setExportOptions}
          />

          {summary && (
            <ResultsSummary
              summary={summary}
              onRetry={startUnlocking} 
              onReset={clearAll}
              onDownload={() => handleDownload(files)}
              format={exportOptions.downloadFormat}
            />
          )}

          {!summary && !isProcessing && files.length > 0 && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3 animate-in fade-in duration-300">
              <Info className="h-5 w-5 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 font-medium leading-relaxed">
                'PDF 잠금 해제 시작'을 누르면 설정된 방식에 따라 파일을 즉시 처리합니다.
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="pt-12 border-t border-border mt-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>파일은 메모리 내에서 안전하게 처리되며 서버에 저장되지 않습니다</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
          <span>© 2026 PDF Unlocker Pro by</span>
          <OROMeduLogo className="scale-90" />
        </div>
      </footer>
    </div>
  );
}
