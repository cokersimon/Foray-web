import { Suspense } from "react";
import ResetPasswordPage from "./reset-password-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="dark-theme flex min-h-screen items-center justify-center bg-background text-neutral-400">
          Loading…
        </div>
      }
    >
      <ResetPasswordPage />
    </Suspense>
  );
}
