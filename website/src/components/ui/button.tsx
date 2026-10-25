import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Rounded rectangles (10 px), never pills. Navy solid for the one primary action in view, a hairline white button
// beside it, light and outline versions for navy surfaces. A press nudges the button down by a pixel.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent font-sans font-medium tracking-[-0.01em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-300 ease-(--ease-out) outline-hidden select-none active:translate-y-px focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-white shadow-[0_1px_2px_rgb(1_34_63/0.22),inset_0_1px_0_rgb(255_255_255/0.1)] hover:bg-navy-deep",
        secondary: "border-line-strong bg-white text-navy hover:border-navy/35 hover:bg-mist",
        light: "bg-white text-brand hover:bg-mist",
        // Teal: the one primary action on navy surfaces (hero, closes).
        teal: "bg-teal text-navy-deep shadow-[0_1px_2px_rgb(1_20_38/0.3),inset_0_1px_0_rgb(255_255_255/0.25)] hover:bg-[#4fd3c6]",
        "outline-light": "border-white/30 bg-transparent text-white hover:border-white/60 hover:bg-white/8",
        ghost: "text-navy hover:bg-mist",
        link: "h-auto rounded-none border-0 px-0 text-navy link-draw",
      },
      size: {
        default: "h-12 gap-2.5 px-5 text-ui",
        sm: "h-10 gap-2 px-4 text-sm",
        lg: "h-14 gap-3 px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    compoundVariants: [{ variant: "link", class: "h-auto px-0" }],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

/** The arrow inside a button or link: on hover it leaves to the right and a second one enters from the left. */
function Arrow({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-4 shrink-0 overflow-hidden", className)}>
      <ArrowRight className="absolute inset-0 size-4 transition-transform duration-500 ease-(--ease-out) group-hover/button:translate-x-[140%] group-hover/link:translate-x-[140%]" />
      <ArrowRight className="absolute inset-0 size-4 -translate-x-[140%] transition-transform duration-500 ease-(--ease-out) group-hover/button:translate-x-0 group-hover/link:translate-x-0" />
    </span>
  )
}

export { Arrow, Button, buttonVariants }
