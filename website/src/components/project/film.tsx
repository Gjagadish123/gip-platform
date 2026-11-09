"use client";

import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { ImpressionChip } from "@/components/site/plate";
import { cn } from "@/lib/utils";

/**
 * The project's film (set in the admin): muted, looped, its photo as the poster. It plays only while on screen, never
 * on its own under reduced motion, and a pause / play button sits bottom-right. Without a film the photo fills the
 * frame; without either, the navy ground. `className` sizes the frame; `chromeClassName` moves the chip and the
 * button up (the hero lifts them above its fact panel).
 */
export function Film({
  label,
  video,
  poster,
  impression,
  preload,
  className,
  chromeClassName,
  children,
}: {
  label: string;
  video?: string;
  poster?: string;
  /** The film or photo is an artist's impression. */
  impression?: boolean;
  /** Top of the page: load the photo first. */
  preload?: boolean;
  className?: string;
  chromeClassName?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [stopped, setStopped] = useState(false); // the visitor pressed pause
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || stopped) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.pause();
    };
  }, [reduced, stopped, video]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      setStopped(false);
      el.play().catch(() => {});
    } else {
      setStopped(true);
      el.pause();
    }
  };

  return (
    <div className={cn("relative overflow-hidden bg-navy-deep", className)}>
      {video ? (
        <video
          ref={ref}
          src={video}
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          aria-label={label}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : poster ? (
        <Image
          src={poster}
          alt={label}
          fill
          sizes="100vw"
          preload={preload}
          fetchPriority={preload ? "high" : undefined}
          loading={preload ? "eager" : "lazy"}
          className="object-cover"
        />
      ) : null}
      {children}
      <div className={cn("pointer-events-none absolute inset-0", chromeClassName)}>
        {impression ? <ImpressionChip /> : null}
        {video ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause film" : "Play film"}
            className="pointer-events-auto absolute right-3 bottom-3 inline-flex size-9 items-center justify-center rounded-md bg-navy-deep/60 text-white backdrop-blur-sm transition-colors duration-300 ease-(--ease-out) hover:bg-navy-deep/85 focus-visible:outline-white"
          >
            {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
