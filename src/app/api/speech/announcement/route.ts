import { NextRequest, NextResponse } from "next/server";

const TTS_CLIENTS = ["tw-ob", "gtx", "dict-chromeex"];

async function fetchPersianSpeech(text: string): Promise<ArrayBuffer | null> {
  for (const client of TTS_CLIENTS) {
    const url = `https://translate.google.com/translate_tts?${new URLSearchParams({
      ie: "UTF-8",
      client,
      tl: "fa",
      q: text,
    })}`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/",
          Accept: "*/*",
        },
        cache: "no-store",
      });

      if (!response.ok) continue;

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 256) return buffer;
    } catch {
      continue;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text")?.trim() ?? "";
  if (!text) {
    return NextResponse.json({ message: "متن اعلان خالی است." }, { status: 422 });
  }
  if (text.length > 300) {
    return NextResponse.json({ message: "متن اعلان بیش از حد طولانی است." }, { status: 422 });
  }

  const audio = await fetchPersianSpeech(text);
  if (!audio) {
    return NextResponse.json({ message: "سرویس گفتار در دسترس نیست." }, { status: 502 });
  }

  return new NextResponse(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
