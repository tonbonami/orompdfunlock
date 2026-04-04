import { PDFFile, PDFStatus, ExportOptions } from "@/types/pdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";

const BACKEND_URL = "https://orompdfunlock-production.up.railway.app";

export async function processPDF(
  pdfFile: PDFFile,
  options: ExportOptions
): Promise<{ status: PDFStatus; error?: string; blob?: Blob }> {

  const formData = new FormData();
  formData.append("files", pdfFile.file);
  formData.append("password", options.password || "");

  let unlockedArrayBuffer: ArrayBuffer;
  let wasEncrypted = true;

  try {
    const res = await fetch(`/api/proxy`, {
      method: "POST",
      body: formData,
    });

    const contentType = res.headers.get("Content-Type") || "";

    if (!res.ok || !contentType.includes("application/zip")) {
      const data = await res.json().catch(() => ({}));
      const results = data.results || [];
      const first = results[0];
      if (!first) return { status: "Failed", error: "서버 처리 오류" };

      if (first.status === "wrong_password") return { status: "Wrong Password", error: "비밀번호가 올바르지 않습니다." };
      if (first.status === "verification_failed") return { status: "Verification Failed", error: "검증 실패" };
      if (first.status === "already_unlocked") {
        wasEncrypted = false;
      } else {
        return { status: "Failed", error: first.message || "알 수 없는 오류" };
      }
    }

    if (wasEncrypted) {
      // ZIP에서 PDF 추출
      const zipBlob = await res.blob();
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(zipBlob);
      const files = Object.keys(zip.files);
      if (files.length === 0) return { status: "Failed", error: "ZIP 파일이 비어있습니다." };
      const pdfArrayBuffer = await zip.files[files[0]].async("arraybuffer");
      unlockedArrayBuffer = pdfArrayBuffer;
    } else {
      unlockedArrayBuffer = await pdfFile.file.arrayBuffer();
    }

  } catch (err) {
    return { status: "Failed", error: "API 연결 실패: " + String(err) };
  }

  // 브랜딩 삽입
  try {
    const pdfDoc = await PDFDocument.load(unlockedArrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const today = format(new Date(), "yyyy. M. d.");
    const colorBlue = rgb(0.48, 0.65, 1.0);
    const colorRed = rgb(1.0, 0.55, 0.55);

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

  } catch {
    const blob = new Blob([unlockedArrayBuffer], { type: "application/pdf" });
    const finalStatus: PDFStatus = wasEncrypted ? "Unlocked" : "Already Unlocked";
    return { status: finalStatus, blob };
  }
}
