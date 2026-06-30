import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="dark-theme flex min-h-screen items-center justify-center bg-background text-neutral-400">
          Loading…
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
