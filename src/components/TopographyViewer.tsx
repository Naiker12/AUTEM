import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Sun, Route, Mountain } from "lucide-react";

type ViewMode = "terrain" | "route" | "sun";

export default function TopographyViewer({ active }: { active: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<ViewMode>("terrain");
  const [mode, setMode] = useState<ViewMode>("terrain");

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07142a);
    scene.fog = new THREE.Fog(0x07142a, 16, 33);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(8, 8, 10);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 7;
    controls.maxDistance = 18;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0x83b5dd, 0x132217, 1.8));
    const sun = new THREE.DirectionalLight(0xffd68a, 3.5);
    sun.position.set(7, 10, 4);
    scene.add(sun);

    const geometry = new THREE.PlaneGeometry(18, 18, 72, 72);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      positions.setZ(i, Math.sin(x * 0.55) * Math.cos(y * 0.42) * 0.46 + Math.sin(y) * 0.16);
    }
    geometry.computeVertexNormals();
    const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x314d38, roughness: 0.88 });
    const terrain = new THREE.Mesh(geometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    scene.add(terrain);

    const contours = new THREE.GridHelper(18, 18, 0xc5a059, 0x4c7257);
    (contours.material as THREE.LineBasicMaterial).transparent = true;
    (contours.material as THREE.LineBasicMaterial).opacity = 0.36;
    contours.position.y = 0.06;
    scene.add(contours);

    const routePoints = [
      new THREE.Vector3(-6, 1.1, -5),
      new THREE.Vector3(5.5, 1.4, -4),
      new THREE.Vector3(5.8, 1.5, 4.8),
      new THREE.Vector3(-5, 1.25, 4.4),
    ];
    const route = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(routePoints),
      new THREE.LineDashedMaterial({ color: 0xc5a059, dashSize: 0.35, gapSize: 0.2 }),
    );
    route.computeLineDistances();
    scene.add(route);
    const drone = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd782 }),
    );
    scene.add(drone);
    const scan = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 2.7, 48),
      new THREE.MeshBasicMaterial({
        color: 0xc5a059,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      }),
    );
    scan.rotation.x = -Math.PI / 2;
    scan.position.y = 0.12;
    scene.add(scan);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    let frame = 0;
    const animate = () => {
      if (!active) return;
      frame = requestAnimationFrame(animate);
      const time = performance.now() * 0.00015;
      const selectedMode = modeRef.current;
      const index = time % 4;
      const a = routePoints[Math.floor(index)];
      const b = routePoints[(Math.floor(index) + 1) % 4];
      drone.position.lerpVectors(a, b, index % 1);
      const routeVisible = selectedMode === "route";
      route.visible = routeVisible;
      drone.visible = routeVisible;
      scan.visible = selectedMode === "terrain";
      scan.scale.setScalar(0.7 + (Math.sin(time * 8) + 1) * 0.3);
      sun.visible = selectedMode !== "terrain";
      sun.position.set(
        Math.cos(time * 2) * 9,
        selectedMode === "sun" ? 8 : 10,
        Math.sin(time * 2) * 8,
      );
      terrainMaterial.color.setHex(selectedMode === "sun" ? 0x765c34 : 0x314d38);
      controls.update();
      renderer.render(scene, camera);
    };
    if (active) animate();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      geometry.dispose();
      terrainMaterial.dispose();
      contours.geometry.dispose();
      (contours.material as THREE.Material).dispose();
      route.geometry.dispose();
      (route.material as THREE.Material).dispose();
      drone.geometry.dispose();
      (drone.material as THREE.Material).dispose();
      scan.geometry.dispose();
      (scan.material as THREE.Material).dispose();
      renderer.domElement.remove();
    };
  }, [active]);

  const options: { id: ViewMode; label: string; icon: typeof Mountain }[] = [
    { id: "terrain", label: "Terreno", icon: Mountain },
    { id: "route", label: "Vuelo", icon: Route },
    { id: "sun", label: "Luz", icon: Sun },
  ];
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#07142a]">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute left-4 top-4 z-10 flex rounded-full border border-white/15 bg-black/40 p-1 backdrop-blur-md">
        {options.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            aria-label={`Visualizar ${label.toLowerCase()}`}
            onClick={() => setMode(id)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 text-[8px] font-bold uppercase tracking-wider transition-colors sm:px-3 sm:text-[9px] ${mode === id ? "bg-accent text-accent-foreground" : "text-white/60 hover:text-white"}`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
