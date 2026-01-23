export function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-foreground/60">
          &copy; {new Date().getFullYear()} JCV Fitness. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
