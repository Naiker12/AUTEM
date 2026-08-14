import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { WHATSAPP_BASE_URL } from "@/data/constants";

export default function BotonWhatsappFlotante() {
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowTooltip(false), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  const whatsappUrl =
    `${WHATSAPP_BASE_URL}?text=` +
    encodeURIComponent(
      "Hola AUTEM, me gustaría recibir asesoría personalizada sobre los proyectos inmobiliarios en Cartagena y Bolívar.",
    );

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      {/* Tooltip flotante emergente */}
      {showTooltip && (
        <div className="animate-fade-up relative hidden items-center gap-2 rounded-full border border-emerald-500/25 bg-stone-950/92 px-4 py-2 text-[11px] text-white shadow-xl backdrop-blur-xl md:flex">
          <div className="flex h-2 w-2 items-center justify-center">
            <span className="absolute h-2 w-2 rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="font-medium text-stone-200">
            ¿Dudas sobre inversión?{" "}
            <span className="text-emerald-400 font-bold">Asesor en línea</span>
          </span>
          <button
            onClick={() => setShowTooltip(false)}
            className="ml-1 text-stone-400 transition-colors hover:text-white"
            aria-label="Cerrar aviso"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Botón principal de WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="group relative flex size-14 items-center justify-center rounded-full border border-emerald-400/45 bg-stone-950/95 text-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.22)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-emerald-300 hover:bg-emerald-950 hover:text-emerald-300 active:scale-95 md:h-12 md:w-auto md:gap-2.5 md:px-4"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 fill-current transition-transform group-hover:rotate-12"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.7 4.19 1.88 5.83L2 22l4.3-1.83A9.95 9.95 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.85 0-3.57-.52-5.04-1.42l-.36-.22-2.55 1.09 1.09-2.55-.22-.36A7.95 7.95 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.55-5.95c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.13-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31s-.88.86-.88 2.1c0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29z" />
        </svg>
        <span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-white md:inline">
          Asesor WhatsApp
        </span>
      </a>
    </div>
  );
}
