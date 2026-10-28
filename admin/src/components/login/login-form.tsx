// Adapted from 21st.dev: lavikatiyar/login (demo 9106)
"use client"

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useDemo } from "@/lib/store"
import { BACKEND } from "@/lib/supabase/client"

type Errors = { username?: string; password?: string }

const PENDING_MS = 400 // demo only: a short pending state so the sign-in reads as real
const noSubscribe = () => () => {}

/**
 * Supabase mode: email + password against Supabase Auth; a wrong pair shows under the password.
 * Demo: validates presence, shows a short pending state, stores the name. Both open the dashboard.
 */
export function LoginForm() {
  const router = useRouter()
  const { actions, hydrated, signedIn } = useDemo()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // False in the server HTML until React owns the form: a native submit before then would send the email and
  // password to the server. A disabled default button also stops Enter from submitting. The form's
  // autoComplete="off" stops Firefox restoring the button's enabled state on reload (fields keep their own tokens),
  // and method="post" keeps any early submit out of the URL.
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false)

  // Already signed in (Supabase mode): straight to the dashboard.
  useEffect(() => {
    if (BACKEND && hydrated && signedIn) router.replace("/dashboard")
  }, [hydrated, signedIn, router])

  useEffect(() => {
    usernameRef.current?.focus()
    router.prefetch("/dashboard")
    return () => {
      // Next keeps this route mounted (hidden) after leaving it, so "Sign out" would land on a
      // still-pending form with the old password. Reset on hide; the username is kept like a browser would.
      clearTimeout(timer.current)
      setPending(false)
      setPassword("")
      setShowPassword(false)
      setErrors({})
    }
  }, [router])

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    const next: Errors = {
      username: username.trim() ? undefined : BACKEND ? "Enter your email" : "Enter your username",
      password: password ? undefined : "Enter your password",
    }
    setErrors(next)
    if (next.username) return usernameRef.current?.focus()
    if (next.password) return passwordRef.current?.focus()
    setPending(true)
    if (!BACKEND) {
      timer.current = setTimeout(() => {
        actions.setSession(username)
        router.push("/dashboard")
      }, PENDING_MS)
      return
    }
    void actions.signIn(username, password).then((error) => {
      if (!error) return router.push("/dashboard")
      setPending(false)
      setErrors({ password: error })
      passwordRef.current?.focus()
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.015em] text-balance">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">GIP admin console</p>

      <form method="post" autoComplete="off" noValidate onSubmit={onSubmit} className="mt-6">
        <FieldGroup className="gap-4">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="username">{BACKEND ? "Email" : "Username"}</FieldLabel>
            <Input
              ref={usernameRef}
              id="username"
              name="username"
              type={BACKEND ? "email" : "text"}
              autoComplete={BACKEND ? "email" : "username"}
              autoCapitalize="none"
              spellCheck={false}
              className="h-9"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (errors.username) setErrors((er) => ({ ...er, username: undefined }))
              }}
              aria-invalid={!!errors.username || undefined}
              aria-describedby={errors.username ? "username-error" : undefined}
            />
            <FieldError id="username-error" className="text-xs">
              {errors.username}
            </FieldError>
          </Field>

          <Field className="gap-1.5">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <InputGroup className="h-9">
              <InputGroupInput
                ref={passwordRef}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((er) => ({ ...er, password: undefined }))
                }}
                aria-invalid={!!errors.password || undefined}
                aria-describedby={errors.password ? "password-error password-help" : "password-help"}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-controls="password"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FieldError id="password-error" className="text-xs">
              {errors.password}
            </FieldError>
            <FieldDescription id="password-help" className="text-xs">
              Forgot your password? Ask your administrator.
            </FieldDescription>
          </Field>

          {/* ponytail: demo only. Supabase keeps the session until sign-out; add "forget on close" if the client asks. */}
          {!BACKEND && (
            <Field orientation="horizontal" className="gap-2">
              <Checkbox id="remember" name="remember" />
              <FieldLabel htmlFor="remember" className="font-normal">
                Keep me signed in
              </FieldLabel>
            </Field>
          )}
        </FieldGroup>

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={!ready} aria-disabled={pending || undefined}>
          {pending ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
        {!BACKEND && (
          <p className="mt-3 text-xs text-muted-foreground">
            Preview build — any username and password will sign in.
          </p>
        )}
      </form>
    </div>
  )
}
