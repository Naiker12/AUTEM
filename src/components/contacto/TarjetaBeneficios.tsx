import { Clock, ShieldCheck, MessageCircle, MapPin } from "lucide-react";
import { WHATSAPP_BASE_URL } from "@/data/constants";

export default function TarjetaBeneficios() {
  const whatsappUrl =
    `${WHATSAPP_BASE_URL}?text=` +
    encodeURIComponent(
      "Hola AUTEM, me interesa recibir información y asesoría sobre sus proyectos en Cartagena y Bolívar.",
    );

  return (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-light leading-tight text-white md:text-4xl">
          Hablemos de tu <br />
          <span className="italic font-normal text-accent">próxima inversión</span>.
        </h2>

        <p className="mt-3 text-xs leading-relaxed text-stone-300 font-light">
          Asesoría personalizada de alto nivel para la adquisición de propiedades exclusivas en
          Cartagena, Barú y Turbaco con gestión fiduciaria y licencias turísticas.
        </p>
      </div>

      {/* Lista de beneficios VIP */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-colors hover:border-accent/40">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
            <Clock size={18} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-stone-200">Respuesta en menos de 24h</h4>
            <p className="text-[11px] text-stone-400">
              Un consultor especializado te contactará personalmente.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-colors hover:border-accent/40">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-stone-200">
              Confidencialidad Garantizada (NDA)
            </h4>
            <p className="text-[11px] text-stone-400">
              Tratamiento privado de información para inversionistas.
            </p>
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-emerald-400 transition-all hover:bg-emerald-900/60 hover:border-emerald-500/70"
        >
          <div className="flex items-center gap-3">
            <MessageCircle size={20} className="text-emerald-400 animate-bounce" />
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider">
                Atención VIP por WhatsApp
              </span>
              <span className="text-[10px] text-emerald-300/80">
                Asesor disponible ahora en línea
              </span>
            </div>
          </div>
          <span className="text-xs font-bold">→</span>
        </a>
      </div>

      {/* Ubicación de oficina */}
      <div className="border-t border-white/10 pt-3 text-[11px] text-stone-400 flex items-center gap-2">
        <MapPin size={13} className="text-accent shrink-0" />
        <span>Bocagrande, Av. San Martín 10-45 · Cartagena de Indias</span>
      </div>
    </div>
  );
}
