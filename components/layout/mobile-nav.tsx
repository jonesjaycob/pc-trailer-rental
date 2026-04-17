"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  nav: { href: string; label: string }[];
  isAuthed: boolean;
  isAdmin: boolean;
};

export function MobileNav({ nav, isAuthed, isAdmin }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="container flex h-16 items-center justify-between">
            <span className="font-display text-lg font-bold">Menu</span>
            <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="container flex flex-col gap-1 py-6 text-base">
            {nav.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className="rounded-md px-3 py-3 hover:bg-secondary"
                onClick={() => setOpen(false)}
              >
                {i.label}
              </Link>
            ))}
            <div className="my-4 h-px bg-border" />
            {isAuthed ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-md px-3 py-3 hover:bg-secondary"
                    onClick={() => setOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-3 hover:bg-secondary"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-md px-3 py-3 hover:bg-secondary"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md px-3 py-3 bg-primary text-primary-foreground text-center font-medium"
                  onClick={() => setOpen(false)}
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
