import { useState, useRef, useCallback, useEffect } from "react";
import { transcribeAudio } from "../services/transcriptionService";
// Type-only import: erased at compile time, so it adds nothing to the
// runtime bundle. The package is still loaded lazily via dynamic import()
// inside initializeEncoder()/startRecording() — only when the user clicks
// the mic. This gives us a real type for the recorder + events without
// pulling the package into the main chunk.
import type { IBlobEvent, IMediaRecorder } from "extendable-media-recorder";

const MAX_RECORDING_DURATION_MS = 20 * 60 * 1000;
// Tail buffer: when the user clicks accept, keep capturing for this many
// milliseconds before actually calling recorder.stop(). Compensates for the
// click-ahead-of-final-syllable instinct and gives gpt-4o-transcribe a bit
// more trailing context to land on. Cancel (discard) stays immediate.
const ACCEPT_TAIL_BUFFER_MS = 200;

// The transcription endpoint accepts an ISO-639-1 hint. We only ship EN + DE
// UIs; anything outside that set (or unset) falls back to German per product
// preference.
const SUPPORTED_DICTATION_LANGUAGES = new Set(["en", "de"]);
const DEFAULT_DICTATION_LANGUAGE = "de";

const normalizeDictationLanguage = (
  locale: string | null | undefined,
): string => {
  if (!locale) return DEFAULT_DICTATION_LANGUAGE;
  const base = locale.toLowerCase().split("-")[0];
  return SUPPORTED_DICTATION_LANGUAGES.has(base)
    ? base
    : DEFAULT_DICTATION_LANGUAGE;
};

export type RecordingState = "idle" | "requesting" | "recording" | "processing";

export type RecordingErrorCode =
  | "PERMISSION_DENIED"
  | "NO_MIC"
  | "MIC_IN_USE"
  | "UNSUPPORTED"
  | "ENCODER_FAILED"
  | "TRANSCRIPTION_FAILED"
  | "GENERIC";

export type RecordingErrorEvent = Readonly<{
  code: RecordingErrorCode;
  id: number;
}>;

export type UseAudioRecordingReturn = Readonly<{
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  errorEvent: RecordingErrorEvent | null;
  // Live capture stream — exposed so the waveform can visualize the same
  // stream MediaRecorder is consuming, instead of opening a second
  // getUserMedia. Null when not recording.
  stream: MediaStream | null;
}>;

let encoderRegistered = false;
let encoderInitPromise: Promise<boolean> | null = null;

const initializeEncoder = async (): Promise<boolean> => {
  if (encoderRegistered) return true;
  if (encoderInitPromise) return encoderInitPromise;

  encoderInitPromise = (async () => {
    try {
      const [{ register }, { connect }] = await Promise.all([
        import("extendable-media-recorder"),
        import("extendable-media-recorder-wav-encoder"),
      ]);
      await register(await connect());
      encoderRegistered = true;
      return true;
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("already an encoder stored")
      ) {
        encoderRegistered = true;
        return true;
      }
      console.error("Failed to register WAV encoder:", err);
      return false;
    } finally {
      encoderInitPromise = null;
    }
  })();

  return encoderInitPromise;
};

