import { Link } from "@tanstack/react-router";
import { FileText, Images, LayoutTemplate, MessageCircle, X } from "lucide-react";
import type { Property } from "@/data/properties";
import type { ViewMode } from "./types";

interface ProjectDetailsDrawerProps {
  property: Property;
  onClose: () => void;
  onSelectMode: (mode: ViewMode) => void;
}

export default function ProjectDetailsDrawer({
  property,
  onClose,
  onSelectMode,
}: ProjectDetailsDrawerProps) {
  return (
    <aside
      className="h-full w-full max-w-md overflow-y-auto border-r border-white/10 bg-[#151311]/95 p-6 shadow-2xl backdrop-blur-xl md:p-8"
      onClick={(event) => event.stopPropagation()}
      aria-label="Información del proyecto"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.24em] text-accent">
          AUTEM / Proyecto
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-accent hover:text-accent"
          aria-label="Cerrar menú"
        >
          <X size={19} />
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <img src={property.image} alt="" className="aspect-[16/8] w-full object-cover opacity-80" />
      </div>
      <h2 className="mt-7 font-serif text-4xl leading-none text-white">{property.name}</h2>
      <p className="mt-3 text-sm text-white/60">{property.location}</p>

      <div className="mt-8 grid grid-cols-2 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/5">
        <div className="p-4">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-white/45">
            Área
          </span>
          <strong className="mt-2 block font-serif text-2xl">{property.m2} m²</strong>
        </div>
        <div className="p-4">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-white/45">
            Precio desde
          </span>
          <strong className="mt-2 block font-serif text-lg text-accent">{property.price}</strong>
        </div>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-white/70">{property.longDescription}</p>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() => onSelectMode("lot")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-4 text-xs font-bold uppercase tracking-widest text-accent-foreground transition hover:bg-accent/90"
        >
          <LayoutTemplate size={16} /> Ver vista del lote
        </button>
        <button
          type="button"
          onClick={() => onSelectMode("gallery")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:border-accent hover:text-accent"
        >
          <Images size={16} /> Ver galería
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Hola AUTEM, me interesa ${property.name}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:border-accent hover:text-accent"
        >
          <MessageCircle size={16} /> Solicitar información
        </a>
        <Link
          to="/properties/$id"
          params={{ id: property.slug }}
          className="flex w-full items-center justify-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white/60 transition hover:text-white"
        >
          <FileText size={15} /> Ficha completa
        </Link>
      </div>
    </aside>
  );
}
