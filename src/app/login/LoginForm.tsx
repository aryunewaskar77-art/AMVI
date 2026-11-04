"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginWithPasswordAction } from "@/app/actions/auth";
import {
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";
  const errorParam = searchParams.get("error");

  const [authMethod, setAuthMethod] = useState<"password" | "phone">("password");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam ? "Authentication session could not be verified. Please retry." : null
  );
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  // 1. Password-based Login (Admin & Standard email/password)
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const formData = new FormData();
    formData.append("email", emailAddress);
    formData.append("password", password);

    startTransition(async () => {
      try {
        const result = await loginWithPasswordAction(formData);

        if (!result.success) {
          setErrorMessage(result.message || "Invalid credentials.");
          return;
        }

        if (result.role === "admin") {
          router.push("/admin");
          router.refresh();
        } else {
          router.push(nextUrl || "/");
          router.refresh();
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Authentication failed."
        );
      }
    });
  };

  // 2. Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
          },
        });
        if (error) throw error;
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Google authentication failed."
        );
      }
    });
  };

  // 3. Send Phone OTP
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    let formattedPhone = phoneNumber.trim().replace(/\s+/g, "");
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+91${formattedPhone}`;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });

        if (error) throw error;

        setOtpSent(true);
        setSuccessNotice(`Verification SMS passcode sent to ${formattedPhone}`);
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Could not send OTP to phone. Ensure Supabase SMS is enabled."
        );
      }
    });
  };

  // 4. Verify Phone OTP
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let formattedPhone = phoneNumber.trim().replace(/\s+/g, "");
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+91${formattedPhone}`;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otpCode.trim(),
          type: "sms",
        });

        if (error) throw error;

        router.push(nextUrl);
        router.refresh();
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Invalid or expired passcode."
        );
      }
    });
  };



  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <Link href="/" className="inline-block transition-transform duration-300 hover:scale-105">
          <div className="relative h-20 w-36 mx-auto overflow-hidden rounded-xl p-2 bg-white/60 shadow-xs border border-white/80 backdrop-blur-xs">
            <Image
              src="/amvi-logo.png"
              alt="AMVI Fine Art"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#d97757]">
            Sanctuary of Indian Masterpieces
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
            AMVI Access Portal
          </h1>
        </div>
        <p className="text-xs text-stone-500 font-light max-w-sm mx-auto leading-relaxed">
          Authenticate to access private collections, artwork reservations, and administrative curatorial controls.
        </p>
      </div>

      {/* Card Container with Deluxe Glass Effect and Gradient Border Accent */}
      <div className="relative rounded-3xl border border-white/80 bg-white/90 p-8 sm:p-9 shadow-2xl backdrop-blur-xl amvi-glow-intense space-y-6">
        {/* Subtle top ambient indicator */}
        <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-[#d97757] to-transparent rounded-full opacity-60" />
        {/* Alerts */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Quick Google / Gmail Login Button */}
        <div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-300 bg-white py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-stone-700 shadow-xs hover:border-[#d97757] hover:bg-stone-50/50 hover:text-stone-900 transition-all disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google / Gmail</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-stone-200" />
          <span className="absolute bg-white px-3 text-[11px] font-medium tracking-widest text-stone-400 uppercase">
            Or Authenticate With
          </span>
        </div>

        {/* Tabs for Login Modes */}
        <div className="flex rounded-xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("password");
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              authMethod === "password"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod("phone");
              setOtpSent(false);
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              authMethod === "phone"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Mobile OTP</span>
          </button>
        </div>

        {/* 1. Password / Admin Sign In */}
        {authMethod === "password" && (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="admin@gmail.com or collector@example.com"
                className="mt-1 block w-full rounded-md border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#d97757] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Password *
                </label>
              </div>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-md border border-stone-300 px-3.5 py-2.5 pr-10 text-sm text-stone-900 focus:border-[#d97757] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-3 rounded-xl bg-gradient-to-r from-stone-50 via-amber-50/40 to-stone-50 p-3 border border-amber-200/50 text-[11px] text-stone-600 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d97757]" />
                    <span>Administrator Credentials</span>
                  </div>
                  <div className="mt-0.5 text-stone-500 font-mono text-[10px]">
                    admin@gmail.com • admin@123
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmailAddress("admin@gmail.com");
                    setPassword("admin@123");
                  }}
                  className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#d97757] border border-stone-200 hover:border-[#d97757] transition-all shadow-2xs"
                >
                  Auto Fill
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d97757] to-[#e8a86a] py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md hover:opacity-95 transition-all amvi-glow disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. Mobile Phone Authentication */}
        {authMethod === "phone" && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Mobile Phone Number *
                  </label>
                  <div className="mt-1 flex rounded-md shadow-xs">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-stone-300 bg-stone-50 px-3 text-xs font-medium text-stone-500 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="98201 00000"
                      className="block w-full rounded-none rounded-r-md border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#d97757] focus:outline-none font-mono"
                    />
                  </div>
                  <span className="mt-1 block text-[11px] text-stone-400">
                    We will send a 6-digit one-time verification passcode.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d97757] to-[#e8a86a] py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md hover:opacity-95 transition-all amvi-glow disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Enter 6-Digit Passcode *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="block w-full text-center tracking-widest rounded-md border border-stone-300 px-3.5 py-2.5 text-lg font-mono font-bold text-stone-900 focus:border-[#d97757] focus:outline-none"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-stone-400">Sent to {phoneNumber}</span>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[#d97757] hover:underline font-medium"
                    >
                      Change Phone
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d97757] to-[#e8a86a] py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md hover:opacity-95 transition-all amvi-glow disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Verify & Enter Gallery</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}



        {/* Footer Guarantee */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
          <ShieldCheck className="h-4 w-4 text-[#78a98f]" />
          <span>Encrypted AMVI Authenticated Session</span>
        </div>
      </div>
    </div>
  );
}