export const useAudioRecording = (
  onTranscriptionComplete: (text: string) => void,
  locale?: string | null,
): UseAudioRecordingReturn => {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [errorEvent, setErrorEvent] = useState<RecordingErrorEvent | null>(
    null,
  );
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<IMediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcribeAbortRef = useRef<AbortController | null>(null);
  const wasCancelledRef = useRef(false);
  const requestAbortedRef = useRef(false);
  const isMountedRef = useRef(true);
  const errorIdRef = useRef(0);
  const onCompleteRef = useRef(onTranscriptionComplete);
  const localeRef = useRef(locale);
  // Bumped on every startRecording, and on out-of-band idle transitions
  // (cancel during processing). The stop handler captures the value at
  // recorder-creation time and bails if it's been superseded — without this,
  // an old session's transcribe rejection could clobber a new session's state.
  const sessionIdRef = useRef(0);

  useEffect(() => {
    onCompleteRef.current = onTranscriptionComplete;
  }, [onTranscriptionComplete]);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const safeSetState = useCallback((s: RecordingState) => {
    if (isMountedRef.current) setRecordingState(s);
  }, []);

  const teardownStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (isMountedRef.current) setStream(null);
  }, []);

  const clearAutoStop = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }, []);

  const clearPendingStop = useCallback(() => {
    if (pendingStopTimerRef.current) {
      clearTimeout(pendingStopTimerRef.current);
      pendingStopTimerRef.current = null;
    }
  }, []);

  const reportError = useCallback((code: RecordingErrorCode) => {
    console.warn("[useAudioRecording] error:", code);
    errorIdRef.current += 1;
    if (isMountedRef.current) {
      setErrorEvent({ code, id: errorIdRef.current });
      setRecordingState("idle");
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (recordingState !== "idle") return;

    sessionIdRef.current += 1;
    const mySessionId = sessionIdRef.current;

    wasCancelledRef.current = false;
    requestAbortedRef.current = false;
    safeSetState("requesting");

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      reportError("UNSUPPORTED");
      return;
    }

    const encoderReady = await initializeEncoder();

    if (!encoderReady) {
      reportError("ENCODER_FAILED");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
    } catch (err) {
      let code: RecordingErrorCode = "GENERIC";
      const name =
        err instanceof Error
          ? err.name
          : (err as { name?: string } | null)?.name;

      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        code = "NO_MIC";
      } else if (
        name === "NotAllowedError" ||
        name === "PermissionDeniedError" ||
        name === "SecurityError"
      ) {
        code = "PERMISSION_DENIED";
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        code = "MIC_IN_USE";
      }
      reportError(code);
      return;
    }

    // If user pressed cancel/stop while we were waiting on the prompt,
    // tear down the freshly granted stream and bail.
    if (requestAbortedRef.current || !isMountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      safeSetState("idle");
      return;
    }

    streamRef.current = stream;
    setStream(stream);

    try {
      const { MediaRecorder } = await import("extendable-media-recorder");
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/wav",
      });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.addEventListener("dataavailable", (event: IBlobEvent) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      });

      recorder.addEventListener("stop", async () => {
        // If the user cancelled this recording during processing and started
        // a new one, the new session has overwritten our shared refs. Bail
        // before touching anything — otherwise we'd tear down the new
        // session's stream or clobber its state.
        if (mySessionId !== sessionIdRef.current) return;

        clearAutoStop();
        const wasCancelled = wasCancelledRef.current;
        teardownStream();

        if (wasCancelled) {
          audioChunksRef.current = [];
          safeSetState("idle");
          return;
        }

        safeSetState("processing");
        const wavBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        audioChunksRef.current = [];

        const controller = new AbortController();
        transcribeAbortRef.current = controller;

        try {
          const language = normalizeDictationLanguage(localeRef.current);
          const result = await transcribeAudio(
            wavBlob,
            controller.signal,
            language,
          );

          if (mySessionId !== sessionIdRef.current || !isMountedRef.current) {
            return;
          }
          const trimmed = result.text.trim();

          if (trimmed.length > 0) {
            onCompleteRef.current(trimmed);
          }
          safeSetState("idle");
        } catch (err) {
          if (mySessionId !== sessionIdRef.current || !isMountedRef.current) {
            return;
          }
          if (axiosOrFetchAborted(err)) {
            // User cancelled the in-flight transcription; stay quiet.
            safeSetState("idle");
            return;
          }
          console.error("Transcription failed:", err);
          reportError("TRANSCRIPTION_FAILED");
        } finally {
          if (mySessionId === sessionIdRef.current) {
            transcribeAbortRef.current = null;
          }
        }
      });

      recorder.start();
      safeSetState("recording");

      autoStopTimerRef.current = setTimeout(() => {
        const r = mediaRecorderRef.current;

        if (r?.state === "recording") r.stop();
      }, MAX_RECORDING_DURATION_MS);
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      teardownStream();
      reportError("GENERIC");
    }
  }, [
    recordingState,
    safeSetState,
    reportError,
    teardownStream,
    clearAutoStop,
  ]);

  const stopRecording = useCallback(() => {
    clearAutoStop();

    if (recordingState === "requesting") {
      // Permission prompt is open; mark so we discard the stream when it resolves.
      requestAbortedRef.current = true;
      return;
    }

    const r = mediaRecorderRef.current;

    if (r?.state === "recording" && !pendingStopTimerRef.current) {
      wasCancelledRef.current = false;
      // Brief tail buffer — captures a final syllable that the user may
      // still be speaking when they clicked accept. Cancellable: if the
      // user clicks X during this window we abort it in cancelRecording.
      pendingStopTimerRef.current = setTimeout(() => {
        pendingStopTimerRef.current = null;
        const recorder = mediaRecorderRef.current;

        if (recorder?.state === "recording") recorder.stop();
      }, ACCEPT_TAIL_BUFFER_MS);
    }
  }, [recordingState, clearAutoStop]);

  const cancelRecording = useCallback(() => {
    clearAutoStop();
    clearPendingStop();

    if (recordingState === "requesting") {
      requestAbortedRef.current = true;
      return;
    }

    if (recordingState === "processing") {
      // Invalidate the in-flight stop handler before flipping state. Without
      // this bump, when the awaited transcribe rejects with AbortError its
      // catch could race with a new session and call safeSetState("idle")
      // on top of the new recording.
      sessionIdRef.current += 1;
      wasCancelledRef.current = true;
      transcribeAbortRef.current?.abort();
      transcribeAbortRef.current = null;
      safeSetState("idle");
      return;
    }

    const r = mediaRecorderRef.current;

    if (r?.state === "recording") {
      wasCancelledRef.current = true;
      r.stop();
    }
  }, [recordingState, clearAutoStop, clearPendingStop, safeSetState]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearAutoStop();
      clearPendingStop();
      transcribeAbortRef.current?.abort();
      const r = mediaRecorderRef.current;

      if (r && r.state !== "inactive") {
        try {
          r.stop();
        } catch (e) {
          console.error("Error stopping recorder:", e);
        }
      }
      teardownStream();
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    };
  }, [clearAutoStop, clearPendingStop, teardownStream]);

  return {
    recordingState,
    startRecording,
    stopRecording,
    cancelRecording,
    errorEvent,
    stream,
  };
};

const axiosOrFetchAborted = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: string; message?: string };
  return (
    e.name === "AbortError" ||
    e.name === "CanceledError" ||
    e.code === "ERR_CANCELED"
  );
};
