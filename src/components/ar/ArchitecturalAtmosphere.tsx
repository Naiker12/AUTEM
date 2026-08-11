import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Decorative Three.js scene that gives the AR section architectural depth. */
export function ArchitecturalAtmosphere() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 3.8, 7.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const composition = new THREE.Group();
    composition.rotation.set(-0.1, -0.48, 0);
    scene.add(composition);

    const grid = new THREE.GridHelper(8, 16, 0xc5a059, 0x7b6650);
    const gridMaterial = grid.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.24;
    composition.add(grid);

    const frameGeometry = new THREE.BoxGeometry(2.2, 1.25, 1.45);
    const frameMaterial = new THREE.MeshBasicMaterial({
      color: 0xc5a059,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 0.63;
    composition.add(frame);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(frameGeometry),
      new THREE.LineBasicMaterial({ color: 0xc5a059, transparent: true, opacity: 0.45 }),
    );
    edges.position.copy(frame.position);
    composition.add(edges);

    const particleCount = 72;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      particlePositions[offset] = (Math.random() - 0.5) * 7;
      particlePositions[offset + 1] = Math.random() * 3.2 - 0.2;
      particlePositions[offset + 2] = (Math.random() - 0.5) * 5;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particlesGeometry,
      new THREE.PointsMaterial({
        color: 0xe7c476,
        size: 0.035,
        transparent: true,
        opacity: 0.65,
        sizeAttenuation: true,
      }),
    );
    composition.add(particles);

    const render = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      composition.rotation.y += 0.0012;
      particles.rotation.y -= 0.0008;
      render();
    };

    const observer = new ResizeObserver(render);
    observer.observe(mount);
    render();
    if (!reducedMotion) animate();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      grid.geometry.dispose();
      gridMaterial.dispose();
      frameGeometry.dispose();
      frameMaterial.dispose();
      (edges.geometry as THREE.BufferGeometry).dispose();
      (edges.material as THREE.Material).dispose();
      particlesGeometry.dispose();
      (particles.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" aria-hidden="true" />;
}
