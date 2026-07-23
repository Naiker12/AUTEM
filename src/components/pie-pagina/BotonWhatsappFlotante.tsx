import { useState } from "react";
import { X } from "lucide-react";
import { WHATSAPP_BASE_URL } from "@/data/constants";

export default function BotonWhatsappFlotante() {
  const [showTooltip, setShowTooltip] = useState(true);

  const whatsappUrl =
    `${WHATSAPP_BASE_URL}?text=` +
    encodeURIComponent(
      "Hola AUTEM, me gustaría recibir asesoría personalizada sobre los proyectos inmobiliarios en Cartagena y Bolívar."
    );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-auto">
      {/* Tooltip flotante emergente */}
      {showTooltip && (
        <div className="animate-fade-up relative flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-stone-950/95 px-4 py-2.5 text-xs text-white shadow-2xl backdrop-blur-xl">
          <div className="flex h-2 w-2 items-center justify-center">
            <span className="absolute h-2 w-2 rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="font-medium text-stone-200">
            ¿Dudas sobre inversión? <span className="text-emerald-400 font-bold">Asesor en línea</span>
          </span>
          <button
            onClick={() => setShowTooltip(false)}
            className="ml-2 text-stone-500 hover:text-white transition-colors"
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
        className="group relative flex items-center gap-3 rounded-full bg-emerald-600 px-5 py-3.5 text-white shadow-[0_10px_30px_rgba(16,185,129,0.4)] transition-all duration-300 hover:bg-emerald-500 hover:shadow-[0_15px_40px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 fill-current group-hover:rotate-12 transition-transform"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.7 4.19 1.88 5.83L2 22l4.3-1.83A9.95 9.95 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.85 0-3.57-.52-5.04-1.42l-.36-.22-2.55 1.09 1.09-2.55-.22-.36A7.95 7.95 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.55-5.95c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.13-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31s-.88.86-.88 2.1c0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">
          Asesor WhatsApp
        </span>
      </a>
    </div>
  );
}
