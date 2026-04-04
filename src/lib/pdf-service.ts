
import { PDFFile, PDFStatus, ExportOptions } from "@/types/pdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";

export async function processPDF(
  pdfFile: PDFFile,
  options: ExportOptions
): Promise<{ status: PDFStatus; error?: string; blob?: Blob }> {
  try {
    // 1. Load the PDF
    const arrayBuffer = await pdfFile.file.arrayBuffer();
    
    // In a real scenario, we'd handle passwords here using pdf-lib or a backend.
    // Since we're mocking the "unlocking" but implementing "branding", 
    // we assume the PDF is accessible.
    
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(arrayBuffer);
    } catch (e) {
      // If it fails to load, it might be password protected and we can't open it in mock
      return { status: "Wrong Password", error: "비밀번호가 필요하거나 지원되지 않는 형식입니다." };
    }

    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const today = format(new Date(), "yyyy. M. d.");

    // Colors
    // orom-blue: #7BA7FF -> rgb(123, 167, 255) -> (0.48, 0.65, 1.0)
    // orom-red: #FF8E8E -> rgb(255, 142, 142) -> (1.0, 0.55, 0.55)
    const colorBlue = rgb(0.48, 0.65, 1.0);
    const colorRed = rgb(1.0, 0.55, 0.55);

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // 2. Clear/Cover top area if branding is requested
      if (options.includeLogo || options.includeDate) {
        page.drawRectangle({
          x: 0,
          y: height - 40,
          width: width,
          height: 40,
          color: rgb(1, 1, 1), // White cover
        });
      }

      // 3. Add Logo
      if (options.includeLogo) {
        // Draw "OROM"
        page.drawText("OROM", {
          x: 25,
          y: height - 25,
          size: 12,
          font: font,
          color: colorBlue,
        });
        // Draw "edu"
        page.drawText("edu", {
          x: 25 + font.widthOfTextAtSize("OROM", 12),
          y: height - 25,
          size: 12,
          font: font,
          color: colorRed,
        });
      }

      // 4. Add Date
      if (options.includeDate) {
        const dateTextWidth = regularFont.widthOfTextAtSize(today, 10);
        page.drawText(today, {
          x: width - dateTextWidth - 25,
          y: height - 25,
          size: 10,
          font: regularFont,
          color: rgb(0.5, 0.5, 0.5), // Muted grey
        });
      }
    }

    // 5. Save and Validate
    const pdfBytes = await pdfDoc.save();
    
    if (pdfBytes.length === 0) {
      return { status: "Failed", error: "파일 생성 중 오류가 발생했습니다." };
    }

    const processedBlob = new Blob([pdfBytes], { type: "application/pdf" });
    
    return { 
      status: "Unlocked", 
      blob: processedBlob 
    };
  } catch (err) {
    console.error("PDF processing error:", err);
    return { status: "Failed", error: "파일을 처리하는 중 예기치 않은 오류가 발생했습니다." };
  }
}
