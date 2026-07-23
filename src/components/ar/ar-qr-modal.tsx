import { useState } from "react";
import { QrCode, X, Copy, Check, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getFullARUrl } from "@/data/ar-models";
import { useModalA11y } from "@/hooks/useModalA11y";
import type { ARQrModalProps } from "./ar-types";

export function ARQrModal({ propertySlug, propertyName, isOpen, onClose }: ARQrModalProps) {
  const [copied, setCopied] = useState(false);
  const modalRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const arUrl = getFullARUrl(propertySlug);

  const handleCopy = () => {
    navigator.clipboard.writeText(arUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-up">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Código QR para Realidad Aumentada de ${propertyName}`}
        className="relative flex flex-col items-center gap-5 rounded-3xl border border-stone-800 bg-stone-950 p-8 text-center text-white shadow-2xl max-w-md w-full"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-stone-400 hover:bg-stone-900 hover:text-white"
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        <div className="flex size-14 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-accent">
          <QrCode size={28} />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Realidad Aumentada
          </span>
          <h3 className="mt-1 font-serif text-2xl font-normal">{propertyName}</h3>
          <p className="mt-2 text-xs text-stone-400 leading-relaxed">
            Apunta con la cámara de tu smartphone a este código QR para proyectar el modelo 3D en tu
            espacio físico.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-5 rounded-2xl bg-white border-2 border-accent/40 shadow-xl">
          <QRCodeSVG value={arUrl} size={200} level="H" />
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <a
            href={arUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent py-3 text-xs font-semibold uppercase tracking-widest text-accent-foreground shadow-md transition-all hover:bg-accent/90"
          >
            <ExternalLink size={15} /> Abrir directamente
          </a>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-stone-800 bg-stone-900 py-3 text-xs font-medium uppercase tracking-widest text-stone-300 transition-colors hover:bg-stone-800 hover:text-white"
          >
            {copied ? (
              <>
                <Check size={15} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">¡Enlace copiado!</span>
              </>
            ) : (
              <>
                <Copy size={15} /> Copiar enlace
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
