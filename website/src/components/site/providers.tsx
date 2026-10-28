"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import { EnquiryProvider } from "./enquiry-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <EnquiryProvider>{children}</EnquiryProvider>
    </MotionConfig>
  );
}
