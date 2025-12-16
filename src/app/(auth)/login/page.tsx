"use client";

import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginCard } from "@/components/auth/cards/LoginCard";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

let didRefresh = false;

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (!didRefresh) {
      didRefresh = true;
      router.refresh();
    }
  }, [router]);

  return (
    <AuthPageShell>
      <LoginCard />
    </AuthPageShell>
  );
}
