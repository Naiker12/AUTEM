/**
 * EntryLoader3D — cinematic 3D intro for the AUTEM landing page.
 *
 * This is the main React component that orchestrates the sub-modules:
 * - 3d-scene.ts     → Scene / Camera / Renderer
 * - 3d-lighting.ts  → Cinematic light rig
 * - 3d-effects.ts   → Particles, rings, rays, ground mirror
 * - 3d-animation.ts → requestAnimationFrame loop
 * - 3d-model-loader → GLTF loading + material enhancement
 * - 3d-easing.ts    → Easing curves
 * - 3d-types.ts     → Shared types & constants
 */
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import type { EntryLoader3DProps } from "./3d-types";
import { createScene } from "./3d-scene";
import { createLighting } from "./3d-lighting";
import { createEffects, disposeEffects } from "./3d-effects";
import { loadModel } from "./3d-model-loader";
import { startAnimation } from "./3d-animation";

export default function EntryLoader3D({ modelUrl, onProgress, onLoaded }: EntryLoader3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleProgress = useCallback((percent: number) => onProgress?.(percent), [onProgress]);

  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
    onLoaded?.();
  }, [onLoaded]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Build the scene ──
    const { scene, camera, renderer, orbit } = createScene(
      canvas,
      container.clientWidth,
      container.clientHeight,
    );

    const { orbitLight } = createLighting(scene);
    const effects = createEffects(scene, prefersReducedMotion);

    // ── Mutable state for the animation loop ──
    let model: THREE.Group | null = null;
    let loadedTime = 0;
    let isLoadFinished = false;

    // ── Load the 3D model ──
    loadModel(modelUrl, scene, prefersReducedMotion, {
      onProgress: handleProgress,
      onLoaded: (loadedModel) => {
        model = loadedModel;
        loadedTime = performance.now();
        isLoadFinished = true;
        handleLoaded();

        if (prefersReducedMotion) {
          renderer.render(scene, camera);
        }
      },
    });

    // ── Resize handler ──
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      if (prefersReducedMotion) renderer.render(scene, camera);
    };
    window.addEventListener("resize", handleResize);

    // ── Animation loop ──
    let stopAnimation: (() => void) | undefined;
    if (!prefersReducedMotion) {
      stopAnimation = startAnimation({
        scene,
        camera,
        renderer,
        orbit,
        orbitLight,
        effects,
        getLoadedTime: () => loadedTime,
        getModel: () => model,
        isFinished: () => isLoadFinished,
      });
    }

    // ── Cleanup ──
    return () => {
      window.removeEventListener("resize", handleResize);
      stopAnimation?.();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => {
              mat.map?.dispose();
              mat.dispose();
            });
          } else if (object.material) {
            (object.material as THREE.MeshStandardMaterial).map?.dispose();
            object.material.dispose();
          }
        }
      });

      disposeEffects(effects);
      renderer.dispose();
    };
  }, [modelUrl, handleProgress, handleLoaded]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? "scale(1)" : "scale(0.92)",
          transformOrigin: "center center",
          transition: "opacity 0.6s ease-out, transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)",
        }}
      />
    </div>
  );
}
