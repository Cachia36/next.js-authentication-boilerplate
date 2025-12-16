import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <h1 className="mb-2 text-4xl font-bold tracking-tight">404 – Page not found</h1>
      <p className="text-muted-foreground mb-6 max-w-md text-center">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>

      <Button variant="outline">
        <Link href="/">Go back home</Link>
      </Button>
    </main>
  );
}
