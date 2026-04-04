// src/app/api/unlock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);
const QPDF_PATH = "/nix/store/gzrgjf2ig2sy3w6w8rrb33jahgd6mgzl-qpdf-11.6.1/bin/qpdf";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const password = (formData.get("password") as string) || "";

  if (!file) {
    return NextResponse.json({ status: "error", message: "파일 없음" }, { status: 400 });
  }

  const id = randomUUID();
  const inputPath  = join(tmpdir(), `${id}_input.pdf`);
  const outputPath = join(tmpdir(), `${id}_output.pdf`);

  try {
    // 1. 업로드 파일을 임시 경로에 저장
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(inputPath, Buffer.from(arrayBuffer));

    // 2. 암호화 여부 먼저 확인
    let isEncrypted = false;
    try {
      const { stdout } = await execFileAsync(QPDF_PATH, ["--show-encryption", inputPath]);
      // "File is not encrypted" 가 없으면 암호화된 것
      isEncrypted = !stdout.includes("File is not encrypted");
    } catch (e: any) {
      // qpdf가 에러를 던지면 암호화된 파일
      isEncrypted = true;
    }

    // 3. 이미 잠금 해제된 파일
    if (!isEncrypted) {
      await unlink(inputPath).catch(() => {});
      return NextResponse.json({ status: "already_unlocked" });
    }

    // 4. qpdf로 잠금 해제 시도
    const args = [
      "--decrypt",
      ...(password ? [`--password=${password}`] : []),
      inputPath,
      outputPath,
    ];

    try {
      await execFileAsync(QPDF_PATH, args);
    } catch (e: any) {
      // exit code 2 = 비밀번호 오류
      const stderr = e.stderr || e.message || "";
      if (stderr.includes("invalid password") || e.code === 2) {
        return NextResponse.json({ status: "wrong_password" });
      }
      return NextResponse.json({ status: "failed", message: stderr });
    }

    // 5. 출력 파일 검증 — 비밀번호 없이 열리는지 재확인
    try {
      await execFileAsync(QPDF_PATH, ["--check", outputPath]);
    } catch {
      return NextResponse.json({ status: "verification_failed" });
    }

    // 6. 출력 파일 읽어서 반환
    const outputBuffer = await readFile(outputPath);
    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "X-Unlock-Status": "unlocked",
      },
    });

  } finally {
    // 임시 파일 정리
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}
