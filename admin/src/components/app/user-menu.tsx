"use client"

import { useState } from "react"
import { LogOut, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"

import { ResetDemoDialog } from "@/components/app/reset-demo-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { requestLeave } from "@/lib/leave-guard"
import { useDemo, useSession } from "@/lib/store"
import { BACKEND } from "@/lib/supabase/client"

function initials(name: string) {
  return name
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

export function UserMenu() {
  const router = useRouter()
  const { actions } = useDemo()
  const { username } = useSession()
  const name = username?.trim() || "Admin"
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-1 xl:pr-2" aria-label={`Account menu, ${name}`}>
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate xl:inline">{name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <span className="block text-xs text-muted-foreground">Signed in as</span>
            <span className="block truncate font-medium text-foreground">{name}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!BACKEND && (
            <>
              <DropdownMenuItem onSelect={() => setResetOpen(true)}>
                <RotateCcw />
                Reset demo data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onSelect={() =>
              // a dirty form asks first; Save or Discard then finishes the sign-out
              requestLeave("/login", () => void actions.signOut().then((out) => out && router.push("/login")))
            }
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} />
    </>
  )
}
