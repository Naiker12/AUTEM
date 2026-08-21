import { useEffect, useRef } from "react";
import * as THREE from "three";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (start: number, end: number, value: number) => {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
};

export default function ProjectConstructionScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const section = canvas?.closest<HTMLElement>("#tecnologia");
    if (
      !canvas ||
      !host ||
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    scene.add(new THREE.HemisphereLight("#fff4dc", "#131510", 2.8));
    const sun = new THREE.DirectionalLight("#ffd98b", 4.2);
    sun.position.set(5, 8, 6);
    scene.add(sun);

    const building = new THREE.Group();
    building.rotation.y = -0.5;
    building.position.y = -2.1;
    scene.add(building);
    const levels: THREE.Group[] = [];
    const materials: THREE.Material[] = [];
    for (let level = 0; level < 9; level += 1) {
      const group = new THREE.Group();
      const width = 4.7 - level * 0.12;
      const depth = 3.35 - level * 0.075;
      const slabMaterial = new THREE.MeshStandardMaterial({
        color: "#292820",
        metalness: 0.52,
        roughness: 0.34,
      });
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: "#b48535",
        emissive: "#3a2105",
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.62,
        roughness: 0.15,
        metalness: 0.35,
      });
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: "#e0b65f",
        transparent: true,
        opacity: 0.86,
      });
      materials.push(slabMaterial, glassMaterial, edgeMaterial);
      const slabGeometry = new THREE.BoxGeometry(width, 0.12, depth);
      const slab = new THREE.Mesh(slabGeometry, slabMaterial);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(slabGeometry), edgeMaterial);
      const facade = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.78, 0.47, 0.035),
        glassMaterial,
      );
      facade.position.set(0, 0.3, depth / 2 + 0.015);
      group.add(slab, edge, facade);
      group.position.y = level * 0.62;
      group.visible = false;
      building.add(group);
      levels.push(group);
    }

    const baseGeometry = new THREE.CylinderGeometry(4.2, 4.65, 0.22, 6);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: "#1b1b17",
      roughness: 0.4,
      metalness: 0.65,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.16;
    building.add(base);
    materials.push(baseMaterial);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    let frame = 0;
    let smooth = 0;
    const render = () => {
      const rect = section.getBoundingClientRect();
      const raw = (innerHeight - rect.top) / (rect.height + innerHeight);
      smooth += (clamp(raw) - smooth) * 0.07;
      levels.forEach((level, index) => {
        const progress = ease(0.28 + index * 0.055, 0.47 + index * 0.055, smooth);
        level.visible = progress > 0.001;
        level.scale.set(1, Math.max(0.02, progress), 1);
        level.position.y = index * 0.62 - (1 - progress) * 0.72;
      });
      building.rotation.y = -0.68 + smooth * 0.65;
      camera.position.set(8.8 - smooth * 2.4, 6.8 - smooth * 1.2, 11 - smooth * 2.8);
      camera.lookAt(0, 1.5, 0);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments)
          object.geometry.dispose();
      });
      materials.forEach((material) => material.dispose());
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
