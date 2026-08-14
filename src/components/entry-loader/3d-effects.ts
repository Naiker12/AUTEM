/**
 * Architectural effects for the AUTEM entry scene.
 *
 * The centerpiece is assembled as a restrained sectional model: stone site,
 * floating slabs, glass volumes, structural columns and warm drafting lines.
 */
import * as THREE from "three";
import { GOLD } from "./3d-types";

export interface SceneEffects {
  particles: THREE.Points | null;
  lightRays: THREE.Mesh | null;
  outerRing: THREE.Mesh | null;
  innerRing: THREE.Mesh | null;
  centerEmblem: THREE.Group;
  buildingLevels: THREE.Group[];
}

const addEdges = (mesh: THREE.Mesh, opacity: number) => {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity }),
  );
  edges.position.copy(mesh.position);
  edges.rotation.copy(mesh.rotation);
  edges.scale.copy(mesh.scale);
  mesh.parent?.add(edges);
};

export function createEffects(scene: THREE.Scene, prefersReducedMotion: boolean): SceneEffects {
  const centerEmblem = new THREE.Group();
  centerEmblem.position.y = -0.05;
  centerEmblem.rotation.y = -0.3;

  const siteMaterial = new THREE.MeshStandardMaterial({
    color: 0x171513,
    metalness: 0.34,
    roughness: 0.58,
  });
  const site = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.62, 0.18, 8), siteMaterial);
  site.position.y = -0.68;
  centerEmblem.add(site);
  addEdges(site, 0.32);

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(3.35, 0.16, 2.55),
    new THREE.MeshStandardMaterial({ color: 0x28221b, metalness: 0.28, roughness: 0.5 }),
  );
  plinth.position.y = -0.5;
  centerEmblem.add(plinth);
  addEdges(plinth, 0.52);

  const pathMaterial = new THREE.MeshBasicMaterial({
    color: GOLD,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const sitePath = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.715, 96), pathMaterial);
  sitePath.rotation.x = -Math.PI / 2;
  sitePath.position.y = -0.405;
  centerEmblem.add(sitePath);

  const slabMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b6b37,
    metalness: 0.52,
    roughness: 0.34,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x080b0e,
    emissive: 0x020304,
    metalness: 0.58,
    roughness: 0.18,
    transparent: true,
    opacity: 0.9,
  });
  const columnMaterial = new THREE.MeshStandardMaterial({
    color: 0xd5b36d,
    metalness: 0.62,
    roughness: 0.24,
  });

  const buildingLevels: THREE.Group[] = [];
  const levelCount = 6;

  for (let index = 0; index < levelCount; index++) {
    const level = new THREE.Group();
    const finalY = -0.3 + index * 0.38;
    const offsetX = index % 2 === 0 ? -0.08 : 0.08;
    level.userData.finalY = finalY;
    level.position.set(offsetX, finalY, 0);

    const slab = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.075, 1.86), slabMaterial);
    level.add(slab);
    addEdges(slab, 0.68);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.27, 1.52), glassMaterial);
    glass.position.y = 0.17;
    level.add(glass);
    addEdges(glass, 0.3);

    const columnPositions = [
      [-1.15, -0.67],
      [1.15, -0.67],
      [-1.15, 0.67],
      [1.15, 0.67],
    ];
    columnPositions.forEach(([x, z]) => {
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.3, 8),
        columnMaterial,
      );
      column.position.set(x, 0.17, z);
      level.add(column);
    });

    if (!prefersReducedMotion) {
      level.visible = false;
      level.position.y = finalY - 0.24;
      level.scale.set(0.94, 0.72, 0.94);
    }

    buildingLevels.push(level);
    centerEmblem.add(level);
  }

  const roof = new THREE.Group();
  roof.userData.finalY = 2.02;
  roof.position.y = 2.02;
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.09, 1.98), slabMaterial);
  roof.add(roofSlab);
  addEdges(roofSlab, 0.82);
  const crown = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.08, 0.72), columnMaterial);
  crown.position.set(0.42, 0.11, -0.12);
  roof.add(crown);
  addEdges(crown, 0.56);
  if (!prefersReducedMotion) {
    roof.visible = false;
    roof.position.y = 1.78;
    roof.scale.set(0.94, 0.72, 0.94);
  }
  buildingLevels.push(roof);
  centerEmblem.add(roof);

  centerEmblem.scale.setScalar(prefersReducedMotion ? 1 : 0.9);
  scene.add(centerEmblem);

  if (prefersReducedMotion) {
    return {
      particles: null,
      lightRays: null,
      outerRing: null,
      innerRing: null,
      centerEmblem,
      buildingLevels,
    };
  }

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(5.5, 96),
    new THREE.MeshStandardMaterial({
      color: 0x070707,
      metalness: 0.76,
      roughness: 0.24,
      transparent: true,
      opacity: 0.72,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.79;
  scene.add(ground);

  const coneMaterial = new THREE.MeshBasicMaterial({
    color: GOLD,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lightRays = new THREE.Mesh(new THREE.ConeGeometry(2.05, 6.5, 48, 1, true), coneMaterial);
  lightRays.position.y = 2.35;
  lightRays.scale.setScalar(0.72);
  scene.add(lightRays);

  const makeRing = (radius: number, opacity: number) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius, radius + 0.012, 128),
      new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.77;
    ring.scale.setScalar(0.7);
    scene.add(ring);
    return ring;
  };

  const outerRing = makeRing(3.2, 0.12);
  const innerRing = makeRing(2.35, 0.08);

  const particleCount = window.innerWidth < 640 ? 70 : 140;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index++) {
    const radius = 1.2 + Math.random() * 3.8;
    const theta = Math.random() * Math.PI * 2;
    positions[index * 3] = radius * Math.sin(theta);
    positions[index * 3 + 1] = -0.55 + Math.random() * 4.1;
    positions[index * 3 + 2] = radius * Math.cos(theta);
  }
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0xd8b76f,
      size: 0.025,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  scene.add(particles);

  return { particles, lightRays, outerRing, innerRing, centerEmblem, buildingLevels };
}

export function disposeEffects(effects: SceneEffects): void {
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  const disposedMaterials = new Set<THREE.Material>();

  [
    effects.particles,
    effects.lightRays,
    effects.outerRing,
    effects.innerRing,
    effects.centerEmblem,
  ].forEach((object) => {
    object?.traverse((child) => {
      if (!(
        child instanceof THREE.Mesh ||
        child instanceof THREE.Points ||
        child instanceof THREE.LineSegments
      )) {
        return;
      }
      if (child.geometry && !disposedGeometries.has(child.geometry)) {
        disposedGeometries.add(child.geometry);
        child.geometry.dispose();
      }
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material && !disposedMaterials.has(material)) {
          disposedMaterials.add(material);
          material.dispose();
        }
      });
    });
  });
}
