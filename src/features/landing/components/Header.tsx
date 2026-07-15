"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui";
import { Menu, X, User, LogOut } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { JCVLogoMini } from "@/shared/components/JCVLogo";
import { useAuth, AuthModal } from "@/features/auth";

const navLinks = [
  { href: "#meal-plan", label: "Alimentacion" },
  { href: "#workout-plan", label: "Entrenamiento" },
  { href: "#pricing", label: "Planes" },
];

export function Header() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const { isAuthenticated, signOut } = useAuth();

  const handleAuthSuccess = () => {
    setShowAuth(false);
    router.push("/dashboard");
  };

  const openLogin = () => {
    setAuthMode("login");
    setShowAuth(true);
    setIsOpen(false);
  };

  const openRegister = () => {
    setAuthMode("register");
    setShowAuth(true);
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <JCVLogoMini variant="cyan" className="transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold">
              <span className="text-primary">24</span>
              <span className="text-foreground/80 text-sm ml-1">FITNESS</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.href === "#pricing" ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-1.5 text-black font-semibold bg-accent-cyan rounded-full hover:shadow-lg hover:shadow-accent-cyan/30 transition-all hover:scale-105"
                >
                  {link.label}
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </a>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-foreground/70 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors"
                >
                  <User className="h-4 w-4" />
                  Mi Panel
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-red-400 border-red-400/50 hover:bg-red-400/10 hover:border-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openLogin}
                  className="text-foreground/70 hover:text-primary transition-colors text-sm font-medium"
                >
                  Iniciar sesion
                </button>
                <Button size="sm" onClick={openRegister}>
                  Registrarse
                </Button>
              </div>
            )}
          </nav>

          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isOpen ? "max-h-80 pb-4" : "max-h-0"
          )}
        >
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) =>
              link.href === "#pricing" ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="w-fit relative px-4 py-1.5 text-black font-semibold bg-accent-cyan rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </a>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-foreground/70 hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Mi Panel
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="w-fit flex items-center gap-2 text-red-400 border-red-400/50 hover:bg-red-400/10"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={openLogin}
                  className="text-foreground/70 hover:text-primary transition-colors text-sm font-medium text-left"
                >
                  Iniciar sesion
                </button>
                <Button size="sm" className="w-fit" onClick={openRegister}>
                  Registrarse
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        defaultMode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </header>
  );
}
