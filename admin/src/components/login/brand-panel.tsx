import Image from "next/image"
import { cn } from "@/lib/utils"

const LOCKUP = { width: 349, height: 156 } // viewBox of gip-lockup-*.svg

/** Navy lockup above the form below 1024px; the white one on dark backgrounds. */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Image src="/brand/gip-lockup-navy.svg" alt="Greater Infra Projects" {...LOCKUP} className="h-10 w-auto dark:hidden" />
      <Image src="/brand/gip-lockup-white.svg" alt="Greater Infra Projects" {...LOCKUP} className="hidden h-10 w-auto dark:block" />
    </div>
  )
}

/**
 * The one brand moment (visual-direction §9). Same in both themes.
 * Base layer: the real Global City VI master plan as line art, so the panel still reads if the photo fails.
 * Photo layer: decorative generated aerial, so the caption names the company, never a project.
 */
export function BrandPanel({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-[oklch(0.24_0.06_252)]", className)}>
      <div aria-hidden className="absolute inset-0 [mask-image:linear-gradient(to_top,transparent,#000_30%)]">
        <div className="absolute -top-[2%] -right-[4%] aspect-[399.8/584] h-[108%] bg-[oklch(0.9_0.03_245)] opacity-75 [mask:url(/brand/login-plan-fallback.svg)_center/contain_no-repeat]" />
      </div>
      <Image
        src="/brand/login-aerial.jpg"
        alt=""
        fill
        preload
        sizes="(min-width:1024px) 58vw, 0px"
        className="object-cover object-[50%_60%]"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[28%] bg-linear-to-b from-[oklch(0.2_0.05_252/0.55)] to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[40%] bg-linear-to-t from-[oklch(0.2_0.05_252/0.8)] to-transparent" />
      <Image
        src="/brand/gip-lockup-white.svg"
        alt="Greater Infra Projects"
        {...LOCKUP}
        className="absolute top-10 left-10 h-12 w-auto"
      />
      <div className="absolute bottom-10 left-10">
        <p className="text-[15px]/5 font-semibold text-white">Greater Infra Projects</p>
        <p className="mt-0.5 text-xs text-[oklch(0.86_0.03_245)]">Hyderabad · Telangana</p>
      </div>
    </div>
  )
}
