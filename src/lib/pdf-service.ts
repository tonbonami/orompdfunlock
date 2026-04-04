
import { PDFFile, PDFStatus } from "@/types/pdf";

export async function unlockPDFMock(
  pdf: PDFFile,
  password?: string
): Promise<{ status: PDFStatus; error?: string; blob?: Blob }> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

  // Validation simulation
  if (pdf.name.toLowerCase().includes("corrupt")) {
    return { status: "Failed", error: "파일이 손상된 것으로 보입니다." };
  }

  if (pdf.name.toLowerCase().includes("already")) {
    // For "already unlocked", we just return the original file as the "processed" one
    return { status: "Already Unlocked", blob: pdf.file };
  }

  if (!password) {
    // Attempting without password (30% success rate for mock)
    const rand = Math.random();
    if (rand > 0.7) {
      // Simulate success: return the file as a valid blob
      return { status: "Unlocked", blob: pdf.file };
    }
    if (rand > 0.4) {
      return { status: "Already Unlocked", blob: pdf.file };
    }
    return { status: "Wrong Password" };
  }

  // If password provided
  if (password === "wrong") {
    return { status: "Wrong Password" };
  }

  // Final validation step: Simulate "binary content" check
  // In a real app, this is where pikepdf/pdf-lib would process the file
  const mockProcessedBlob = pdf.file; // In mock, we use the original file
  
  if (mockProcessedBlob.size === 0) {
    return { status: "Failed", error: "생성된 파일의 크기가 0바이트입니다." };
  }

  return { status: "Unlocked", blob: mockProcessedBlob };
}
