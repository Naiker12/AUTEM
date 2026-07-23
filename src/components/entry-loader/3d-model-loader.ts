/**
 * GLTF model loader with progress reporting and material enhancement.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export interface LoadModelCallbacks {
  onProgress: (percent: number) => void;
  onLoaded: (model: THREE.Group) => void;
  onError?: (error: unknown) => void;
}

/**
 * Loads a .glb model, centers it, enhances its materials, and reports progress.
 *
 * Returns the GLTFLoader instance (in case callers need to reference it
 * for testing or cancellation purposes).
 */
export function loadModel(
  url: string,
  scene: THREE.Scene,
  prefersReducedMotion: boolean,
  callbacks: LoadModelCallbacks,
): GLTFLoader {
  const loader = new GLTFLoader();

  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;

      // Center the model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.position.y += 0.05;

      // Enhance materials for better lighting response
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.isMeshStandardMaterial) {
            mat.envMapIntensity = 1.5;
            mat.needsUpdate = true;
          }
        }
      });

      // Start tiny — the animation loop scales it up
      if (!prefersReducedMotion) {
        model.scale.set(0.001, 0.001, 0.001);
      }

      scene.add(model);
      callbacks.onLoaded(model);
    },
    (xhr) => {
      if (xhr.total > 0) {
        callbacks.onProgress((xhr.loaded / xhr.total) * 100);
      }
    },
    (error) => {
      console.error("Error loading 3D model:", error);
      callbacks.onError?.(error);
    },
  );

  return loader;
}
