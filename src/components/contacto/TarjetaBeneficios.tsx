import { Clock, ShieldCheck, MessageCircle, MapPin } from "lucide-react";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import { Card, CardContent } from "@/components/ui/card";

export default function TarjetaBeneficios() {
  const whatsappUrl =
    `${WHATSAPP_BASE_URL}?text=` +
    encodeURIComponent(
      "Hola AUTEM, me interesa recibir información y asesoría sobre sus proyectos en Cartagena y Bolívar.",
    );

  return (
    <div className="flex h-full flex-col justify-between gap-7">
      <div>
        <p className="mb-4 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.22em] text-accent">
          <span className="h-px w-7 bg-accent" /> Conversemos
        </p>
        <h2 className="font-serif text-[clamp(2.6rem,4vw,4.5rem)] font-light leading-[0.96] tracking-[-0.04em]">
          Hablemos de tu
          <span className="mt-1 block italic font-normal text-accent">próxima inversión.</span>
        </h2>

        <p className="mt-5 max-w-md text-sm font-light leading-7 text-muted-foreground">
          Asesoría personalizada de alto nivel para la adquisición de propiedades exclusivas en
          Cartagena, Barú y Turbaco con gestión fiduciaria y licencias turísticas.
        </p>
      </div>

      {/* Lista de beneficios VIP */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {[
          {
            icon: Clock,
            title: "Respuesta en menos de 24h",
            copy: "Atención directa de un consultor especializado.",
          },
          {
            icon: ShieldCheck,
            title: "Confidencialidad garantizada",
            copy: "Tratamiento privado de información para inversionistas.",
          },
        ].map(({ icon: Icon, title, copy }) => (
          <Card
            key={title}
            className="rounded-2xl border-border/70 bg-background/48 shadow-none transition-colors hover:border-accent/35"
          >
            <CardContent className="flex items-start gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                <Icon size={17} />
              </span>
              <span>
                <span className="block text-[11px] font-semibold">{title}</span>
                <span className="mt-1 block text-[10px] leading-4 text-muted-foreground">
                  {copy}
                </span>
              </span>
            </CardContent>
          </Card>
        ))}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-2xl border border-emerald-500/35 bg-emerald-500/[0.07] p-4 text-emerald-600 transition-all hover:border-emerald-500/60 hover:bg-emerald-500/[0.11] dark:text-emerald-400 sm:col-span-2 lg:col-span-1 xl:col-span-2"
        >
          <div className="flex items-center gap-3">
            <MessageCircle size={20} />
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider">
                Atención VIP por WhatsApp
              </span>
              <span className="text-[10px] opacity-75">Asesor disponible ahora en línea</span>
            </div>
          </div>
          <span className="text-xs font-bold">→</span>
        </a>
      </div>

      {/* Ubicación de oficina */}
      <div className="flex items-center gap-2 border-t border-border/70 pt-4 text-[11px] text-muted-foreground">
        <MapPin size={13} className="text-accent shrink-0" />
        <span>Bocagrande, Av. San Martín 10-45 · Cartagena de Indias</span>
      </div>
    </div>
  );
}
