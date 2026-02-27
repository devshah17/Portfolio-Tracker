"use client";

import React, { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { resetPassword } from "@/lib/features/authSlice";
import type { RootState } from "@/lib/store";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state: RootState) => state.auth);

  const emailFromUrl = searchParams.get("email") || "";
  const emailFromStorage =
    globalThis.window?.localStorage.getItem("verifyEmail") ?? "";
  const email = emailFromUrl || emailFromStorage || "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  useEffect(() => {
    const storedOtp = globalThis.window?.localStorage.getItem("resetOtp");
    if (!storedOtp) {
      toast.error("OTP not found. Please repeat the forgot password flow.");
      router.push("/auth/forgot-password");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<typeof formData> = {};
    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!email) {
      toast.error("Email not found. Please repeat the forgot password flow.");
      return;
    }

    const id = toast.loading("Resetting password...");
    try {
      await dispatch(
        resetPassword({
          email,
          newPassword: formData.password,
        }),
      ).unwrap();

      globalThis.window?.localStorage.removeItem("verifyEmail");
      globalThis.window?.localStorage.removeItem("forgotPassword");
      globalThis.window?.localStorage.removeItem("resetOtp");

      toast.success("Password reset successfully! Redirecting to sign in...", {
        id,
      });
      setTimeout(() => {
        router.push("/auth/signin");
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
            <CardTitle>Reset password</CardTitle>
            <CardDescription>
              Enter your new password below.
              {email && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {email}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="password">
                  New password
                </label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium"
                  htmlFor="confirmPassword"
                >
                  Confirm password
                </label>
                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset password"}
              </Button>
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

