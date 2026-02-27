"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { forgotPassword } from "@/lib/features/authSlice";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const id = toast.loading("Sending reset OTP...");
    try {
      await dispatch(forgotPassword({ email })).unwrap();
      if (typeof window !== "undefined") {
        localStorage.setItem("forgotPassword", "true");
        localStorage.setItem("verifyEmail", email);
      }
      toast.success("OTP sent! Check your email.", { id });
      setTimeout(() => {
        router.push(
          `/auth/verify?type=reset-password&email=${encodeURIComponent(email)}`,
        );
      }, 800);
    } catch (err: any) {
      toast.error(
        typeof err === "string" ? err : "An error occurred. Please try again.",
        { id },
      );
    }
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
            <CardTitle>Forgot password?</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you an OTP to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={!!error}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Send reset OTP"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Remembered your password?{" "}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

