// Adapted from 21st.dev: lavikatiyar/login (demo 9106)
import type { Metadata } from "next"

import { BrandLockup, BrandPanel } from "@/components/login/brand-panel"
import { LoginForm } from "@/components/login/login-form"

export const metadata: Metadata = { title: "Sign in" }

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(420px,5fr)_7fr]">
      <main className="flex flex-col bg-background p-6 sm:p-8">
        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="mx-auto w-full max-w-[360px]">
            <BrandLockup className="mb-10 lg:hidden" />
            <LoginForm />
          </div>
        </div>
        {/* Same column as the form, so its left edge lines up with the fields. */}
        <footer className="mx-auto w-full max-w-[360px] text-xs text-muted-foreground">© 2026 Greater Infra Projects</footer>
      </main>
      <BrandPanel className="hidden lg:block" />
    </div>
  )
}
