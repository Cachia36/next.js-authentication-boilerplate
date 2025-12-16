"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { UserPlus2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/core/utils";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from "@/lib/auth/domain/validation/auth";
import { EmailField } from "../fields/EmailField";
import { PasswordField } from "../fields/PasswordField";
import { registerRequest } from "@/lib/auth/client/authClient";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type ApiError = Error & { statusCode?: number };

export function RegisterCard() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const clearFormMessage = () => setFormMessage(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent multiple rapid submits
    if (isSubmitting) return;

    const errors: FieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }

    // Start submit
    setIsSubmitting(true);
    clearFormMessage();

    try {
      await registerRequest(email, password);

      // On success, keep the button disabled while redirecting
      window.location.href = "/login";
    } catch (err: unknown) {
      const error = err as ApiError;

      if (error.statusCode === 429) {
        setFormMessage("Too many attempts. Please wait and try again.");
      } else {
        setFormMessage(error.message ?? "Failed to create account");
      }

      // allow retry after error
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "border-border bg-background/90 w-full max-w-md rounded-3xl border shadow-lg",
        "transition-all duration-300 ease-out",
        "hover:border-foreground/20 hover:shadow-xl",
      )}
    >
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-6">
        <div className="bg-muted text-foreground ring-border flex h-14 w-14 items-center justify-center rounded-2xl text-lg shadow-sm ring-1">
          <UserPlus2 className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-2xl font-semibold tracking-tight">Create your account</h2>

        <p className="text-muted-foreground mt-2 max-w-[320px] px-4 text-center text-sm leading-relaxed">
          Sign up to start using your authentication boilerplate dashboard.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 px-8 pb-10" noValidate>
        {formMessage && <p className="text-error px-1 text-center text-sm">{formMessage}</p>}

        {/* Email */}
        <EmailField
          value={email}
          error={fieldErrors.email}
          onChange={(value) => {
            setEmail(value);

            if (fieldErrors.email) {
              setFieldErrors((prev) => ({
                ...prev,
                email: validateEmail(value),
              }));
            }

            if (formMessage) clearFormMessage();
          }}
          onBlur={(value) => {
            const err = validateEmail(value);
            setFieldErrors((prev) => ({ ...prev, email: err }));
          }}
        />

        {/* Password */}
        <PasswordField
          value={password}
          error={fieldErrors.password}
          placeholder="Password"
          show={showPassword}
          onChange={(value) => {
            setPassword(value);

            if (fieldErrors.password) {
              setFieldErrors((prev) => ({
                ...prev,
                password: validatePassword(value),
              }));
            }

            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({
                ...prev,
                confirmPassword: validateConfirmPassword(value, confirmPassword),
              }));
            }

            if (formMessage) clearFormMessage();
          }}
          onBlur={(value) => {
            const err = validatePassword(value);
            setFieldErrors((prev) => ({ ...prev, password: err }));
          }}
          onToggleShow={() => setShowPassword((prev) => !prev)}
          errorId="password-error"
        />

        {/* Confirm password */}
        <PasswordField
          value={confirmPassword}
          error={fieldErrors.confirmPassword}
          placeholder="Confirm password"
          show={showConfirm}
          onChange={(value) => {
            setConfirmPassword(value);

            setFieldErrors((prev) => ({
              ...prev,
              confirmPassword: validateConfirmPassword(password, value),
            }));

            if (formMessage) clearFormMessage();
          }}
          onBlur={(value) => {
            const err = validateConfirmPassword(password, value);
            setFieldErrors((prev) => ({ ...prev, confirmPassword: err }));
          }}
          onToggleShow={() => setShowConfirm((prev) => !prev)}
          errorId="confirm-password-error"
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-semibold",
            isSubmitting && "cursor-not-allowed opacity-70",
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating account...
            </>
          ) : (
            "Sign up"
          )}
        </Button>

        <div className="flex items-center gap-4 pt-4">
          <span className="bg-border h-px w-full" />
          <span className="text-muted-foreground text-[11px] tracking-[0.2em] uppercase">Or</span>
          <span className="bg-border h-px w-full" />
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground text-sm font-medium"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
