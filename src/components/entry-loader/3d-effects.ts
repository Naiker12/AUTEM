/**
 * Visual effects for the 3D entry scene.
 *
 * - Ground reflection plane (metallic mirror)
 * - Volumetric light rays (additive cone)
 * - Golden orbit rings (torus decorations)
 * - Floating particle system (rising gold dust)
 */
import * as THREE from "three";
import { GOLD } from "./3d-types";

export interface SceneEffects {
  particles: THREE.Points | null;
  lightRays: THREE.Mesh | null;
  outerRing: THREE.Mesh | null;
  innerRing: THREE.Mesh | null;
}

/**
 * Creates all decorative effects and adds them to the scene.
 * Returns handles so the animation loop can update them.
 *
 * When `prefersReducedMotion` is true, nothing is created.
 */
export function createEffects(
  scene: THREE.Scene,
  prefersReducedMotion: boolean,
): SceneEffects {
  if (prefersReducedMotion) {
    return { particles: null, lightRays: null, outerRing: null, innerRing: null };
  }

  // ── Ground Reflection Plane ──
  const groundGeometry = new THREE.CircleGeometry(6, 64);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.9,
    roughness: 0.15,
    transparent: true,
    opacity: 0.6,
  });
  const groundMirror = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMirror.rotation.x = -Math.PI / 2;
  groundMirror.position.y = -0.72;
  scene.add(groundMirror);

  // ── Volumetric Light Rays (cone from below) ──
  const coneGeometry = new THREE.ConeGeometry(2.5, 6, 32, 1, true);
  const coneMaterial = new THREE.MeshBasicMaterial({
    color: GOLD,
    transparent: true,
    opacity: 0.03,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lightRays = new THREE.Mesh(coneGeometry, coneMaterial);
  lightRays.position.y = 2.3;
  lightRays.scale.set(0, 0, 0);
  scene.add(lightRays);

  // ── Golden Orbit Rings ──
  const outerRingGeo = new THREE.TorusGeometry(3, 0.005, 8, 128);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: GOLD,
    transparent: true,
    opacity: 0.15,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = -0.7;
  outerRing.scale.set(0, 0, 0);
  scene.add(outerRing);

  const innerRingGeo = new THREE.TorusGeometry(2, 0.003, 8, 128);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: GOLD,
    transparent: true,
    opacity: 0.1,
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = -0.68;
  innerRing.scale.set(0, 0, 0);
  scene.add(innerRing);

  // ── Floating Particle System ──
  const particleCount = 300;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const r = 0.8 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = r * Math.sin(theta);
    positions[i * 3 + 1] = -0.7 + Math.random() * 4;
    positions[i * 3 + 2] = r * Math.cos(theta);
  }

  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: GOLD,
    size: 0.035,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  return { particles, lightRays, outerRing, innerRing };
}

/**
 * Disposes all GPU resources created by `createEffects`.
 */
export function disposeEffects(fx: SceneEffects): void {
  const disposeMesh = (obj: THREE.Mesh | THREE.Points | null) => {
    if (!obj) return;
    if (obj.geometry) obj.geometry.dispose();
    if (Array.isArray(obj.material)) {
      obj.material.forEach((m) => m.dispose());
    } else if (obj.material) {
      (obj.material as THREE.Material).dispose();
    }
  };

  disposeMesh(fx.particles);
  disposeMesh(fx.lightRays);
  disposeMesh(fx.outerRing);
  disposeMesh(fx.innerRing);
}
