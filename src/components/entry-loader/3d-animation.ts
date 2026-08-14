/** Animation loop for the architectural entry scene. */
import * as THREE from "three";
import type { CameraOrbit } from "./3d-types";
import { BASE_ROTATE_SPEED, INTRO_DURATION_MS } from "./3d-types";
import { easeInOutSine, easeOutCubic, easeOutQuart } from "./3d-easing";
import type { SceneEffects } from "./3d-effects";

export interface AnimationContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  orbit: CameraOrbit;
  orbitLight: THREE.PointLight;
  effects: SceneEffects;
  getLoadedTime: () => number;
  getModel: () => THREE.Group | null;
  isFinished: () => boolean;
}

export function startAnimation(context: AnimationContext): () => void {
  let animationFrameId = 0;
  let lastTime = performance.now();

  const { camera, renderer, scene, orbit, orbitLight, effects } = context;
  const { particles, lightRays, outerRing, innerRing, buildingLevels } = effects;

  const animate = (time: number) => {
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    const globalTime = time * 0.001;

    // Rotate the particle field instead of mutating every vertex each frame.
    if (particles) {
      particles.rotation.y = globalTime * 0.035;
      particles.position.y = Math.sin(globalTime * 0.32) * 0.06;
    }

    orbitLight.position.x = Math.sin(globalTime * 0.38) * 3.4;
    orbitLight.position.z = Math.cos(globalTime * 0.38) * 3.4;
    orbitLight.position.y = 1.35 + Math.sin(globalTime * 0.26) * 0.3;
    orbitLight.intensity = 0.72 + Math.sin(globalTime * 1.4) * 0.1;

    const targetObject = context.getModel() || effects.centerEmblem;
    if (context.isFinished()) {
      const elapsed = time - context.getLoadedTime();
      const progress = Math.min(elapsed / INTRO_DURATION_MS, 1);
      const cameraProgress = easeOutQuart(progress);
      const objectProgress = easeOutCubic(Math.min(progress * 1.08, 1));
      const ringProgress = easeInOutSine(Math.min(progress * 1.35, 1));

      if (targetObject === effects.centerEmblem) {
        targetObject.scale.setScalar(0.9 + objectProgress * 0.1);

        buildingLevels.forEach((level, index) => {
          const levelProgress = Math.min(1, Math.max(0, (progress - 0.1 - index * 0.075) / 0.34));
          const easedLevel = easeOutQuart(levelProgress);
          const finalY = level.userData.finalY as number;
          level.visible = levelProgress > 0;
          level.position.y = finalY - (1 - easedLevel) * 0.24;
          const horizontalScale = 0.94 + easedLevel * 0.06;
          level.scale.set(horizontalScale, 0.72 + easedLevel * 0.28, horizontalScale);
        });
      } else if (targetObject) {
        targetObject.scale.setScalar(objectProgress);
      }

      if (lightRays) {
        const rayProgress = easeOutCubic(Math.min(progress * 1.2, 1));
        lightRays.scale.setScalar(0.72 + rayProgress * 0.28);
        (lightRays.material as THREE.MeshBasicMaterial).opacity = 0.022 * rayProgress;
      }

      outerRing?.scale.setScalar(0.7 + ringProgress * 0.3);
      innerRing?.scale.setScalar(0.7 + ringProgress * 0.3);

      const { radiusStart, radiusEnd, polarStart, polarEnd, azimuthalStart, azimuthalEnd } = orbit;
      const radius = radiusStart + (radiusEnd - radiusStart) * cameraProgress;
      const polar = polarStart + (polarEnd - polarStart) * cameraProgress;
      const azimuth = azimuthalStart + (azimuthalEnd - azimuthalStart) * cameraProgress;

      camera.position.x = radius * Math.sin(polar) * Math.sin(azimuth);
      camera.position.y = radius * Math.cos(polar);
      camera.position.z = radius * Math.sin(polar) * Math.cos(azimuth);
      camera.lookAt(0, 0.35, 0);

      const initialTurn = (1 - cameraProgress) * ((5 * Math.PI) / 180);
      targetObject.rotation.y += (BASE_ROTATE_SPEED + initialTurn) * delta;

      if (progress >= 1) {
        camera.position.y += Math.sin(globalTime * 0.4) * 0.01;
      }
    } else {
      targetObject.rotation.y += BASE_ROTATE_SPEED * delta;
    }

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);
  };

  animate(performance.now());
  return () => cancelAnimationFrame(animationFrameId);
}
