/**
 * Shared types and constants for the 3D entry loader system.
 */
import * as THREE from "three";

// ── Types ──

export interface EntryLoader3DProps {
  modelUrl: string;
  onProgress?: (percent: number) => void;
  onLoaded?: () => void;
}

export interface LoaderOverlayProps {
  showLoader: boolean;
  modelVisible: boolean;
  loadProgress: number;
}

/** Mutable state bag passed between the scene modules and animation loop. */
export interface SceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  orbitLight: THREE.PointLight;
  model: THREE.Group | null;
  particles: THREE.Points | null;
  lightRays: THREE.Mesh | null;
  outerRing: THREE.Mesh | null;
  innerRing: THREE.Mesh | null;
  loadedTime: number;
  isLoadFinished: boolean;
  prefersReducedMotion: boolean;
}

/** Camera fly-in orbit parameters. */
export interface CameraOrbit {
  radiusStart: number;
  radiusEnd: number;
  polarStart: number;
  polarEnd: number;
  azimuthalStart: number;
  azimuthalEnd: number;
}

// ── Constants ──

/** Gold accent color used throughout the loader. */
export const GOLD = 0xc5a059;
export const GOLD_HEX = "#c5a059";

/** Camera orbit defaults. */
export const CAMERA_ORBIT: CameraOrbit = {
  radiusStart: 10,
  radiusEnd: 5.5,
  polarStart: (35 * Math.PI) / 180,
  polarEnd: (72 * Math.PI) / 180,
  azimuthalStart: -Math.PI / 2.5,
  azimuthalEnd: Math.PI / 12,
};

/** Intro animation duration in ms (snappy fly-in). */
export const INTRO_DURATION_MS = 1400;

/** Base model rotation speed (radians/s). */
export const BASE_ROTATE_SPEED = (12 * Math.PI) / 180;

/** How long the loader branding text stays visible after model loads (ms). */
export const LOADER_TEXT_DURATION_MS = 500;

/** How long the 3D scene stays visible after model loads before fading out (ms). */
export const SCENE_VISIBLE_DURATION_MS = 1800;
