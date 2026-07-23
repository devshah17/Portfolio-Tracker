"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdvisorRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/assets"); }, [router]);
  return null;
}
