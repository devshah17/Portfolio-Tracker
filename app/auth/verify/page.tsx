"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { verifyOtp } from "@/lib/features/authSlice";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.auth);

  const type = searchParams.get("type") || "verification";
  const emailFromUrl = searchParams.get("email") || "";
  const emailFromStorage =
    typeof window !== "undefined" ? localStorage.getItem("verifyEmail") : "";
  const email = emailFromUrl || emailFromStorage || "";

  const forgotPassword = type === "reset-password";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    setCanResend(true);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTitle = () => {
    switch (type) {
      case "reset-password":
        return "Verify reset password";
      case "signup":
        return "Verify your email";
      default:
        return "Verify OTP";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "reset-password":
        return "Enter the 6‑digit OTP sent to your email to reset your password.";
      case "signup":
        return "Enter the 6‑digit OTP sent to your email to complete registration.";
      default:
        return "Enter the 6‑digit OTP sent to your email.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the complete 6‑digit OTP");
      return;
    }
    if (!email) {
      toast.error("Email not found. Please try signing in again.");
      return;
    }
    setError(null);

    const id = toast.loading("Verifying OTP...");
    try {
      await dispatch(
        verifyOtp({
          email,
          otp,
          forgotPassword: forgotPassword || undefined,
        }),
      ).unwrap();

      if (forgotPassword) {
        if (typeof window !== "undefined") {
          localStorage.setItem("resetOtp", otp);
          localStorage.setItem("verifyEmail", email);
          localStorage.setItem("forgotPassword", "true");
        }
        toast.success("OTP verified! Continue to reset password.", { id });
        setTimeout(() => {
          router.push(
            `/auth/reset-password?email=${encodeURIComponent(email)}`,
          );
        }, 800);
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("verifyEmail");
          localStorage.removeItem("forgotPassword");
        }
        toast.success("OTP verified! Redirecting to dashboard...", { id });
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      }
    } catch (err: any) {
      toast.error(
        typeof err === "string" ? err : "Invalid OTP. Please try again.",
        { id },
      );
    }
  };

  const handleResend = () => {
    // Placeholder – backend already sends OTP on signup / forgot flow.
    setTimer(300);
    setCanResend(false);
    setOtp("");
    toast.info("If your OTP expired, please re‑trigger the flow.");
  };

  const isLoading = status === "loading";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold">
              PT
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent">
              Portfolio Tracker
            </span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{getTitle()}</CardTitle>
            <CardDescription>
              {getDescription()}
              {email && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {email}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">
                  Enter 6‑digit OTP
                </p>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    setError(null);
                  }}
                  aria-invalid={!!error}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {error && (
                  <p className="text-xs text-center text-red-500">{error}</p>
                )}
              </div>
              {!canResend && (
                <p className="text-center text-xs text-muted-foreground">
                  Resend OTP in{" "}
                  <span className="font-medium text-blue-600">
                    {formatTime(timer)}
                  </span>
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
              {canResend && (
                <button
                  type="button"
                  onClick={handleResend}
                  className="mx-auto block text-xs font-medium text-blue-600 hover:underline"
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              )}
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Back to{" "}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:underline">
                sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

