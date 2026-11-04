import { Expand, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface InteractivePanoramaProps {
  sourceUrl?: string;
  projectName?: string;
  onSwitchToPlan?: () => void;
}

export default function InteractivePanorama({
  sourceUrl,
  projectName = "Villa Paraíso",
}: InteractivePanoramaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);

  const activeSource = useMemo(() => {
    return sourceUrl || "/tours/villa-paraiso/index.htm";
  }, [sourceUrl]);

  const isHtmlTour = useMemo(() => {
    if (!activeSource) return false;
    const clean = activeSource.toLowerCase().trim();
    return (
      clean.endsWith(".htm") ||
      clean.endsWith(".html") ||
      clean.includes("/tours/") ||
      (clean.startsWith("http") && !clean.match(/\.(jpg|jpeg|png|webp|hdr)(\?|$)/i))
    );
  }, [activeSource]);

  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  // THREE.JS SPHERE RENDERER (Para imágenes equirrectangulares 360 si se pasa JPG/PNG)
  useEffect(() => {
    if (isHtmlTour) {
      setStatus("ready");
      return;
    }

    const host = canvasHostRef.current;
    if (!host) return;

    setStatus("loading");

    const scene = new THREE.Scene();
    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    host.replaceChildren(renderer.domElement);

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    let isDisposed = false;
    let material: THREE.MeshBasicMaterial | null = null;
    let mesh: THREE.Mesh | null = null;

    loader.load(
      activeSource,
      (texture) => {
        if (isDisposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        material = new THREE.MeshBasicMaterial({ map: texture });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        setStatus("ready");
      },
      undefined,
      (err) => {
        console.warn("Fallo al cargar textura 360 primaria:", err);
        loader.load("/images/villa-paraiso-360.jpg", (fallbackTex) => {
          if (isDisposed) return fallbackTex.dispose();
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          fallbackTex.generateMipmaps = false;
          material = new THREE.MeshBasicMaterial({ map: fallbackTex });
          mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          setStatus("ready");
        });
      },
    );

    let lon = 0;
    let lat = 0;
    let phi = 0;
    let theta = 0;

    let isUserInteracting = false;
    let onPointerDownPointerX = 0;
    let onPointerDownPointerY = 0;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      isUserInteracting = true;
      onPointerDownPointerX = event.clientX;
      onPointerDownPointerY = event.clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
      host.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isUserInteracting) return;
      lon = (onPointerDownPointerX - event.clientX) * 0.15 + onPointerDownLon;
      lat = (event.clientY - onPointerDownPointerY) * 0.15 + onPointerDownLat;
      lat = Math.max(-85, Math.min(85, lat));
    };

    const onPointerUp = (event: PointerEvent) => {
      isUserInteracting = false;
      try {
        if (host.hasPointerCapture(event.pointerId)) {
          host.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignorar
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.fov = THREE.MathUtils.clamp(camera.fov + event.deltaY * 0.05, 35, 95);
      camera.updateProjectionMatrix();
    };

    const onResize = () => {
      if (!host) return;
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerup", onPointerUp);
    host.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);

    let animationFrameId: number;
    const animate = () => {
      if (isDisposed) return;
      animationFrameId = requestAnimationFrame(animate);

      lat = Math.max(-85, Math.min(85, lat));
      phi = THREE.MathUtils.degToRad(90 - lat);
      theta = THREE.MathUtils.degToRad(lon);

      const x = 500 * Math.sin(phi) * Math.cos(theta);
      const y = 500 * Math.cos(phi);
      const z = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(x, y, z);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerup", onPointerUp);
      host.removeEventListener("wheel", onWheel);
      geometry.dispose();
      material?.map?.dispose();
      material?.dispose();
      renderer.dispose();
      host.replaceChildren();
    };
  }, [activeSource, isHtmlTour]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative size-full overflow-hidden bg-[#121811] select-none"
      aria-label={`Vista 360 de ${projectName}`}
    >
      {/* VISOR PRINCIPAL (Limpio, 100% Pantalla completa sin objetos flotantes encima) */}
      {isHtmlTour ? (
        <iframe
          src={activeSource}
          title={`Recorrido 360° - ${projectName}`}
          className="size-full border-0 bg-[#121811]"
          allow="accelerometer; gyroscope; magnetometer; fullscreen; xr-spatial-tracking"
          loading="eager"
          onLoad={() => setStatus("ready")}
        />
      ) : (
        <div ref={canvasHostRef} className="size-full cursor-grab active:cursor-grabbing" />
      )}

      {/* Indicador de carga discreto */}
      {status === "loading" && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#121811]/90 backdrop-blur-sm text-xs font-bold uppercase tracking-[0.24em] text-accent">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span>Cargando vista 360°</span>
          </div>
        </div>
      )}

      {/* Botón discreto de pantalla completa en la esquina */}
      <div className="absolute right-4 top-18 sm:top-20 lg:top-[80px] z-20">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex size-9 sm:size-10 items-center justify-center rounded-xl border border-white/20 bg-black/60 text-white shadow-xl backdrop-blur-xl hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Pantalla completa"
          title="Pantalla completa"
        >
          <Expand size={16} />
        </button>
      </div>
    </div>
  );
}
