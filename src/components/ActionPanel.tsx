
"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Unlock, Loader2, Trash2, CheckCircle2, FileType, FileArchive, KeyRound } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ExportOptions, DownloadFormat } from "@/types/pdf";

interface ActionPanelProps {
  onUnlock: () => void;
  onClear: () => void;
  isProcessing: boolean;
  fileCount: number;
  exportOptions: ExportOptions;
  onExportOptionsChange: (options: ExportOptions) => void;
}

export function ActionPanel({
  onUnlock,
  onClear,
  isProcessing,
  fileCount,
  exportOptions,
  onExportOptionsChange
}: ActionPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-border p-6 shadow-sm space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
          <Unlock className="h-4 w-4" />
          작업 실행
        </h3>
        <div className="flex flex-col gap-3">
          <Button
            onClick={onUnlock}
            disabled={isProcessing || fileCount === 0}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-md transition-all active:scale-[0.98]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Unlock className="h-5 w-5 mr-2" />
                PDF 잠금 해제 시작
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClear}
            disabled={isProcessing || fileCount === 0}
            className="w-full text-muted-foreground border-border hover:bg-muted/30 h-10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            모두 지우기
          </Button>
        </div>
      </div>

      <div className="pt-6 border-t border-border space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          내보내기 설정
        </h3>
        
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="space-y-2">
            <Label htmlFor="pdf-password" className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <KeyRound className="h-3 w-3" />
              비밀번호 (필요한 경우 입력)
            </Label>
            <Input
              id="pdf-password"
              type="password"
              placeholder="파일 열기 비밀번호"
              className="h-9 text-sm"
              value={exportOptions.password || ''}
              onChange={(e) => onExportOptionsChange({ ...exportOptions, password: e.target.value })}
              disabled={isProcessing}
            />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="includeLogo"
              checked={exportOptions.includeLogo}
              onCheckedChange={(checked) => 
                onExportOptionsChange({ ...exportOptions, includeLogo: !!checked })
              }
            />
            <Label htmlFor="includeLogo" className="text-sm font-medium cursor-pointer leading-none">
              OROMedu 로고 포함
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="includeDate"
              checked={exportOptions.includeDate}
              onCheckedChange={(checked) => 
                onExportOptionsChange({ ...exportOptions, includeDate: !!checked })
              }
            />
            <Label htmlFor="includeDate" className="text-sm font-medium cursor-pointer leading-none">
              내보내기 날짜 포함
            </Label>
          </div>

          <div className="space-y-3 pt-1">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">다운로드 형식</Label>
            <RadioGroup 
              value={exportOptions.downloadFormat} 
              onValueChange={(val) => onExportOptionsChange({ ...exportOptions, downloadFormat: val as DownloadFormat })}
              className="grid grid-cols-1 gap-2"
            >
              <div 
                className={`flex items-center space-x-3 rounded-md border p-3 transition-colors cursor-pointer ${exportOptions.downloadFormat === 'pdf' ? 'bg-primary/5 border-primary/20' : 'border-border hover:bg-accent/30'}`}
                onClick={() => onExportOptionsChange({ ...exportOptions, downloadFormat: 'pdf' })}
              >
                <RadioGroupItem value="pdf" id="format-pdf" />
                <Label htmlFor="format-pdf" className="flex flex-1 items-center gap-2 cursor-pointer text-sm font-medium">
                  <FileType className="h-4 w-4 text-blue-500" />
                  PDF로 받기 (개별)
                </Label>
              </div>
              <div 
                className={`flex items-center space-x-3 rounded-md border p-3 transition-colors cursor-pointer ${exportOptions.downloadFormat === 'zip' ? 'bg-primary/5 border-primary/20' : 'border-border hover:bg-accent/30'}`}
                onClick={() => onExportOptionsChange({ ...exportOptions, downloadFormat: 'zip' })}
              >
                <RadioGroupItem value="zip" id="format-zip" />
                <Label htmlFor="format-zip" className="flex flex-1 items-center gap-2 cursor-pointer text-sm font-medium">
                  <FileArchive className="h-4 w-4 text-amber-500" />
                  ZIP 파일로 받기 (압축)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
