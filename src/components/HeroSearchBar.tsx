import { ArrowRight, MapPin, Ruler } from "lucide-react";

export default function HeroSearchBar() {
  const handleExplore = () => {
    window.location.href = `${import.meta.env.BASE_URL}proyecto/lotes-360`;
  };

  return (
    <div className="animate-fade-up delay-300 mx-auto w-full max-w-3xl px-3">
      <div className="relative flex flex-col gap-3 rounded-2xl border border-white/20 bg-[#11140e]/80 p-3 text-left shadow-[0_25px_60px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:flex-row md:items-center md:rounded-full md:p-2">
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-white/5 px-4 py-3 md:rounded-full">
          <MapPin size={17} className="text-accent" />
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-accent">
              Ubicación
            </span>
            <span className="text-sm text-white">Cartagena · Colombia</span>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-white/5 px-4 py-3 md:rounded-full">
          <Ruler size={17} className="text-accent" />
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-accent">
              Lotes disponibles
            </span>
            <span className="text-sm text-white">Desde 1.080 m²</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExplore}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-foreground transition hover:bg-[#e0b662] md:rounded-full"
        >
          Ver lotes <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
