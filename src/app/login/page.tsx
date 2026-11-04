import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Collector & Curator Sign-In | AMVI Fine Art",
  description: "Sign in with Gmail, Google, or administrator password to access the AMVI gallery collection.",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative ambient gradient orbs inspired by the AMVI backlit artwork logo */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-tr from-[#d97757]/20 to-[#e8a86a]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-bl from-[#78a98f]/20 to-[#68b2d1]/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-white/40 blur-2xl" />

      <div className="relative z-10 w-full max-w-md">
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#d97757]" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
