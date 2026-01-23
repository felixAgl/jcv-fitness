"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/components/ui";
import { Menu, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const navLinks = [
  { href: "#meal-plan", label: "Alimentacion" },
  { href: "#workout-plan", label: "Entrenamiento" },
  { href: "#pricing", label: "Planes" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-primary">JCV</span> Fitness
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-foreground/70 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Button size="sm">Comenzar</Button>
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
            isOpen ? "max-h-64 pb-4" : "max-h-0"
          )}
        >
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-foreground/70 hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Button size="sm" className="w-fit">Comenzar</Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
