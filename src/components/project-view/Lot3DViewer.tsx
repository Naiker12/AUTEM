import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type LotHotspot = "general" | "acceso" | "social" | "mirador" | "naturaleza";

const HOTSPOTS: { id: LotHotspot; label: string; position: [number, number, number] }[] = [
  { id: "general", label: "Vista general", position: [10, 11, 15] },
  { id: "acceso", label: "Acceso vial", position: [-11, 5, 10] },
  { id: "social", label: "Zona social", position: [5, 4, 8] },
  { id: "mirador", label: "Mirador", position: [9, 8, -7] },
  { id: "naturaleza", label: "Borde natural", position: [-8, 4, -8] },
];

export default function Lot3DViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraTargetRef = useRef(new THREE.Vector3(10, 11, 15));
  const lookTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const [isReady, setIsReady] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<LotHotspot>("general");

  const moveTo = (hotspot: (typeof HOTSPOTS)[number]) => {
    cameraTargetRef.current.set(...hotspot.position);
    lookTargetRef.current.set(
      hotspot.id === "acceso" ? -3 : hotspot.id === "naturaleza" ? -4 : 0,
      0,
      hotspot.id === "mirador" ? -2 : 0,
    );
    setActiveHotspot(hotspot.id);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9db7c0);
    scene.fog = new THREE.Fog(0x9db7c0, 17, 38);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.copy(cameraTargetRef.current);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    scene.add(new THREE.HemisphereLight(0xe8f0ee, 0x33512d, 2.2));
    const sun = new THREE.DirectionalLight(0xffe0ad, 3.5);
    sun.position.set(8, 14, 7);
    scene.add(sun);

    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 23, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x6c9654, roughness: 0.92 }),
    );
    const positions = terrain.geometry.attributes.position as THREE.BufferAttribute;
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      positions.setZ(index, Math.sin(x * 0.45) * 0.32 + Math.cos(y * 0.5) * 0.24);
    }
    positions.needsUpdate = true;
    terrain.geometry.computeVertexNormals();
    terrain.rotation.x = -Math.PI / 2;
    scene.add(terrain);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 24),
      new THREE.MeshStandardMaterial({ color: 0xb7a486, roughness: 1 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = -0.32;
    road.position.set(-2.7, 0.05, 0);
    scene.add(road);

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 24),
      new THREE.MeshStandardMaterial({ color: 0x4c8e9b, roughness: 0.24, metalness: 0.15 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = 0.19;
    water.position.set(1.4, 0.08, 0);
    scene.add(water);

    const lotMaterial = new THREE.LineBasicMaterial({
      color: 0xe4bd74,
      transparent: true,
      opacity: 0.8,
    });
    for (let x = -10; x <= 10; x += 5) {
      for (let z = -8; z <= 8; z += 4) {
        if (Math.abs(x) < 4) continue;
        const outline = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(4.4, 3.4)),
          lotMaterial,
        );
        outline.rotation.x = -Math.PI / 2;
        outline.position.set(x, 0.12, z);
        scene.add(outline);
      }
    }

    const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x214e2b, roughness: 0.9 });
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x69452b, roughness: 1 });
    for (let index = 0; index < 90; index += 1) {
      const x = -13 + ((index * 31) % 260) / 10;
      const z = -10 + ((index * 47) % 205) / 10;
      if (Math.abs(x) < 4) continue;
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.6, 6), trunkMaterial);
      trunk.position.y = 0.3;
      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(0.45 + (index % 3) * 0.1, 1.3, 7),
        treeMaterial,
      );
      crown.position.y = 1.05;
      tree.add(trunk, crown);
      tree.position.set(x, 0, z);
      scene.add(tree);
    }

    const pavilion = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.35, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xf0eee5, roughness: 0.55 }),
    );
    pavilion.position.set(5, 0.55, 1);
    scene.add(pavilion);

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let frame = 0;
    const animate = () => {
      camera.position.lerp(cameraTargetRef.current, 0.045);
      const currentLook = new THREE.Vector3();
      camera.getWorldDirection(currentLook);
      currentLook.multiplyScalar(8).add(camera.position).lerp(lookTargetRef.current, 0.06);
      camera.lookAt(currentLook);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    const readyTimer = window.setTimeout(() => setIsReady(true), 450);
    animate();

    return () => {
      window.clearTimeout(readyTimer);
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          if (Array.isArray(object.material))
            object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-[#9db7c0]">
      <canvas ref={canvasRef} className="h-full w-full" aria-label="Maqueta 3D del lote" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#132019]/85 text-center backdrop-blur-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
              Lotes 360°
            </span>
            <p className="mt-3 text-sm text-white/80">Cargando maqueta del terreno…</p>
          </div>
        </div>
      )}
      <div className="absolute right-5 top-20 z-10 flex max-w-[10rem] flex-col gap-2 md:right-8 md:top-28">
        {HOTSPOTS.slice(1).map((hotspot) => (
          <button
            key={hotspot.id}
            type="button"
            onClick={() => moveTo(hotspot)}
            className={`rounded-xl border px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md transition ${activeHotspot === hotspot.id ? "border-accent bg-accent text-accent-foreground" : "border-white/20 bg-black/35 text-white hover:border-accent hover:bg-black/55"}`}
          >
            {hotspot.label}
          </button>
        ))}
      </div>
    </div>
  );
}
