
export type PDFStatus = 
  | 'Ready' 
  | 'Processing' 
  | 'Unlocked'          // 잠금 해제 완료
  | 'Already Unlocked'  // 이미 잠금 해제됨
  | 'Wrong Password'    // 비밀번호 오류
  | 'Failed'            // 잠금 해제 실패
  | 'Save Failed'       // 저장 실패
  | 'Verification Failed'; // 검증 실패

export interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: PDFStatus;
  errorMessage?: string;
  unlockedBlob?: Blob; // Stores the processed file content
}

export interface ProcessingSummary {
  total: number;
  unlocked: number;
  alreadyUnlocked: number;
  wrongPassword: number;
  failed: number;
}

export type DownloadFormat = 'pdf' | 'zip';

export interface ExportOptions {
  includeLogo: boolean;
  includeDate: boolean;
  downloadFormat: DownloadFormat;
  password?: string;
}
