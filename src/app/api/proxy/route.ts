import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BACKEND_URL = process.env.RAILWAY_BACKEND_URL;

export async function POST(req: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { error: 'RAILWAY_BACKEND_URL 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const incomingForm = await req.formData();
    const outgoingForm = new FormData();

    for (const [key, value] of incomingForm.entries()) {
      if (value instanceof File) {
        outgoingForm.append(key, value, value.name);
      } else {
        outgoingForm.append(key, value);
      }
    }

    const upstream = await fetch(`${BACKEND_URL}/unlock-pdfs`, {
      method: 'POST',
      body: outgoingForm,
      cache: 'no-store',
    });

    const contentType = upstream.headers.get('content-type') ?? '';
    const contentDisposition = upstream.headers.get('content-disposition') ?? '';

    if (
      contentType.includes('application/pdf') ||
      contentType.includes('application/zip') ||
      contentDisposition.includes('attachment')
    ) {
      const arrayBuffer = await upstream.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        status: upstream.status,
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
          ...(contentDisposition ? { 'Content-Disposition': contentDisposition } : {}),
          'X-Unlock-Results': upstream.headers.get('X-Unlock-Results') || '[]',
          'Cache-Control': 'no-store',
        },
      });
    }

    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': contentType || 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('[proxy route error]', error);
    return NextResponse.json(
      {
        error: '프록시 서버 오류',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
