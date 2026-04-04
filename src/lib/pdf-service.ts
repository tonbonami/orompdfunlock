
import { PDFFile, PDFStatus } from "@/types/pdf";

export async function unlockPDFMock(
  pdf: PDFFile,
  password?: string
): Promise<{ status: PDFStatus; error?: string }> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

  // Logic Simulation:
  // 1. If password is 'error', fail.
  // 2. If password is 'already', say already unlocked.
  // 3. If password is empty, attempt opening (randomly success or fail).
  // 4. If password is provided, attempt check.

  if (pdf.name.toLowerCase().includes("corrupt")) {
    return { status: "Failed", error: "File appears to be corrupted." };
  }

  if (pdf.name.toLowerCase().includes("already")) {
    return { status: "Already Unlocked" };
  }

  if (!password) {
    // Attempting without password
    const rand = Math.random();
    if (rand > 0.7) return { status: "Unlocked" };
    if (rand > 0.4) return { status: "Already Unlocked" };
    return { status: "Wrong Password" };
  }

  // If password provided
  if (password === "wrong") {
    return { status: "Wrong Password" };
  }

  return { status: "Unlocked" };
}
