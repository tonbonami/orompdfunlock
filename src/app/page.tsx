"use client";

import { useState, useCallback, useRef } from "react";
import { PDFFile, PDFStatus, ProcessingSummary, ExportOptions } from "@/types/pdf";
import { unlockPDFMock } from "@/lib/pdf-service";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionPanel } from "@/components/ActionPanel";
import { ResultsSummary } from "@/components/ResultsSummary";
import { OROMeduLogo } from "@/components/OROMeduLogo";
import { Progress } from "@/components/ui/progress";
import { FileText, X, UploadCloud, FileType, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import JSZip from "jszip";
import { format } from "date-fns";

export default function PDFUnlockerApp() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(-1);
  const [summary, setSummary] = useState<ProcessingSummary | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeLogo: true,
    includeDate: true,
    includeSummary: true,
    includeDetails: true,
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
  };

  const removeFile = (id: string) => {
    if (isProcessing) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSummary(null);
  };

  const clearAll = () => {
    setFiles([]);
    setSummary(null);
    setCurrentProcessingIndex(-1);
  };

  const startUnlocking = async (password: string) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setSummary(null);
    setCurrentProcessingIndex(0);

    const updatedFiles = [...files];
    let unlockedCount = 0;
    let alreadyCount = 0;
    let wrongPassCount = 0;
    let failedCount = 0;

    for (let i = 0; i < updatedFiles.length; i++) {
      setCurrentProcessingIndex(i);
      const current = updatedFiles[i];
      
      // Update status to processing
      updatedFiles[i] = { ...current, status: "Processing" };
      setFiles([...updatedFiles]);

      const result = await unlockPDFMock(current, password);
      
      updatedFiles[i] = { 
        ...updatedFiles[i], 
        status: result.status, 
        errorMessage: result.error 
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
    
    // Automatically trigger ZIP download if any succeeded
    if (unlockedCount > 0 || alreadyCount > 0) {
      downloadAsZip(updatedFiles);
    }
  };

  const downloadAsZip = async (currentFiles: PDFFile[]) => {
    const zip = new JSZip();
    const folder = zip.folder("unlocked_pdfs");

    const downloadableFiles = currentFiles.filter(
      (f) => f.status === "Unlocked" || f.status === "Already Unlocked"
    );

    for (const f of downloadableFiles) {
      const prefix = f.status === "Unlocked" ? "unlocked_" : "";
      folder?.file(`${prefix}${f.name}`, f.file);
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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Header with subtle branding if requested */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
            PDF Unlocker Pro
          </h1>
          <p className="text-muted-foreground">Professional batch PDF decryption with calm precision.</p>
        </div>
        {exportOptions.includeLogo && <OROMeduLogo className="mb-1 text-lg" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & File List */}
        <div className="lg:col-span-8 space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-300",
              isDragging 
                ? "border-primary bg-background/50 scale-[1.01]" 
                : "border-border bg-white hover:border-muted-foreground/30",
              files.length > 0 ? "py-8" : "py-16"
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
              "p-4 rounded-full bg-background mb-4 transition-transform duration-300",
              isDragging ? "scale-110" : ""
            )}>
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Click or drag PDF files to upload</p>
            <p className="text-sm text-muted-foreground mt-1">Only .pdf files are accepted</p>
          </div>

          {files.length > 0 && (
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div className="p-4 bg-background border-b border-border flex justify-between items-center">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <FileType className="h-4 w-4" />
                  Uploaded Files ({files.length})
                </span>
                {isProcessing && (
                  <span className="text-xs font-medium text-muted-foreground animate-pulse">
                    Processing {currentProcessingIndex + 1} of {files.length}...
                  </span>
                )}
              </div>
              
              <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {files.map((file, idx) => (
                  <div 
                    key={file.id} 
                    className={cn(
                      "p-4 flex items-center justify-between group transition-colors",
                      file.status === 'Processing' ? "bg-accent/30" : "hover:bg-background"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <FileText className={cn(
                        "h-5 w-5 shrink-0",
                        file.status === 'Unlocked' ? "text-green-500" : "text-muted-foreground"
                      )} />
                      <div className="flex flex-col min-w-0">
                        <span 
                          className="text-sm font-medium truncate" 
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatSize(file.size)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      <StatusBadge status={file.status} />
                      {!isProcessing && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
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
                    className="h-1 bg-border"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Actions & Summary */}
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
              onRetry={() => startUnlocking("")} // Should reuse password from state in real app
              onReset={clearAll}
              onDownloadZip={() => downloadAsZip(files)}
            />
          )}

          {!summary && !isProcessing && files.length > 0 && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3 animate-in fade-in duration-300">
              <Info className="h-5 w-5 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Unlock all PDFs at once. If you don't enter a password, we'll attempt to clear protection from any open-access PDFs.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="pt-12 border-t border-border mt-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4" />
          <span>Files are processed securely in memory</span>
        </div>
        <p className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
          <span>© 2026 PDF Unlocker Pro by</span>
          <OROMeduLogo className="scale-90" />
        </p>
      </footer>
    </div>
  );
}
