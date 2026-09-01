import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const PANORAMA_URL = `${import.meta.env.BASE_URL}projects/lotes-360/masterplan-panorama-360.jpg`;

export default function HdrPanoramaViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

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
      render();
    };
    const up = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId))
        renderer.domElement.releasePointerCapture(event.pointerId);
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
    window.addEventListener("resize", resize);
    render();
    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      renderer.dispose();
      sphere.geometry.dispose();
      material.map?.dispose();
      material.dispose();
      container.replaceChildren();
    };
  }, []);

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
    </div>
  );
}
