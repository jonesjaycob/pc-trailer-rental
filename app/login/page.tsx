import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  return (
    <div className="container py-16 max-w-md">
      <h1 className="font-display text-3xl font-bold mb-2">Sign in</h1>
      <p className="text-muted-foreground mb-6">
        Welcome back. Sign in to manage your bookings.
      </p>
      <LoginForm callbackUrl={callbackUrl} initialError={error} />
      <p className="mt-6 text-sm text-muted-foreground text-center">
        Need an account?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
