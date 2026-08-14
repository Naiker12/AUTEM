import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function FounderBuildingScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(7.4, 5.3, 9.8);
    camera.lookAt(0, 1.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const structure = new THREE.Group();
    structure.rotation.y = -0.42;
    structure.position.y = -0.4;
    scene.add(structure);

    const gold = new THREE.LineBasicMaterial({
      color: 0xd8b15f,
      transparent: true,
      opacity: 0.82,
    });
    const faintGold = new THREE.LineBasicMaterial({
      color: 0xb9924b,
      transparent: true,
      opacity: 0.28,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x263238,
      transparent: true,
      opacity: 0.2,
      roughness: 0.24,
      metalness: 0.25,
      side: THREE.DoubleSide,
    });

    const levelCount = 8;
    for (let level = 0; level < levelCount; level += 1) {
      const taper = 1 - level * 0.035;
      const width = 4.3 * taper;
      const depth = 2.75 * taper;
      const y = level * 0.62;
      const slabGeometry = new THREE.BoxGeometry(width, 0.09, depth);
      const slab = new THREE.Mesh(
        slabGeometry,
        new THREE.MeshBasicMaterial({
          color: level === levelCount - 1 ? 0xd8b15f : 0x171a1b,
          transparent: true,
          opacity: level === levelCount - 1 ? 0.35 : 0.45,
        }),
      );
      slab.position.y = y;
      structure.add(slab);

      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(slabGeometry), gold);
      outline.position.y = y;
      structure.add(outline);
    }

    const core = new THREE.Mesh(new THREE.BoxGeometry(1.18, 4.45, 1.12), glass);
    core.position.set(0.45, 2.15, 0.05);
    structure.add(core);
    const coreEdges = new THREE.LineSegments(new THREE.EdgesGeometry(core.geometry), faintGold);
    coreEdges.position.copy(core.position);
    structure.add(coreEdges);

    const columnGeometry = new THREE.BoxGeometry(0.055, 4.45, 0.055);
    const columnMaterial = new THREE.MeshBasicMaterial({
      color: 0xcda555,
      transparent: true,
      opacity: 0.54,
    });
    [
      [-1.75, -1.05],
      [1.75, -1.05],
      [-1.75, 1.05],
      [1.75, 1.05],
    ].forEach(([x, z]) => {
      const column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(x, 2.15, z);
      structure.add(column);
    });

    const base = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(5.25, 0.08, 3.75)),
      faintGold,
    );
    base.position.y = -0.25;
    structure.add(base);

    for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
      const ring = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 65 }, (_, index) => {
            const angle = (index / 64) * Math.PI * 2;
            const radiusX = 3.2 + ringIndex * 0.48;
            const radiusZ = 2.15 + ringIndex * 0.34;
            return new THREE.Vector3(
              Math.cos(angle) * radiusX,
              -0.35 - ringIndex * 0.035,
              Math.sin(angle) * radiusZ,
            );
          }),
        ),
        faintGold,
      );
      structure.add(ring);
    }

    const scan = new THREE.Mesh(
      new THREE.PlaneGeometry(5.1, 3.55),
      new THREE.MeshBasicMaterial({
        color: 0xe5bd69,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    scan.rotation.x = -Math.PI / 2;
    scan.position.y = 0.15;
    structure.add(scan);

    const particlePositions = new Float32Array(54 * 3);
    for (let index = 0; index < 54; index += 1) {
      const angle = (index / 54) * Math.PI * 2;
      const radius = 3.2 + (index % 5) * 0.24;
      particlePositions[index * 3] = Math.cos(angle) * radius;
      particlePositions[index * 3 + 1] = ((index * 0.73) % 5.2) - 0.3;
      particlePositions[index * 3 + 2] = Math.sin(angle) * radius * 0.68;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0xe5bd69, size: 0.038, transparent: true, opacity: 0.5 }),
    );
    structure.add(particles);

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointerTarget.set(
        ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        ((event.clientY - rect.top) / rect.height - 0.5) * 2,
      );
    };
    const onPointerLeave = () => pointerTarget.set(0, 0);
    if (finePointer && !reducedMotion) mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerleave", onPointerLeave);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    let visible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibilityObserver.observe(mount);

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!visible) return;
      pointer.lerp(pointerTarget, 0.045);
      const elapsed = performance.now() * 0.001;
      structure.rotation.y =
        -0.42 + (reducedMotion ? 0 : Math.sin(elapsed * 0.32) * 0.11 + pointer.x * 0.1);
      structure.rotation.x = reducedMotion ? 0 : pointer.y * 0.035;
      scan.position.y = reducedMotion ? 2.15 : ((elapsed * 0.65) % 4.65) - 0.05;
      particles.rotation.y = reducedMotion ? 0 : elapsed * 0.055;
      renderer.render(scene, camera);
    };
    resize();
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerleave", onPointerLeave);
      scene.traverse((object) => {
        if (!(
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.LineSegments ||
          object instanceof THREE.Points
        ))
          return;
        object.geometry.dispose();
        if (Array.isArray(object.material))
          object.material.forEach((material) => material.dispose());
        else object.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" className="absolute inset-0 cursor-crosshair" />;
}
