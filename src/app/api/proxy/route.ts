import { NextRequest, NextResponse } from "next/server";

const RAILWAY_URL = "https://orompdfunlock-production.up.railway.app";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  
  const response = await fetch(`${RAILWAY_URL}/unlock-pdfs`, {
    method: "POST",
    body: formData,
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
}
