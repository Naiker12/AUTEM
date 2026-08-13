import { useState } from "react";
import { Heart, MapPin, PanelLeftClose, Ruler, SlidersHorizontal } from "lucide-react";

const LOTS = [
  {
    id: "L-01",
    area: "1.240 m²",
    status: "Disponible",
    detail: "Acceso principal",
    image: "/projects/lotes-360/acceso-render.png",
  },
  {
    id: "L-07",
    area: "1.080 m²",
    status: "Disponible",
    detail: "Entorno verde",
    image: "/projects/lotes-360/lot-l07-entorno-verde.png",
  },
  {
    id: "L-12",
    area: "1.360 m²",
    status: "Últimos lotes",
    detail: "Frente a quebrada",
    image: "/projects/lotes-360/lot-l12-quebrada.png",
  },
  {
    id: "L-18",
    area: "1.150 m²",
    status: "Disponible",
    detail: "Cerca a zona social",
    image: "/projects/lotes-360/lot-l18-zona-social.png",
  },
  {
    id: "L-24",
    area: "1.420 m²",
    status: "Vista al valle",
    detail: "Punto panorámico",
    image: "/projects/lotes-360/panoramica-render.png",
  },
];

interface LotSelectionPanelProps {
  onHide: () => void;
}

export default function LotSelectionPanel({ onHide }: LotSelectionPanelProps) {
  const [selectedId, setSelectedId] = useState("L-12");
  const [status, setStatus] = useState("Disponibles");
  const [saved, setSaved] = useState<string[]>([]);
  const filteredLots = status === "Todos" ? LOTS : LOTS.filter((lot) => lot.status !== "Reservado");
  const toggleSaved = (id: string) =>
    setSaved((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );

  return (
    <aside className="absolute left-0 top-0 z-20 hidden h-full w-[29rem] overflow-visible bg-[#faf8f4] text-[#1b1a18] shadow-[20px_0_55px_rgba(0,0,0,0.18)] xl:flex xl:flex-col">
      <header className="border-b border-black/10 px-8 pb-5 pt-7">
        <div className="flex items-center gap-3">
          <span className="text-xl text-accent">☰</span>
          <span className="font-serif text-2xl tracking-tight">AUTEM</span>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
            Proyecto único
          </span>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-5 text-[11px]">
          <label>
            Área <strong className="float-right">1.080–1.420 m²</strong>
            <input
              type="range"
              min="1080"
              max="1420"
              value="1420"
              readOnly
              className="mt-2 block w-full accent-accent"
            />
          </label>
          <label>
            Precio <strong className="float-right">$210–$360M</strong>
            <input
              type="range"
              min="210"
              max="360"
              value="360"
              readOnly
              className="mt-2 block w-full accent-accent"
            />
          </label>
        </div>
        <div className="mt-5 flex overflow-hidden rounded-lg border border-black/15 text-[11px] font-semibold">
          {["Disponibles", "Reservados", "Todos"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`flex-1 py-3 transition ${status === item ? "bg-accent text-accent-foreground" : "bg-white hover:bg-black/5"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-black/55 hover:text-accent"
        >
          <SlidersHorizontal size={13} /> Filtros avanzados
        </button>
      </header>

      <div className="flex items-center justify-between px-8 pb-3 pt-6">
        <strong className="font-serif text-xl">{filteredLots.length} lotes</strong>
        <button
          type="button"
          className="text-[10px] font-bold uppercase tracking-wider text-black/55"
        >
          Área ↓
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-7 pb-7">
        {filteredLots.map((lot) => {
          const selected = lot.id === selectedId;
          const isSaved = saved.includes(lot.id);
          return (
            <article
              key={lot.id}
              className={`relative flex min-h-36 w-full overflow-hidden rounded-xl border text-left transition ${selected ? "border-accent shadow-md" : "border-black/10 bg-white hover:border-accent/60"}`}
            >
              <button
                type="button"
                onClick={() => setSelectedId(lot.id)}
                className="flex w-full text-left"
              >
                <div className="w-[54%] p-4">
                  <span
                    className={`rounded px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${lot.status === "Disponible" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}
                  >
                    {lot.status}
                  </span>
                  <strong className="mt-4 block font-serif text-2xl">{lot.id}</strong>
                  <p className="mt-1 text-[10px] text-black/55">{lot.detail}</p>
                  <div className="mt-4 flex justify-between border-t border-black/10 pt-2 text-[10px]">
                    <span>
                      Desde <strong>$210M</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Ruler size={12} /> {lot.area}
                    </span>
                  </div>
                </div>
                <div className="w-[46%] bg-[#e8e5de]">
                  <img
                    src={lot.image}
                    alt={`Render de ${lot.detail} para el lote ${lot.id}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </button>
              <button
                type="button"
                onClick={() => toggleSaved(lot.id)}
                className={`absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white shadow ${isSaved ? "text-accent" : "text-black/45"}`}
                aria-label="Guardar lote"
              >
                <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
              </button>
            </article>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onHide}
        className="absolute -right-5 bottom-8 flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl transition hover:scale-105"
        aria-label="Ocultar catálogo de lotes"
      >
        <PanelLeftClose size={17} />
      </button>
      <div className="absolute bottom-5 left-8 flex items-center gap-2 text-[10px] text-black/45">
        <MapPin size={13} className="text-accent" /> Cartagena · Parcelación campestre
      </div>
    </aside>
  );
}
