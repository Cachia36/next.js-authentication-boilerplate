import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeatureCard } from "@/components/layout/FeatureCard";
import { Pill } from "@/components/ui/Pill";

export const metadata: Metadata = {
  title: "Next.js Auth Boilerplate",
  description:
    "A production-leaning authentication boilerplate built with Next.js, TypeScript, JWT, and Tailwind CSS.",
};

const techStackItems = [
  "Next.js (App Router)",
  "TypeScript",
  "Tailwind CSS",
  "JWT (access + refresh)",
  "Zod",
  "Vitest",
  "ESLint (flat config)",
  "Prettier",
  "GitHub Workflows",
];

export default function HomePage() {
  return (
    <PageShell>
      {/* Hero */}
      <Section mt="none">
        <PageHeader
          eyebrow="Portfolio Project · Authentication Boilerplate"
          title="Next.js Authentication Boilerplate"
          subtitle={
            <>
              A production-leaning authentication boilerplate built with Next.js, TypeScript, JWT,
              and Tailwind CSS.
              <br />
              <br />
              Easy to use and swap database repositories to switch between databases such as MongoDb
              and PostgreSQL, or any other database as needed. Email provider is also easy to swap,
              to ensure compatibility with any future projects
            </>
          }
        />

        <div className="flex flex-wrap gap-3 pt-2">
          {/* Primary CTA */}
          <Link
            href="/dashboard"
            className="bg-foreground text-background inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90"
          >
            Open Demo Dashboard
          </Link>

          {/* Secondary CTA */}
          <Link
            href="/about"
            className="border-border text-foreground hover:bg-muted inline-flex items-center justify-center rounded-full border bg-transparent px-4 py-2 text-sm font-medium transition"
          >
            Read About the Architecture
          </Link>

          {/* GitHub link (dashed outline) */}
          <a
            href="https://github.com/cachia36/next.js-boilerplate"
            target="_blank"
            rel="noreferrer"
            className="border-border text-muted-foreground hover:bg-muted inline-flex items-center justify-center rounded-full border border-dashed px-4 py-2 text-sm font-medium transition"
          >
            View Source on GitHub
          </a>
        </div>
      </Section>

      {/* Key value props */}
      <Section className="grid gap-8 md:grid-cols-3">
        <FeatureCard title="Real-world Auth">
          Email + password login, JWT access and refresh tokens, HttpOnly cookies, protected routes,
          and password reset flow wired end to end.
        </FeatureCard>

        <FeatureCard title="Clean Architecture">
          Separation between UI, services, domain logic, and infrastructure: repositories, email
          providers, rate limiting, and environment handling.
        </FeatureCard>

        <FeatureCard title="Tested &amp; CI Ready">
          Vitest unit tests for core modules and a GitHub Actions workflow that runs the test suite
          on every push and pull request.
        </FeatureCard>
      </Section>

      {/* Tech stack */}
      <Section>
        <h2 className="text-2xl font-semibold">Tech Stack</h2>
        <p className="text-muted-foreground text-sm">
          Built with a modern, production-oriented stack:
        </p>

        <div className="flex flex-wrap gap-2">
          {techStackItems.map((item) => (
            <Pill key={item}>{item}</Pill>
          ))}
        </div>
      </Section>

      {/* Architecture preview */}
      <Section>
        <h2 className="text-2xl font-semibold">Architecture at a Glance</h2>
        <p className="text-muted-foreground text-sm">
          The project is structured to be easy to extend into a real product:
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-muted text-muted-foreground rounded-xl border p-5 text-sm">
            <h3 className="text-foreground mb-2 text-sm font-semibold">Auth &amp; Domain</h3>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <code className="bg-muted rounded px-1 py-0.5 text-[11px]">
                  src/lib/auth/domain
                </code>{" "}
                – auth service, JWT handling, password hashing
              </li>
              <li>
                <code className="bg-muted rounded px-1 py-0.5 text-[11px]">UserRepository</code>{" "}
                abstraction with in-memory implementation for testing, as well as mongoDb
                implementation, easy to switch between repositories.
              </li>
              <li>Password reset tokens + pluggable email provider</li>
            </ul>
          </div>

          <div className="bg-muted text-muted-foreground rounded-xl border p-5 text-sm">
            <h3 className="text-foreground mb-2 text-sm font-semibold">API &amp; Middleware</h3>
            <ul className="list-disc space-y-1 pl-4">
              <li>REST-style route handlers under `/api/auth/*`</li>
              <li>Shared error handler and rate limiter for consistent responses</li>
              <li>Middleware-protected routes for `/dashboard` and auth-only pages</li>
            </ul>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          For a deeper, more technical breakdown of the architecture, visit the{" "}
          <Link
            href="/about"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            About page
          </Link>
          .
        </p>
      </Section>

      {/* How to explore */}
      <Section className="mb-8">
        <h2 className="text-2xl font-semibold">How to Explore This Demo</h2>

        <ol className="text-muted-foreground list-decimal space-y-2 pl-5 text-sm">
          <li>
            Register a new account using the{" "}
            <Link
              href="/register"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              registration page
            </Link>
            .
          </li>
          <li>Log in and navigate to the dashboard to see a protected page.</li>
          <li>Try logging out and visiting the dashboard again to test the middleware.</li>
          <li>
            Trigger the forgot/reset password flow. Check your email for a link with resetToken,
            enter the link and reset your password.
          </li>
        </ol>
      </Section>

      {/* Navbar anchor target: Services */}
      <Section id="services">
        <h2 className="text-2xl font-semibold">Services / Use Cases</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          This boilerplate was designed for me to learn JWT and practice with the technologies
          listed, showcase to employers as part of my portfolio, and create a boilerplate for future
          projects that may utilize authentication, role-based access control, and clean
          architecture. This boilerplate is easy to extend, and{" "}
          <span className="text-success">database and email provider are easy to swap</span>
        </p>
      </Section>

      {/* Navbar anchor target: Contact */}
      <Section id="contact" className="mb-4">
        <h2 className="text-2xl font-semibold">Contact</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Want to work together or see more of my work? Feel free to reach out via{" "}
          <a
            href="mailto:kylecachia2@gmail.com"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            email
          </a>{" "}
          or connect through the links in the footer.
        </p>
      </Section>

    </PageShell>
  );
}
