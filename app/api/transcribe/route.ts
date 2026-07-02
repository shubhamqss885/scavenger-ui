import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const languageRaw = formData.get("language");
    const language =
      typeof languageRaw === "string" && languageRaw.length > 0
        ? languageRaw
        : null;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "No audio file provided" },
        { status: 400 },
      );
    }

    const endpoint = process.env.OPENAI_TRANSCRIBE_ENDPOINT;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Transcription service not configured" },
        { status: 500 },
      );
    }

    const azureForm = new FormData();
    azureForm.append("file", audioFile);
    if (language) azureForm.append("language", language);

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "api-key": apiKey,
      },
      body: azureForm,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Azure Transcription Error:", errText);
      return NextResponse.json(
        { success: false, error: `Azure error: ${resp.status}` },
        { status: resp.status },
      );
    }

    const json = await resp.json();
    return NextResponse.json({
      success: true,
      text: json.text,
    });
  } catch (error) {
    console.error("Transcription exception:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown transcription error",
      },
      { status: 500 },
    );
  }
}
