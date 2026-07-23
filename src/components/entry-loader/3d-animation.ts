/**
 * Animation loop for the 3D entry scene.
 *
 * Handles:
 * - Particle drift & spiral motion
 * - Orbiting point-light
 * - Ring rotation
 * - Camera fly-in (intro) + breathing (idle)
 * - Model scale-in + rotation
 * - Light-ray & ring reveal
 */
import * as THREE from "three";
import type { CameraOrbit } from "./3d-types";
import { INTRO_DURATION_MS, BASE_ROTATE_SPEED } from "./3d-types";
import { easeOutCubic, easeOutQuart, easeInOutSine, easeOutElastic } from "./3d-easing";
import type { SceneEffects } from "./3d-effects";

export interface AnimationContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  orbit: CameraOrbit;
  orbitLight: THREE.PointLight;
  effects: SceneEffects;
  /** Set to `performance.now()` when the model finishes loading. */
  getLoadedTime: () => number;
  getModel: () => THREE.Group | null;
  isFinished: () => boolean;
}

/**
 * Starts the animation loop and returns a cleanup function
 * that cancels the `requestAnimationFrame`.
 */
export function startAnimation(ctx: AnimationContext): () => void {
  let animationFrameId: number;
  let lastTime = performance.now();

  const { camera, renderer, scene, orbit, orbitLight, effects } = ctx;

  const { particles, lightRays, outerRing, innerRing } = effects;

  const animate = (time: number) => {
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    const globalTime = time * 0.001;

    // ── Particles: drift upwards with gentle swirl ──
    if (particles) {
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += (0.08 + (i % 5) * 0.02) * delta;
        const angle = globalTime * 0.2 + i * 0.1;
        positions[i * 3] += Math.sin(angle) * 0.003;
        positions[i * 3 + 2] += Math.cos(angle) * 0.003;
        if (positions[i * 3 + 1] > 3.5) {
          positions[i * 3 + 1] = -0.7;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }

    // ── Orbiting point light ──
    orbitLight.position.x = Math.sin(globalTime * 0.5) * 3.5;
    orbitLight.position.z = Math.cos(globalTime * 0.5) * 3.5;
    orbitLight.position.y = 1.5 + Math.sin(globalTime * 0.3) * 0.5;
    orbitLight.intensity = 1.5 + Math.sin(globalTime * 2) * 0.3;

    // ── Orbit rings ──
    if (outerRing) outerRing.rotation.z = globalTime * 0.15;
    if (innerRing) innerRing.rotation.z = -globalTime * 0.25;

    // ── Model intro animation ──
    const model = ctx.getModel();
    if (model && ctx.isFinished()) {
      const elapsed = time - ctx.getLoadedTime();
      const t = Math.min(elapsed / INTRO_DURATION_MS, 1);

      const cameraEased = easeOutQuart(t);
      const scaleEased = easeOutElastic(Math.min(t * 1.2, 1));
      const ringsEased = easeInOutSine(Math.min(t * 1.5, 1));

      // Elastic scale-in
      model.scale.setScalar(scaleEased);

      // Light rays reveal
      if (lightRays) {
        const rayT = easeOutCubic(Math.min(t * 1.3, 1));
        lightRays.scale.setScalar(rayT);
        (lightRays.material as THREE.MeshBasicMaterial).opacity = 0.04 * rayT;
      }

      // Rings expand
      if (outerRing) outerRing.scale.setScalar(ringsEased);
      if (innerRing) innerRing.scale.setScalar(ringsEased);

      // Camera fly-in
      const { radiusStart, radiusEnd, polarStart, polarEnd, azimuthalStart, azimuthalEnd } = orbit;
      const r = radiusStart + (radiusEnd - radiusStart) * cameraEased;
      const polar = polarStart + (polarEnd - polarStart) * cameraEased;
      const azimuth = azimuthalStart + (azimuthalEnd - azimuthalStart) * cameraEased;

      camera.position.x = r * Math.sin(polar) * Math.sin(azimuth);
      camera.position.y = r * Math.cos(polar);
      camera.position.z = r * Math.sin(polar) * Math.cos(azimuth);
      camera.lookAt(0, -0.1 * cameraEased, 0);

      // Rotation: fast initial spin → gentle orbit
      const boost = (1 - cameraEased) * ((30 * Math.PI) / 180);
      model.rotation.y += (BASE_ROTATE_SPEED + boost) * delta;

      // Breathing after intro
      if (t >= 1) {
        camera.position.y += Math.sin(globalTime * 0.4) * 0.015;
      }
    } else if (model) {
      model.rotation.y += BASE_ROTATE_SPEED * delta;
    }

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);
  };

  animate(performance.now());

  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}
