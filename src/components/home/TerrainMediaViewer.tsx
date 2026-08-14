export default function TerrainMediaViewer() {
  return (
    <div
      id="recorrido-aereo"
      className="relative aspect-video overflow-hidden rounded-[1.6rem] bg-black shadow-[0_28px_85px_rgba(37,30,18,0.22)]"
    >
      <iframe
        src="https://www.youtube-nocookie.com/embed/EmfqlsLyb0I?rel=0&modestbranding=1&enablejsapi=1"
        title="Recorrido aéreo de Lotes 360°"
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
