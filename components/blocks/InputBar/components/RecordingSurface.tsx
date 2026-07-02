"use client";

import { useEffect, useRef, useState } from "react";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { RecordingState } from "@/lib/hooks/useAudioRecording";

type Props = Readonly<{
  recordingState: RecordingState;
  stream?: MediaStream | null;
}>;

const formatDuration = (ms: number): string => {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");

  return `${m}:${s}`;
};

export const RecordingSurface = ({ recordingState, stream }: Props) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (recordingState !== "recording") {
      startedAtRef.current = null;

      return;
    }
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    const id = setInterval(() => {
      if (startedAtRef.current) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
    }, 250);

    return () => clearInterval(id);
  }, [recordingState]);

  const isActive = recordingState === "recording";
  const isProcessing = recordingState === "processing";

  return (
    <div className="relative h-14 min-h-14 w-full bg-slate-50 p-2">
      <LiveWaveform
        active={isActive}
        processing={isProcessing}
        stream={stream ?? null}
        mode="static"
        height="100%"
        barWidth={3}
        barGap={2}
        barRadius={1.5}
        fadeEdges
        className="text-primary"
      />
      <span className="rounded pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 bg-slate-50/80 px-1 font-mono text-xs tabular-nums text-slate-500">
        {formatDuration(elapsedMs)}
      </span>
    </div>
  );
};
