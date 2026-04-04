
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Unlock, Eye, EyeOff, Loader2, Trash2, Settings2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportOptions } from "@/types/pdf";

interface ActionPanelProps {
  onUnlock: (password: string) => void;
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
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-border p-6 shadow-sm space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="common-password">
            공통 비밀번호 (선택 사항)
          </Label>
          <div className="relative">
            <Input
              id="common-password"
              type={showPassword ? "text" : "password"}
              placeholder="모든 PDF에 적용할 비밀번호 입력..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isProcessing || fileCount === 0}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isProcessing || fileCount === 0}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            variant="outline"
            onClick={onClear}
            disabled={isProcessing || fileCount === 0}
            className="w-full sm:w-auto text-muted-foreground border-muted hover:bg-muted/50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            모두 지우기
          </Button>
          <Button
            onClick={() => onUnlock(password)}
            disabled={isProcessing || fileCount === 0}
            className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-white font-medium"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                PDF 잠금 해제 중...
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                PDF 잠금 해제
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          내보내기 설정
        </button>
        
        {showSettings && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeLogo"
                checked={exportOptions.includeLogo}
                onCheckedChange={(checked) => 
                  onExportOptionsChange({ ...exportOptions, includeLogo: !!checked })
                }
              />
              <Label htmlFor="includeLogo" className="text-sm cursor-pointer">내보내기 파일에 OROMedu 로고 포함</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDate"
                checked={exportOptions.includeDate}
                onCheckedChange={(checked) => 
                  onExportOptionsChange({ ...exportOptions, includeDate: !!checked })
                }
              />
              <Label htmlFor="includeDate" className="text-sm cursor-pointer">내보내기 날짜 포함</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeSummary"
                checked={exportOptions.includeSummary}
                onCheckedChange={(checked) => 
                  onExportOptionsChange({ ...exportOptions, includeSummary: !!checked })
                }
              />
              <Label htmlFor="includeSummary" className="text-sm cursor-pointer">요약 통계 포함</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDetails"
                checked={exportOptions.includeDetails}
                onCheckedChange={(checked) => 
                  onExportOptionsChange({ ...exportOptions, includeDetails: !!checked })
                }
              />
              <Label htmlFor="includeDetails" className="text-sm cursor-pointer">파일별 상세 결과 포함</Label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
