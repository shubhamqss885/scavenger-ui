import axios from "axios";

export type TranscriptionResult = Readonly<{
  text: string;
}>;

export const transcribeAudio = async (
  audioBlob: Blob,
  signal?: AbortSignal,
  language?: string,
): Promise<TranscriptionResult> => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.wav");
  if (language) formData.append("language", language);

  const response = await axios.post("/api/transcribe", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    signal,
  });

  if (!response.data?.success) {
    throw new Error(response.data?.error || "Transcription failed");
  }

  return {
    text: (response.data.text ?? "").trim(),
  };
};
