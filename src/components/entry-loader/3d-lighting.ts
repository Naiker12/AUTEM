/**
 * Cinematic lighting rig for the 3D entry scene.
 *
 * Creates a dramatic multi-light setup:
 * - Ambient base fill
 * - Key light (warm gold, top-right)
 * - Rim light (gold accent, behind)
 * - Fill light (cool blue, left — cinematic contrast)
 * - Spot uplight (dramatic ground glow)
 * - Orbiting point light (animated externally)
 */
import * as THREE from "three";
import { GOLD } from "./3d-types";

export interface LightingRig {
  orbitLight: THREE.PointLight;
}

export function createLighting(scene: THREE.Scene): LightingRig {
  // Ambient — very subtle base
  const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
  scene.add(ambientLight);

  // Key light — warm gold from top-right
  const keyLight = new THREE.DirectionalLight(0xf5d5a0, 2.2);
  keyLight.position.set(4, 8, 3);
  keyLight.castShadow = false;
  scene.add(keyLight);

  // Rim light — gold accent from behind
  const rimLight = new THREE.DirectionalLight(GOLD, 1.8);
  rimLight.position.set(-3, 4, -5);
  scene.add(rimLight);

  // Fill light — cool blue from the left for contrast
  const fillLight = new THREE.DirectionalLight(0x4a6fa5, 0.5);
  fillLight.position.set(-6, 2, 4);
  scene.add(fillLight);

  // Ground spot light — dramatic uplight
  const spotLight = new THREE.SpotLight(GOLD, 3, 12, Math.PI / 5, 0.6, 1.5);
  spotLight.position.set(0, -1, 0);
  spotLight.target.position.set(0, 3, 0);
  scene.add(spotLight);
  scene.add(spotLight.target);

  // Point light that orbits the model (position animated in 3d-animation.ts)
  const orbitLight = new THREE.PointLight(GOLD, 1.5, 10, 2);
  orbitLight.position.set(3, 1.5, 0);
  scene.add(orbitLight);

  return { orbitLight };
}
