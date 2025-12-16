"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/core/utils";
import { AuthActions } from "@/components/auth/AuthActions";
import type { NavLink } from "./NavLinks";

type MobileMenuProps = {
  isOpen: boolean;
  navLinks: NavLink[];
  authLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onLogout: () => void;
  currentPath: string;
};

export function MobileMenu({
  isOpen,
  navLinks,
  authLoading,
  isLoggedIn,
  isAdmin,
  onClose,
  onLogout,
  currentPath,
}: MobileMenuProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Only runs on the client, after hydration
  useEffect(() => {
    // We intentionally set portalTarget once after mount to avoid SSR/hydration issues.
    // This is safe and only runs on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortalTarget(document.body);
  }, []);

  // SSR + first client paint: renders nothing → no hydration mismatch
  if (!portalTarget) {
    return null;
  }

  const isRouteActive = (href: string) => {
    if (href.startsWith("#")) return false;
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  };

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-70 transition-[opacity,visibility] duration-300 md:hidden",
        isOpen
          ? "pointer-events-auto visible opacity-100"
          : "pointer-events-none invisible opacity-0",
      )}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className={cn(
          "border-border bg-background/95 absolute inset-x-0 top-3 mx-4 origin-top rounded-2xl border shadow-xl",
          "transition-all duration-300 ease-out",
          isOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-95 opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-5 p-4">
          <div className="flex justify-center gap-3">
            <AuthActions
              loading={authLoading}
              isLoggedIn={isLoggedIn}
              isAdmin={isAdmin}
              onLinkClick={onClose}
              onLogout={() => {
                onClose();
                onLogout();
              }}
            />
          </div>

          <nav className="flex flex-col gap-2 text-base font-medium">
            {navLinks.map((link) => {
              const active = isRouteActive(link.href);

              return (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between rounded-full px-3 py-2 text-sm transition-colors",
                    "text-muted-foreground hover:bg-muted hover:text-foreground",
                    active && "bg-muted text-foreground",
                  )}
                >
                  <span>{link.label}</span>
                  {active && <span className="bg-foreground h-1.5 w-1.5 rounded-full" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
