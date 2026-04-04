
import { PDFFile, PDFStatus, ExportOptions } from "@/types/pdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";

export async function processPDF(
  pdfFile: PDFFile,
  options: ExportOptions
): Promise<{ status: PDFStatus; error?: string; blob?: Blob }> {
  try {
    const arrayBuffer = await pdfFile.file.arrayBuffer();
    
    // 1. Detect if the source PDF is encrypted/locked
    // Standard PDF check: Search for '/Encrypt' in the first few thousand bytes
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder();
    const isEncrypted = decoder.decode(uint8Array.slice(0, 10000)).includes('/Encrypt');
    
    let pdfDoc;
    try {
      // Try loading without password first
      pdfDoc = await PDFDocument.load(arrayBuffer);
    } catch (e: any) {
      // If failed, try with provided password
      if (options.password) {
        try {
          pdfDoc = await PDFDocument.load(arrayBuffer, { password: options.password });
        } catch (pwError) {
          return { status: "Wrong Password", error: "비밀번호가 올바르지 않습니다." };
        }
      } else {
        // Encrypted but no password provided
        return { status: "Wrong Password", error: "이 파일은 비밀번호가 필요합니다." };
      }
    }

    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const today = format(new Date(), "yyyy. M. d.");

    // OROMedu colors
    const colorBlue = rgb(0.48, 0.65, 1.0); // Soft Blue
    const colorRed = rgb(1.0, 0.55, 0.55);  // Soft Red

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Branding: Cover top-left and top-right if needed
      if (options.includeLogo || options.includeDate) {
        page.drawRectangle({
          x: 0,
          y: height - 40,
          width: width,
          height: 40,
          color: rgb(1, 1, 1), // White patch to avoid overlap
        });
      }

      if (options.includeLogo) {
        page.drawText("OROM", {
          x: 25,
          y: height - 25,
          size: 12,
          font: font,
          color: colorBlue,
        });
        page.drawText("edu", {
          x: 25 + font.widthOfTextAtSize("OROM", 12),
          y: height - 25,
          size: 12,
          font: font,
          color: colorRed,
        });
      }

      if (options.includeDate) {
        const dateTextWidth = regularFont.widthOfTextAtSize(today, 10);
        page.drawText(today, {
          x: width - dateTextWidth - 25,
          y: height - 25,
          size: 10,
          font: regularFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }

    // Save decrypted & branded PDF
    const pdfBytes = await pdfDoc.save();
    
    if (pdfBytes.length === 0) {
      return { status: "Save Failed", error: "파일 저장 중 오류가 발생했습니다." };
    }

    // 2. Verification Step: Try to reopen without password
    try {
      await PDFDocument.load(pdfBytes);
    } catch (verifyError) {
      return { status: "Verification Failed", error: "잠금 해제 후 파일 검증에 실패했습니다." };
    }

    const processedBlob = new Blob([pdfBytes], { type: "application/pdf" });
    
    // 3. Status logic: Truly Unlocked vs Already Unlocked
    // If it was originally encrypted but now opens without password -> Unlocked
    // If it was never encrypted -> Already Unlocked
    const finalStatus: PDFStatus = isEncrypted ? "Unlocked" : "Already Unlocked";

    return { 
      status: finalStatus, 
      blob: processedBlob 
    };
  } catch (err) {
    console.error("PDF processing error:", err);
    return { status: "Failed", error: "알 수 없는 오류가 발생했습니다." };
  }
}
