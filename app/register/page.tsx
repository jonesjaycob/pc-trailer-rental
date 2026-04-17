import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="container py-16 max-w-md">
      <h1 className="font-display text-3xl font-bold mb-2">Create account</h1>
      <p className="text-muted-foreground mb-6">
        Set up your renter profile. You&apos;ll upload your driver&apos;s license at
        checkout when you book.
      </p>
      <RegisterForm />
      <p className="mt-6 text-sm text-muted-foreground text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
