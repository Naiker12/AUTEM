import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import type { Lot } from "@/data/lots";
import { PANORAMA_360 } from "@/data/lots";

interface PanoramaLotViewerProps {
  lots: Lot[];
  selectedLot: Lot;
  onSelect: (lot: Lot) => void;
  showLotLabels: boolean;
}

const RADIUS = 18;

function pointFromPixel([x, y]: [number, number]) {
  const longitude = (x / PANORAMA_360.width) * Math.PI * 2 - Math.PI;
  const latitude = Math.PI / 2 - (y / PANORAMA_360.height) * Math.PI;
  return new THREE.Vector3(
    -RADIUS * Math.cos(latitude) * Math.sin(longitude),
    RADIUS * Math.sin(latitude),
    RADIUS * Math.cos(latitude) * Math.cos(longitude),
  );
}

function polygonCenter(polygon: [number, number][]) {
  return polygon.reduce<[number, number]>(
    (center, point) => [
      center[0] + point[0] / polygon.length,
      center[1] + point[1] / polygon.length,
    ],
    [0, 0],
  );
}

function labelSprite(text: string, selected: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 72;
  const context = canvas.getContext("2d")!;
  context.fillStyle = selected ? "#c5a059" : "rgba(17, 20, 14, .88)";
  context.beginPath();
  context.roundRect(4, 4, 184, 64, 32);
  context.fill();
  context.fillStyle = selected ? "#16150f" : "#ffffff";
  context.font = "700 27px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 96, 37);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false }),
  );
  sprite.scale.set(3.6, 1.35, 1);
  return sprite;
}

export default function PanoramaLotViewer({
  lots,
  selectedLot,
  onSelect,
  showLotLabels,
}: PanoramaLotViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onSelect);
  callbackRef.current = onSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 96, 64),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide }),
    );
    scene.add(sphere);
    if (PANORAMA_360.image.endsWith(".exr")) {
      new EXRLoader().load(PANORAMA_360.image, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        (sphere.material as THREE.MeshBasicMaterial).map = texture;
        (sphere.material as THREE.MeshBasicMaterial).needsUpdate = true;
      });
    } else {
      new THREE.TextureLoader().load(PANORAMA_360.image, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        (sphere.material as THREE.MeshBasicMaterial).map = texture;
        (sphere.material as THREE.MeshBasicMaterial).needsUpdate = true;
      });
    }

    const interactives: THREE.Object3D[] = [];
    lots.forEach((lot) => {
      if (!lot.panoramaPolygon) return;
      const selected = lot.id === selectedLot.id;
      const points = lot.panoramaPolygon.map(pointFromPixel);
      const line = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: selected ? 0xc5a059 : 0xffffff,
          transparent: true,
          opacity: selected ? 1 : 0.78,
        }),
      );
      line.userData.lot = lot;
      scene.add(line);
      interactives.push(line);
      if (showLotLabels) {
        const label = labelSprite(lot.id, selected);
        label.position
          .copy(pointFromPixel(polygonCenter(lot.panoramaPolygon)))
          .multiplyScalar(0.96);
        label.userData.lot = lot;
        scene.add(label);
        interactives.push(label);
      }
    });

    let longitude = 0;
    let latitude = 0;
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    const raycaster = new THREE.Raycaster();
    raycaster.params.Line!.threshold = 0.45;
    const render = () => {
      camera.lookAt(
        new THREE.Vector3(
          -Math.sin(longitude) * Math.cos(latitude),
          Math.sin(latitude),
          Math.cos(longitude) * Math.cos(latitude),
        ),
      );
      renderer.render(scene, camera);
    };
    const pointerDown = (event: PointerEvent) => {
      dragging = true;
      moved = false;
      startX = event.clientX;
      startY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const pointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      longitude -= dx * 0.006;
      latitude = THREE.MathUtils.clamp(latitude + dy * 0.006, -1.35, 1.35);
      startX = event.clientX;
      startY = event.clientY;
      render();
    };
    const pointerUp = (event: PointerEvent) => {
      dragging = false;
      if (!moved) {
        const rect = renderer.domElement.getBoundingClientRect();
        raycaster.setFromCamera(
          new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1,
          ),
          camera,
        );
        const hit = raycaster.intersectObjects(interactives, false)[0];
        if (hit?.object.userData.lot) callbackRef.current(hit.object.userData.lot as Lot);
      }
    };
    const resize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      render();
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    window.addEventListener("resize", resize);
    render();
    return () => {
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.dispose();
      container.replaceChildren();
    };
  }, [lots, selectedLot, showLotLabels]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      aria-label="Panorama 360 de lotes"
    />
  );
}
