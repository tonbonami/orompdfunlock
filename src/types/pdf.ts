
export type PDFStatus = 
  | 'Ready' 
  | 'Processing' 
  | 'Unlocked' 
  | 'Already Unlocked' 
  | 'Wrong Password' 
  | 'Failed';

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

export interface ExportOptions {
  includeLogo: boolean;
  includeDate: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
}
