import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Building2, Loader2, RotateCcw, Trees, Users } from "lucide-react";
import { FINISHES } from "@/data/constants";
import { AREnvironmentToggle } from "./ar-environment-toggle";
import type { LightingMode } from "./ar-types";

interface ThreePropertyViewerProps {
  modelSrc: string;
  selectedFinish: number | null;
  onFinishChange: (index: number | null) => void;
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
}

const MODE_COLORS: Record<LightingMode, { sky: number; fog: number; terrain: number }> = {
  day: { sky: 0xbfd9e8, fog: 0xcfe0e4, terrain: 0x6f8057 },
  night: { sky: 0x07102d, fog: 0x0d1636, terrain: 0x1d2d28 },
  studio: { sky: 0x171717, fog: 0x171717, terrain: 0x4b453a },
};

export function ThreePropertyViewer({
  modelSrc,
  selectedFinish,
  onFinishChange,
  lightingMode,
  onLightingChange,
}: ThreePropertyViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const originalColorRef = useRef<THREE.Color | null>(null);
  const treesRef = useRef<THREE.Group | null>(null);
  const peopleRef = useRef<THREE.Group | null>(null);
  const initialModeRef = useRef(lightingMode);
  const visualsRef = useRef<{
    scene: THREE.Scene;
    terrain: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
    hemisphere: THREE.HemisphereLight;
    keyLight: THREE.DirectionalLight;
  } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [showTrees, setShowTrees] = useState(true);
  const [showPeople, setShowPeople] = useState(true);
  const showTreesRef = useRef(showTrees);
  const showPeopleRef = useRef(showPeople);
  showTreesRef.current = showTrees;
  showPeopleRef.current = showPeople;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    setStatus("loading");

    const colors = MODE_COLORS[initialModeRef.current];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.sky);
    scene.fog = new THREE.Fog(colors.fog, 14, 40);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    // The supplied model is wide on X and shallow on Z. Start from its facade
    // side so visitors see the architectural face rather than the service wall.
    camera.position.set(2.8, 3.8, -8.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = initialModeRef.current === "night" ? 0.75 : 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.8;
    controls.maxDistance = 12;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.maxPolarAngle = Math.PI * 0.43;
    controls.minAzimuthAngle = Math.PI * 0.55;
    controls.maxAzimuthAngle = Math.PI * 1.45;
    controls.target.set(0, 1.8, 0);
    controlsRef.current = controls;

    const hemisphere = new THREE.HemisphereLight(0xe6f4ff, 0x4a3320, 1.7);
    scene.add(hemisphere);
    const keyLight = new THREE.DirectionalLight(0xfff1ce, 3.2);
    keyLight.position.set(7, 10, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);
    scene.add(keyLight.target);
    keyLight.target.position.set(0, 0, 0);

    const terrainGeometry = new THREE.PlaneGeometry(20, 20, 40, 40);
    const terrainPositions = terrainGeometry.attributes.position;
    for (let i = 0; i < terrainPositions.count; i += 1) {
      const x = terrainPositions.getX(i);
      const y = terrainPositions.getY(i);
      const height = Math.sin(x * 0.45) * Math.cos(y * 0.36) * 0.13;
      terrainPositions.setZ(i, height);
    }
    terrainGeometry.computeVertexNormals();
    const terrain = new THREE.Mesh(
      terrainGeometry,
      new THREE.MeshStandardMaterial({ color: colors.terrain, roughness: 0.94, metalness: 0 }),
    );
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    const grid = new THREE.GridHelper(14, 14, 0xd9b36a, 0x80906d);
    const gridMaterial = grid.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.22;
    grid.position.y = 0.018;
    scene.add(grid);

    const trees = new THREE.Group();
    const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.12, 0.7, 8);
    const foliageGeometry = new THREE.ConeGeometry(0.48, 1.35, 10);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4b321f, roughness: 0.9 });
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x315b35, roughness: 0.88 });
    [
      [-3.4, -1.6, 1.05],
      [2.9, -1.8, 1.2],
      [-3.7, 2.3, 0.9],
      [3.9, 2.2, 1.1],
      [-2.4, 3.6, 0.82],
    ].forEach(([x, z, scale]) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      trunk.position.y = 0.35;
      foliage.position.y = 1.25;
      trunk.castShadow = true;
      foliage.castShadow = true;
      tree.add(trunk, foliage);
      tree.position.set(x, 0.03, z);
      tree.scale.setScalar(scale);
      trees.add(tree);
    });
    trees.visible = showTreesRef.current;
    scene.add(trees);
    treesRef.current = trees;

    const people = new THREE.Group();
    const bodyGeometry = new THREE.CylinderGeometry(0.075, 0.1, 0.55, 10);
    const headGeometry = new THREE.SphereGeometry(0.12, 12, 10);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x26364a, roughness: 0.78 });
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xc78f6d, roughness: 0.9 });
    [
      [-1.55, 2.1, 0.96],
      [1.85, 1.8, 1.04],
    ].forEach(([x, z, scale]) => {
      const person = new THREE.Group();
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      const head = new THREE.Mesh(headGeometry, headMaterial);
      body.position.y = 0.34;
      head.position.y = 0.73;
      body.castShadow = true;
      head.castShadow = true;
      person.add(body, head);
      person.position.set(x, 0.03, z);
      person.scale.setScalar(scale);
      people.add(person);
    });
    people.visible = showPeopleRef.current;
    scene.add(people);
    peopleRef.current = people;

    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: initialModeRef.current === "night" ? 0.06 : 0.22,
      depthWrite: false,
    });
    const cloudGeometry = new THREE.SphereGeometry(1, 16, 12);
    const clouds = new THREE.Group();
    [
      [-6, 5.6, -7, 1.7],
      [3.5, 6.8, -8, 1.25],
      [8, 4.8, -4, 1.9],
    ].forEach(([x, y, z, scale]) => {
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(x, y, z);
      cloud.scale.set(scale, scale * 0.36, scale * 0.7);
      clouds.add(cloud);
    });
    scene.add(clouds);

    visualsRef.current = { scene, terrain, hemisphere, keyLight };
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.load(
      modelSrc,
      (gltf) => {
        if (cancelled) return;
        const model = gltf.scene;
        model.rotation.set(0, 0, 0);
        model.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        const scale = 6.2 / maxDimension;
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = true;
          child.receiveShadow = true;
          const material = Array.isArray(child.material) ? child.material[0] : child.material;
          if (!materialRef.current && material instanceof THREE.MeshStandardMaterial) {
            materialRef.current = material;
            originalColorRef.current = material.color.clone();
          }
        });
        modelRef.current = model;
        scene.add(model);
        setStatus("ready");
      },
      undefined,
      () => setStatus("error"),
    );

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    let frameId = 0;
    const render = () => {
      frameId = requestAnimationFrame(render);
      clouds.position.x = Math.sin(performance.now() * 0.00008) * 0.45;
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      terrainGeometry.dispose();
      terrain.material.dispose();
      grid.geometry.dispose();
      gridMaterial.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      trunkGeometry.dispose();
      foliageGeometry.dispose();
      trunkMaterial.dispose();
      foliageMaterial.dispose();
      bodyGeometry.dispose();
      headGeometry.dispose();
      bodyMaterial.dispose();
      headMaterial.dispose();
      renderer.domElement.remove();
      visualsRef.current = null;
      controlsRef.current = null;
      modelRef.current = null;
      materialRef.current = null;
      originalColorRef.current = null;
      treesRef.current = null;
      peopleRef.current = null;
    };
  }, [modelSrc]);

  useEffect(() => {
    const visual = visualsRef.current;
    if (!visual) return;
    const colors = MODE_COLORS[lightingMode];
    visual.scene.background = new THREE.Color(colors.sky);
    visual.scene.fog = new THREE.Fog(colors.fog, 14, 40);
    visual.terrain.material.color.setHex(colors.terrain);
    visual.hemisphere.intensity = lightingMode === "night" ? 0.62 : 1.7;
    visual.keyLight.intensity = lightingMode === "night" ? 1.15 : 3.2;
  }, [lightingMode]);

  useEffect(() => {
    if (!materialRef.current) return;
    if (selectedFinish === null && originalColorRef.current) {
      materialRef.current.color.copy(originalColorRef.current);
    } else if (selectedFinish !== null) {
      materialRef.current.color.set(FINISHES[selectedFinish].color);
    }
    materialRef.current.needsUpdate = true;
  }, [selectedFinish]);

  useEffect(() => {
    if (treesRef.current) treesRef.current.visible = showTrees;
  }, [showTrees]);

  useEffect(() => {
    if (peopleRef.current) peopleRef.current.visible = showPeople;
  }, [showPeople]);

  const resetCamera = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(2.8, 3.8, -8.6);
    controls.target.set(0, 1.8, 0);
    controls.update();
  };

  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-3xl border border-stone-800 bg-slate-950 shadow-2xl sm:min-h-[520px]">
      <div ref={mountRef} className="absolute inset-0 touch-none" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/35 to-transparent" />
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/45 text-white backdrop-blur-[2px]">
          <Loader2 size={28} className="animate-spin text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent">
            Preparando terreno
          </span>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-x-6 bottom-6 z-20 rounded-2xl border border-amber-300/20 bg-slate-950/90 p-4 text-center text-xs text-stone-200 backdrop-blur-md">
          No pudimos cargar la maqueta 3D. Intenta recargar la página.
        </div>
      )}
      <div className="absolute left-3 top-3 z-20 sm:left-6 sm:top-6">
        <AREnvironmentToggle currentTheme={lightingMode} onThemeChange={onLightingChange} />
      </div>
      <div className="absolute right-4 top-16 z-20 flex flex-col gap-2 sm:right-6 sm:top-6">
        <button
          onClick={() => setShowTrees((visible) => !visible)}
          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-colors ${showTrees ? "border-accent/60 bg-accent text-accent-foreground" : "border-white/20 bg-black/35 text-white hover:bg-black/55"}`}
          aria-pressed={showTrees}
        >
          <Trees size={14} />
          Árboles
        </button>
        <button
          onClick={() => setShowPeople((visible) => !visible)}
          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-colors ${showPeople ? "border-accent/60 bg-accent text-accent-foreground" : "border-white/20 bg-black/35 text-white hover:bg-black/55"}`}
          aria-pressed={showPeople}
        >
          <Users size={14} />
          Personas
        </button>
      </div>
      <button
        onClick={resetCamera}
        className="absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-accent hover:text-accent-foreground sm:right-6 sm:top-[7.5rem]"
        aria-label="Restablecer cámara"
      >
        <RotateCcw size={15} />
      </button>
      <div className="pointer-events-none absolute bottom-20 left-5 z-10 hidden items-center gap-2 rounded-full border border-white/15 bg-slate-950/65 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/80 backdrop-blur-md sm:flex">
        <Building2 size={13} className="text-accent" />
        Vista arquitectónica
      </div>
      <div className="absolute bottom-5 left-1/2 z-20 flex max-w-[92%] -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-slate-950/85 px-3 py-2 text-white shadow-xl backdrop-blur-xl sm:gap-3 sm:px-5">
        <button
          onClick={() => onFinishChange(null)}
          className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${selectedFinish === null ? "bg-accent text-accent-foreground" : "text-stone-400 hover:text-white"}`}
        >
          Original
        </button>
        {FINISHES.map((finish, index) => (
          <button
            key={finish.id}
            onClick={() => onFinishChange(index)}
            className={`size-6 rounded-full border-2 shadow-md ${selectedFinish === index ? "scale-110 border-white ring-2 ring-accent/50" : "border-white/25"}`}
            style={{ backgroundColor: finish.color }}
            title={finish.label}
            aria-label={`Vista previa ${finish.label}`}
          />
        ))}
      </div>
    </div>
  );
}
