
import { PDFFile, PDFStatus, ExportOptions } from "@/types/pdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";

/**
 * @fileOverview PDF 처리 서비스
 * - 편집 제한(Owner Password) 및 열기 제한(User Password) 해제 로직 포함
 * - 로고 삽입 및 날짜 삽입 기능
 * - 생성 후 무암호화 상태 검증
 */

export async function processPDF(
  pdfFile: PDFFile,
  options: ExportOptions
): Promise<{ status: PDFStatus; error?: string; blob?: Blob }> {
  try {
    const arrayBuffer = await pdfFile.file.arrayBuffer();
    
    // 1. 암호화 여부 사전 감지 (바이너리 체크)
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder();
    // PDF 헤더 및 카탈로그 영역에서 암호화 딕셔너리 존재 여부 확인
    const isEncrypted = decoder.decode(uint8Array.slice(0, 20000)).includes('/Encrypt');
    
    let sourcePdfDoc: PDFDocument;
    
    try {
      // 먼저 비밀번호 없이 로드 시도
      sourcePdfDoc = await PDFDocument.load(arrayBuffer);
    } catch (e: any) {
      // 로드 실패 시 (암호 필요)
      if (options.password) {
        try {
          sourcePdfDoc = await PDFDocument.load(arrayBuffer, { password: options.password });
        } catch (pwError) {
          return { status: "Wrong Password", error: "입력하신 비밀번호가 틀립니다." };
        }
      } else {
        // 암호가 걸려있는데 입력되지 않음
        return { status: "Wrong Password", error: "파일을 열기 위해 비밀번호가 필요합니다." };
      }
    }

    // 2. 편집 제한을 확실히 풀기 위해 새로운 문서 객체 생성 (Re-serialization)
    // 원본의 페이지를 새 문서로 복사하면 모든 제한 사항(Permissions)이 초기화됩니다.
    const outPdfDoc = await PDFDocument.create();
    const copiedPages = await outPdfDoc.copyPages(sourcePdfDoc, sourcePdfDoc.getPageIndices());
    copiedPages.forEach((page) => outPdfDoc.addPage(page));

    // 3. 브랜딩 적용
    const pages = outPdfDoc.getPages();
    const font = await outPdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await outPdfDoc.embedFont(StandardFonts.Helvetica);
    const today = format(new Date(), "yyyy. M. d.");

    const colorBlue = rgb(0.48, 0.65, 1.0); // OROM Blue
    const colorRed = rgb(1.0, 0.55, 0.55);  // OROM Red

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // 상단 여백 확보 (기존 내용 가리기)
      if (options.includeLogo || options.includeDate) {
        page.drawRectangle({
          x: 0,
          y: height - 40,
          width: width,
          height: 40,
          color: rgb(1, 1, 1),
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

    // 4. 저장 (새로운 무암호화 파일 생성)
    const pdfBytes = await outPdfDoc.save();
    
    if (pdfBytes.length === 0) {
      return { status: "Save Failed", error: "파일 생성 중 오류가 발생했습니다." };
    }

    // 5. 최종 검증: 저장된 파일이 비밀번호 없이 열리는지 확인
    try {
      await PDFDocument.load(pdfBytes);
    } catch (verifyError) {
      return { status: "Verification Failed", error: "잠금 해제 후 파일 검증에 실패했습니다." };
    }

    const processedBlob = new Blob([pdfBytes], { type: "application/pdf" });
    
    // 원래 암호화되어 있었으면 '해제 완료', 아니면 '이미 해제됨'
    const finalStatus: PDFStatus = isEncrypted ? "Unlocked" : "Already Unlocked";

    return { 
      status: finalStatus, 
      blob: processedBlob 
    };
  } catch (err) {
    console.error("PDF processing error:", err);
    return { status: "Failed", error: "지원되지 않는 파일 형식이거나 처리 중 오류가 발생했습니다." };
  }
}
