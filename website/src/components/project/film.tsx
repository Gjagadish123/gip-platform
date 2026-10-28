"use client";

import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { ImpressionChip } from "@/components/site/plate";
import { withBase } from "@/lib/base-path";
import { cn } from "@/lib/utils";

/**
 * The aerial film (an artist's impression): muted, looped, poster first, phones get the portrait cut. It plays only
 * while on screen, never on its own under reduced motion, and a pause / play button sits bottom-right. `className`
 * sizes the frame; `chromeClassName` moves the chip and the button up (the hero lifts them above its fact panel).
 */
export function Film({
  label,
  className,
  chromeClassName,
  children,
}: {
  label: string;
  className?: string;
  chromeClassName?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [stopped, setStopped] = useState(false); // the visitor pressed pause
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || reduced || stopped) return;
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
  }, [reduced, stopped]);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      setStopped(false);
      video.play().catch(() => {});
    } else {
      setStopped(true);
      video.pause();
    }
  };

  return (
    <div className={cn("relative overflow-hidden bg-navy-deep", className)}>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="metadata"
        poster={withBase("/media/hero-film-poster.webp")}
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 size-full object-cover"
      >
        <source media="(max-width: 767px)" src={withBase("/media/hero-film-mobile.mp4")} type="video/mp4" />
        <source src={withBase("/media/hero-film.mp4")} type="video/mp4" />
      </video>
      {children}
      <div className={cn("pointer-events-none absolute inset-0", chromeClassName)}>
        <ImpressionChip />
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause film" : "Play film"}
          className="pointer-events-auto absolute right-3 bottom-3 inline-flex size-9 items-center justify-center rounded-md bg-navy-deep/60 text-white backdrop-blur-sm transition-colors duration-300 ease-(--ease-out) hover:bg-navy-deep/85 focus-visible:outline-white"
        >
          {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
        </button>
      </div>
    </div>
  );
}
