import Link from "next/link";
import { JCVLogo } from "@/shared/components/JCVLogo";
import { Instagram, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border bg-background/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo y descripcion */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <JCVLogo variant="cyan" size="md" showText />
            </Link>
            <p className="text-foreground/60 mb-4 max-w-md">
              Transforma tu cuerpo con planes de alimentacion personalizados y rutinas de entrenamiento
              disenadas por JCV 24 Fitness.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/jcv_24/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Instagram className="w-5 h-5 text-primary" />
              </a>
              <a
                href="https://wa.me/573143826430"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors"
              >
                <Phone className="w-5 h-5 text-green-500" />
              </a>
              <a
                href="mailto:contacto@jcv24fitness.com"
                className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
              >
                <Mail className="w-5 h-5 text-blue-500" />
              </a>
            </div>
          </div>

          {/* Enlaces rapidos */}
          <div>
            <h4 className="font-bold text-foreground mb-4">Enlaces</h4>
            <ul className="space-y-2">
              <li>
                <a href="#meal-plan" className="text-foreground/60 hover:text-primary transition-colors">
                  Plan Alimenticio
                </a>
              </li>
              <li>
                <a href="#workout-plan" className="text-foreground/60 hover:text-primary transition-colors">
                  Plan de Entrenamiento
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-foreground/60 hover:text-primary transition-colors">
                  Precios
                </a>
              </li>
              <li>
                <Link href="/generator" className="text-foreground/60 hover:text-primary transition-colors">
                  Generador de Rutinas
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-bold text-foreground mb-4">Contacto</h4>
            <ul className="space-y-2 text-foreground/60">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                <span>+57 314 382 6430</span>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500" />
                <span>@jcv_24</span>
              </li>
              <li className="text-sm mt-4 text-primary">
                Colombia
              </li>
            </ul>
          </div>
        </div>

        {/* Linea divisoria con gradiente */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mb-8" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-foreground/40 text-sm">
            &copy; {new Date().getFullYear()} JCV 24 Fitness. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-foreground/40 text-xs">
            <span>Desarrollado con</span>
            <span className="text-accent">amor</span>
            <span>para guerreros</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
