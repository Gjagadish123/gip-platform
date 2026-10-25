"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { withBase } from "@/lib/base-path";
import { cn } from "@/lib/utils";

import { usePrefersReducedMotion } from "./hooks";

/**
 * The aerial impression film (muted loop, poster first). It loads and plays only while on screen and stays on its
 * poster under reduced motion until the visitor presses play; a copy hidden by CSS never intersects, so it never
 * downloads. A film without a poster loads its metadata and shows its own first frame (#t=0.1), so the frame is never
 * an empty box, even under reduced motion. `control` places a pause / play button (its classes position it).
 */
export function Film({ src, poster, className, control }: { src: string; poster?: string; className?: string; control?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const [choice, setChoice] = useState<"auto" | "play" | "pause">("auto");
  const playing = choice === "play" || (choice === "auto" && !reduced);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!playing) {
      video.pause();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(video);
    return () => {
      io.disconnect();
      video.pause();
    };
  }, [playing]);

  return (
    <>
      <video
        ref={ref}
        src={poster ? withBase(src) : `${withBase(src)}#t=0.1`}
        poster={poster ? withBase(poster) : undefined}
        muted
        loop
        playsInline
        preload={poster ? "none" : "metadata"}
        aria-hidden
        className={cn("size-full object-cover", className)}
      />
      {control ? (
        <button
          type="button"
          onClick={() => setChoice(playing ? "pause" : "play")}
          aria-label={playing ? "Pause film" : "Play film"}
          className={cn(
            "absolute z-10 inline-flex size-10 items-center justify-center rounded-md bg-navy-deep/55 text-white backdrop-blur-sm transition-colors duration-300 hover:bg-navy-deep/85",
            control,
          )}
        >
          {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
        </button>
      ) : null}
    </>
  );
}
