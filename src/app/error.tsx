"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // TODO: plug in Sentry / LogRocket / your own logger here
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <h1 className="mb-2 text-3xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground mb-4 max-w-md text-center">
        An unexpected error occurred. You can try again or go back to the home page.
      </p>

      <div className="flex gap-3">
        <Button onClick={() => reset()} variant="outline">
          Try again
        </Button>

        <Link
          href="/"
          className="bg-foreground text-background rounded-full border px-4 py-2 text-sm transition hover:cursor-default"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
