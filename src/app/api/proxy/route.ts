import { NextRequest, NextResponse } from "next/server";

const RAILWAY_URL = "https://orompdfunlock-production.up.railway.app";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const newFormData = new FormData();

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const arrayBuffer = await value.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: value.type || "application/pdf" });
        newFormData.append(key, blob, value.name);
      } else {
        newFormData.append(key, value);
      }
    }

    const response = await fetch(`${RAILWAY_URL}/unlock-pdfs`, {
      method: "POST",
      body: newFormData,
    });

    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("application/zip")) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "X-Unlock-Results": response.headers.get("X-Unlock-Results") || "[]",
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "프록시 오류" },
      { status: 500 }
    );
  }
}
