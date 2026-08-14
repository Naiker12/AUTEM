/**
 * Scene, camera, and renderer factory for the 3D entry loader.
 */
import * as THREE from "three";
import { CAMERA_ORBIT } from "./3d-types";
import type { CameraOrbit } from "./3d-types";

export interface SceneKit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  orbit: CameraOrbit;
}

/**
 * Creates the Three.js scene, camera, and renderer.
 *
 * The camera is positioned at the start of the fly-in orbit so
 * the first rendered frame already looks correct.
 */
export function createScene(canvas: HTMLCanvasElement, width: number, height: number): SceneKit {
  const scene = new THREE.Scene();

  // Subtle atmospheric fog
  scene.fog = new THREE.FogExp2(0x080808, 0.038);

  // Camera
  const aspect = width / height;
  const camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 100);

  const portraitDistance = Math.min(1.6, Math.max(1, 0.92 / aspect));
  const orbit: CameraOrbit = {
    ...CAMERA_ORBIT,
    radiusStart: CAMERA_ORBIT.radiusStart * portraitDistance,
    radiusEnd: CAMERA_ORBIT.radiusEnd * portraitDistance,
  };

  // Set initial position (start of fly-in)
  camera.position.x =
    orbit.radiusStart * Math.sin(orbit.polarStart) * Math.sin(orbit.azimuthalStart);
  camera.position.y = orbit.radiusStart * Math.cos(orbit.polarStart);
  camera.position.z =
    orbit.radiusStart * Math.sin(orbit.polarStart) * Math.cos(orbit.azimuthalStart);
  camera.lookAt(0, 0.35, 0);

  // Renderer — high quality
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  return { scene, camera, renderer, orbit };
}
