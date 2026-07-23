import TarjetaBeneficios from "./TarjetaBeneficios";
import FormularioContacto from "./FormularioContacto";

export default function SeccionContacto() {
  return (
    <section
      id="contacto"
      className="relative border-t border-stone-800 bg-stone-950 text-white py-24 md:py-32 overflow-hidden"
    >
      {/* Contenedor del mismo ancho exacto (max-w-7xl px-6 md:px-8) que la cartelera de testimonios */}
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Tarjeta de Cristal de Obsidiana con idéntico radio (rounded-3xl) y acolchado (p-8 md:p-14) */}
        <div className="relative overflow-hidden rounded-3xl border border-stone-800 bg-stone-900 text-stone-100 p-8 md:p-14 shadow-2xl backdrop-blur-2xl">
          {/* Destellos ambientales de fondo idénticos a la cartelera */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-center">
            {/* Columna Izquierda: Información VIP */}
            <div className="lg:col-span-5">
              <TarjetaBeneficios />
            </div>

            {/* Columna Derecha: Formulario */}
            <div className="lg:col-span-7">
              <FormularioContacto />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
