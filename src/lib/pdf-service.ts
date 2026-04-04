// src/lib/pdf-service.ts
import { PDFFile, PDFStatus, ExportOptions } from "@/types/pdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";

export async function processPDF(
  pdfFile: PDFFile,
  options: ExportOptions
): Promise<{ status: PDFStatus; error?: string; blob?: Blob }> {

  // ── Step 1. qpdf API Route로 실제 잠금 해제 ──────────────────────
  const formData = new FormData();
  formData.append("file", pdfFile.file);
  formData.append("password", options.password || "");

  let unlockedArrayBuffer: ArrayBuffer;
  let wasEncrypted = true;

  try {
    const res = await fetch("/api/unlock", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { status: "Failed", error: data.message || "서버 처리 오류" };
    }

    const contentType = res.headers.get("Content-Type") || "";
    const unlockStatus = res.headers.get("X-Unlock-Status");

    if (contentType.includes("application/json")) {
      // 잠금 해제 불필요 or 오류 케이스
      const data = await res.json();
      if (data.status === "already_unlocked") {
        // 이미 잠금 해제된 파일 → 원본 그대로 사용
        wasEncrypted = false;
        unlockedArrayBuffer = await pdfFile.file.arrayBuffer();
      } else if (data.status === "wrong_password") {
        return { status: "Wrong Password", error: "비밀번호가 올바르지 않습니다." };
      } else if (data.status === "verification_failed") {
        return { status: "Verification Failed", error: "해제 후 검증 실패. 파일이 손상되었을 수 있습니다." };
      } else {
        return { status: "Failed", error: data.message || "알 수 없는 오류" };
      }
    } else {
      // PDF blob 반환 = 잠금 해제 성공
      unlockedArrayBuffer = await res.arrayBuffer();
    }
  } catch (networkErr) {
    return { status: "Failed", error: "API 연결 실패. 서버를 확인해 주세요." };
  }

  // ── Step 2. pdf-lib로 브랜딩 삽입 (선택) ────────────────────────
  try {
    const pdfDoc = await PDFDocument.load(unlockedArrayBuffer);
    const pages  = pdfDoc.getPages();
    const font   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const today  = format(new Date(), "yyyy. M. d.");
    const colorBlue = rgb(0.48, 0.65, 1.0);
    const colorRed  = rgb(1.0,  0.55, 0.55);

    for (const page of pages) {
      const { width, height } = page.getSize();

      if (options.includeLogo || options.includeDate) {
        page.drawRectangle({
          x: 0, y: height - 40,
          width, height: 40,
          color: rgb(1, 1, 1),
        });
      }

      if (options.includeLogo) {
        page.drawText("OROM", {
          x: 25, y: height - 25,
          size: 12, font, color: colorBlue,
        });
        page.drawText("edu", {
          x: 25 + font.widthOfTextAtSize("OROM", 12),
          y: height - 25,
          size: 12, font, color: colorRed,
        });
      }

      if (options.includeDate) {
        const dateTextWidth = regularFont.widthOfTextAtSize(today, 10);
        page.drawText(today, {
          x: width - dateTextWidth - 25,
          y: height - 25,
          size: 10, font: regularFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const finalStatus: PDFStatus = wasEncrypted ? "Unlocked" : "Already Unlocked";
    return { status: finalStatus, blob };

  } catch (brandingErr) {
    // 브랜딩 실패해도 잠금 해제 파일은 반환
    const blob = new Blob([unlockedArrayBuffer], { type: "application/pdf" });
    const finalStatus: PDFStatus = wasEncrypted ? "Unlocked" : "Already Unlocked";
    return { status: finalStatus, blob };
  }
}
