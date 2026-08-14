import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ProjectAmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearAlpha(0);

    const gold = new THREE.Color("#c9a45c");
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    const curves = [
      [-5.8, -3.4, -0.2, 2.8, 5.7],
      [-5.3, -2.1, 0.8, 3.7, 5.9],
      [-5.9, -4.1, -1.2, 1.9, 5.5],
    ];

    const materials: THREE.LineBasicMaterial[] = [];
    curves.forEach((xs, index) => {
      const curve = new THREE.CatmullRomCurve3(
        xs.map(
          (x, pointIndex) =>
            new THREE.Vector3(
              x,
              Math.sin(pointIndex * 1.45 + index) * (0.85 + index * 0.18),
              -0.5 - index * 0.3,
            ),
        ),
      );
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(120));
      const material = new THREE.LineBasicMaterial({
        color: gold,
        transparent: true,
        opacity: 0.17 - index * 0.025,
      });
      materials.push(material);
      orbitGroup.add(new THREE.Line(geometry, material));
    });

    const nodePositions: number[] = [];
    for (let index = 0; index < 30; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      nodePositions.push(
        side * (3.1 + Math.random() * 3.1),
        -3.2 + Math.random() * 6.4,
        -0.8 + Math.random() * 1.6,
      );
    }
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(nodePositions, 3));
    const nodeMaterial = new THREE.PointsMaterial({
      color: gold,
      size: 0.045,
      transparent: true,
      opacity: 0.72,
      sizeAttenuation: true,
    });
    const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(nodes);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const clock = new THREE.Clock();
    let frame = 0;
    const render = () => {
      const elapsed = clock.getElapsedTime();
      orbitGroup.rotation.z = Math.sin(elapsed * 0.16) * 0.035;
      orbitGroup.position.x += (pointerX * 0.28 - orbitGroup.position.x) * 0.025;
      orbitGroup.position.y += (-pointerY * 0.18 - orbitGroup.position.y) * 0.025;
      nodes.rotation.z = elapsed * 0.014;
      nodeMaterial.opacity = 0.58 + Math.sin(elapsed * 0.9) * 0.14;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      orbitGroup.children.forEach((child) => {
        if (child instanceof THREE.Line) child.geometry.dispose();
      });
      materials.forEach((material) => material.dispose());
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="project-ambient-canvas pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
