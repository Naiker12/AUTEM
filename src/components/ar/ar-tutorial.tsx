import { Smartphone, X } from "lucide-react";
import { useModalA11y } from "@/hooks/useModalA11y";
import type { ARTutorialProps } from "./ar-types";

export function FirstTutorial({ onDismiss }: ARTutorialProps) {
  const modalRef = useModalA11y(true, onDismiss);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de realidad aumentada"
    >
      <div className="mx-auto max-w-sm rounded-3xl border border-stone-800 bg-stone-950 p-8 text-center text-white shadow-2xl">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-accent">
          <div className="relative">
            <Smartphone size={34} />
            <div className="absolute -right-1 -top-1 size-3 rounded-full bg-accent animate-ping" />
          </div>
        </div>
        <h3 className="font-serif text-2xl font-normal">Mueve tu celular</h3>
        <p className="mt-3 text-xs leading-relaxed text-stone-300">
          Apunta hacia el suelo de tu espacio para detectar la superficie. El modelo arquitectónico
          en 3D se colocará automáticamente en escala real.
        </p>
        <button
          onClick={onDismiss}
          className="mt-6 w-full rounded-xl bg-accent px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-accent-foreground transition-all hover:bg-accent/90 shadow-md"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

export function HelpTooltip({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute bottom-full left-0 z-40 mb-3 w-80 rounded-2xl border border-stone-800 bg-stone-950 p-6 text-white shadow-2xl animate-fade-up">
      <button
        onClick={onClose}
        className="absolute right-3.5 top-3.5 flex size-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-800 hover:text-white"
      >
        <X size={16} />
      </button>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">¿Cómo funciona?</p>
      <ul className="mt-4 space-y-2.5 text-xs text-stone-300">
        <li className="flex items-start gap-2.5">
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>Toca el botón para activar la experiencia WebXR / AR.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>Apunta al suelo de tu habitación para proyectar la maqueta 3D.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>Un dedo para mover, dos dedos para girar y escalar.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>Selecciona acabados para personalizarlos en tiempo real.</span>
        </li>
      </ul>
      <p className="mt-4 text-[11px] text-stone-500 border-t border-stone-800/80 pt-3">
        Funciona directamente en Safari/Chrome sin instalar aplicaciones adicionales.
      </p>
    </div>
  );
}
