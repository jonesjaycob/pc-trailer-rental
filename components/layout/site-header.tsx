import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

const nav = [
  { href: "/fleet", label: "Fleet" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/legal", label: "Policies" },
];

export async function SiteHeader() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-8 w-8 rounded-md bg-primary" aria-hidden />
          <span className="font-display text-lg font-bold tracking-tight">
            Pell City Trailer Rentals
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {nav.map((i) => (
            <Link key={i.href} href={i.href} className="hover:text-primary transition-colors">
              {i.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {session?.user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Create account</Link>
              </Button>
            </>
          )}
        </div>

        <div className="md:hidden">
          <MobileNav
            nav={nav}
            isAuthed={!!session?.user}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </header>
  );
}
