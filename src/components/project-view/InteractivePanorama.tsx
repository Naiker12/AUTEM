import { Compass, Expand, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const PANORAMA_URL = `${import.meta.env.BASE_URL}projects/lotes-360/masterplan-panorama-360.jpg`;

type PanoramaControls = { reset: () => void; zoom: (delta: number) => void };

export default function InteractivePanorama() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<PanoramaControls | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const material = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(18, 96, 64), material);
    scene.add(sphere);
    let disposed = false;
    let longitude = 0;
    let latitude = 0;
    const render = () => {
      camera.lookAt(
        -Math.sin(longitude) * Math.cos(latitude),
        Math.sin(latitude),
        Math.cos(longitude) * Math.cos(latitude),
      );
      renderer.render(scene, camera);
    };
    const updateHeading = () => setHeading(((longitude * 180) / Math.PI + 360) % 360);
    const setFov = (nextFov: number) => {
      camera.fov = THREE.MathUtils.clamp(nextFov, 38, 90);
      camera.updateProjectionMatrix();
      render();
    };
    controlsRef.current = {
      reset: () => {
        longitude = 0;
        latitude = 0;
        setFov(70);
        updateHeading();
      },
      zoom: (delta) => setFov(camera.fov + delta),
    };

    if (PANORAMA_URL.endsWith(".hdr")) {
      new RGBELoader().load(
        PANORAMA_URL,
        (loaded) => {
          if (disposed) return loaded.dispose();
          loaded.mapping = THREE.EquirectangularReflectionMapping;
          material.map = loaded;
          material.needsUpdate = true;
          setStatus("ready");
          render();
        },
        undefined,
        () => !disposed && setStatus("error"),
      );
    } else {
      new THREE.TextureLoader().load(
        PANORAMA_URL,
        (loaded) => {
          if (disposed) return loaded.dispose();
          loaded.mapping = THREE.EquirectangularReflectionMapping;
          loaded.colorSpace = THREE.SRGBColorSpace;
          material.map = loaded;
          material.needsUpdate = true;
          setStatus("ready");
          render();
        },
        undefined,
        () => !disposed && setStatus("error"),
      );
    }

    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    const down = (event: PointerEvent) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!dragging) return;
      longitude -= (event.clientX - previousX) * 0.006;
      latitude = THREE.MathUtils.clamp(latitude + (event.clientY - previousY) * 0.006, -1.35, 1.35);
      previousX = event.clientX;
      previousY = event.clientY;
      updateHeading();
      render();
    };
    const up = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId))
        renderer.domElement.releasePointerCapture(event.pointerId);
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      setFov(camera.fov + event.deltaY * 0.04);
    };
    const resize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      render();
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", up);
    renderer.domElement.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("resize", resize);
    render();
    return () => {
      disposed = true;
      controlsRef.current = null;
      window.removeEventListener("resize", resize);
      renderer.dispose();
      sphere.geometry.dispose();
      material.map?.dispose();
      material.dispose();
      container.replaceChildren();
    };
  }, []);

  const fullscreen = () => containerRef.current?.requestFullscreen?.();

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      aria-label="Tour 360 del proyecto"
    >
      {status === "loading" && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[#121811] text-xs font-bold uppercase tracking-[0.24em] text-accent">
          Cargando tour 360°
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[#121811] px-6 text-center text-sm text-white/70">
          No fue posible cargar el tour 360.
        </div>
      )}
      {status === "ready" && (
        <>
          <div className="absolute right-5 top-24 z-20 flex flex-col items-center gap-3 md:right-8">
            <button
              type="button"
              onClick={() => controlsRef.current?.reset()}
              className="relative flex size-20 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow-xl backdrop-blur-xl"
              aria-label="Centrar vista"
            >
              <Compass
                className="size-9 text-accent"
                style={{ transform: `rotate(${-heading}deg)` }}
              />
              <span className="absolute top-1.5 text-[8px] font-bold">N</span>
            </button>
            <div className="grid overflow-hidden rounded-2xl border border-white/20 bg-black/45 shadow-xl backdrop-blur-xl">
              <button
                type="button"
                onClick={() => controlsRef.current?.zoom(-8)}
                className="grid size-11 place-items-center border-b border-white/15 text-white hover:bg-white/15"
                aria-label="Acercar"
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                onClick={() => controlsRef.current?.zoom(8)}
                className="grid size-11 place-items-center border-b border-white/15 text-white hover:bg-white/15"
                aria-label="Alejar"
              >
                <Minus size={18} />
              </button>
              <button
                type="button"
                onClick={() => controlsRef.current?.reset()}
                className="grid size-11 place-items-center border-b border-white/15 text-white hover:bg-white/15"
                aria-label="Restablecer vista"
              >
                <RotateCcw size={17} />
              </button>
              <button
                type="button"
                onClick={fullscreen}
                className="grid size-11 place-items-center text-white hover:bg-white/15"
                aria-label="Pantalla completa"
              >
                <Expand size={17} />
              </button>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/70 backdrop-blur-xl md:block">
            Arrastra para recorrer · Rueda para acercar
          </div>
        </>
      )}
    </div>
  );
}
