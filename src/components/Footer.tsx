import { Link } from "@tanstack/react-router";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <Link to="/" className="font-serif text-2xl tracking-tight">
              AUTEM
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Arquitectura, tecnología y bienes raíces premium desde 2010.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 text-[10px] uppercase tracking-widest text-muted-foreground md:grid-cols-3">
            <div className="space-y-3">
              <p className="text-foreground">Explorar</p>
              <a href={`${import.meta.env.BASE_URL}#proyectos`} className="block hover:text-accent">
                Proyectos
              </a>
              <a
                href={`${import.meta.env.BASE_URL}#tecnologia`}
                className="block hover:text-accent"
              >
                Tecnología
              </a>
              <a href={`${import.meta.env.BASE_URL}#nosotros`} className="block hover:text-accent">
                Nosotros
              </a>
            </div>
            <div className="space-y-3">
              <p className="text-foreground">Contacto</p>
              <p>Cartagena, Colombia</p>
              <p>+57 300 720 0894</p>
              <p>hola@autem.es</p>
            </div>
            <div className="space-y-3">
              <p className="text-foreground">Legal</p>
              <Link to="/politica-privacidad" className="block hover:text-accent">
                Privacidad
              </Link>
              <a href="#" className="block hover:text-accent">
                Términos
              </a>
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-border pt-8 text-[10px] uppercase tracking-widest text-muted-foreground md:flex-row">
          <p>© 2026 AUTEM Real Estate. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
