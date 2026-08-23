import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function FounderBuildingScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(7.6, 5.8, 10.0);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff6dc, 0x15130e, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffd98d, 4.2);
    keyLight.position.set(5, 8, 7);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xc5a059, 20, 16);
    rimLight.position.set(-3, 2, 4);
    scene.add(rimLight);

    const structure = new THREE.Group();
    structure.rotation.y = -0.32;
    structure.position.y = -0.6;
    scene.add(structure);

    const gold = new THREE.LineBasicMaterial({
      color: 0xf5d38a,
      transparent: true,
      opacity: 0.95,
    });
    const faintGold = new THREE.LineBasicMaterial({
      color: 0xc5a059,
      transparent: true,
      opacity: 0.45,
    });
    const roadMarking = new THREE.LineBasicMaterial({
      color: 0xf0cf85,
      transparent: true,
      opacity: 0.8,
    });
    const slateTerrain = new THREE.MeshStandardMaterial({
      color: 0x161819,
      roughness: 0.55,
      metalness: 0.25,
    });
    const terraceTerrain = new THREE.MeshStandardMaterial({
      color: 0x1f2124,
      roughness: 0.6,
      metalness: 0.2,
    });
    const lotAvailable = new THREE.MeshStandardMaterial({
      color: 0x222622,
      roughness: 0.7,
      metalness: 0.15,
      transparent: true,
      opacity: 0.85,
    });
    const lotReserved = new THREE.MeshStandardMaterial({
      color: 0x3d321d,
      roughness: 0.55,
      metalness: 0.3,
      emissive: 0x33220a,
      emissiveIntensity: 0.4,
    });
    const woodDeck = new THREE.MeshStandardMaterial({
      color: 0x5a4631,
      roughness: 0.6,
      metalness: 0.15,
    });
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x111214,
      roughness: 0.3,
      metalness: 0.8,
    });
    const poolWater = new THREE.MeshStandardMaterial({
      color: 0x153535,
      emissive: 0x0f2d2d,
      emissiveIntensity: 0.7,
      roughness: 0.08,
      metalness: 0.9,
    });
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x101113,
      roughness: 0.92,
      metalness: 0.1,
    });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf3cc7a,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.3,
      emissive: 0x4a3410,
      emissiveIntensity: 0.8,
      side: THREE.DoubleSide,
    });
    const interiorGlow = new THREE.MeshStandardMaterial({
      color: 0xfff0c2,
      emissive: 0xe6a845,
      emissiveIntensity: 2.5,
      metalness: 0.1,
      roughness: 0.2,
    });
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: 0xb58d44,
      metalness: 0.7,
      roughness: 0.3,
    });
    const canopyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x273d2b,
      transparent: true,
      opacity: 0.82,
      roughness: 0.7,
      metalness: 0.1,
    });

    // 1. Wide Topographic Territory Platform (Slim stepped contours)
    const baseContours = [
      { w: 7.6, h: 0.06, d: 5.2, y: -0.06 },
      { w: 7.1, h: 0.06, d: 4.7, y: 0.0 },
      { w: 6.6, h: 0.06, d: 4.2, y: 0.06 },
    ];
    baseContours.forEach((t, index) => {
      const geo = new THREE.BoxGeometry(t.w, t.h, t.d);
      const mesh = new THREE.Mesh(geo, index % 2 === 0 ? slateTerrain : terraceTerrain);
      mesh.position.y = t.y;
      structure.add(mesh);

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        index === baseContours.length - 1 ? gold : faintGold,
      );
      edge.position.copy(mesh.position);
      structure.add(edge);
    });

    // 2. Realistic Masterplan Road Network
    const mainAvenue = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.015, 0.32), roadMaterial);
    mainAvenue.position.set(0, 0.1, 0.1);
    structure.add(mainAvenue);

    const roadLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-3.0, 0.11, 0.1),
        new THREE.Vector3(3.0, 0.11, 0.1),
      ]),
      roadMarking,
    );
    structure.add(roadLine);

    const avenueWest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 3.4), roadMaterial);
    avenueWest.position.set(-1.7, 0.1, 0.1);
    structure.add(avenueWest);

    const avenueEast = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 3.4), roadMaterial);
    avenueEast.position.set(1.7, 0.1, 0.1);
    structure.add(avenueEast);

    // 3. Grid of 24 Individual Parcel Lots
    const lotsData: {
      x: number;
      z: number;
      w: number;
      d: number;
      isReserved?: boolean;
      hasVilla?: boolean;
    }[] = [];

    // Block North
    for (let i = 0; i < 5; i++) {
      lotsData.push({ x: -2.9 + i * 0.56, z: -1.0, w: 0.5, d: 0.85, isReserved: i === 2 });
    }
    for (let i = 0; i < 6; i++) {
      lotsData.push({
        x: -0.25 + i * 0.56,
        z: -1.0,
        w: 0.5,
        d: 0.85,
        isReserved: i === 4,
        hasVilla: i === 1,
      });
    }

    // Block South
    for (let i = 0; i < 5; i++) {
      lotsData.push({ x: -2.9 + i * 0.56, z: 1.1, w: 0.5, d: 0.85, isReserved: i === 1 });
    }
    for (let i = 0; i < 6; i++) {
      lotsData.push({ x: -0.25 + i * 0.56, z: 1.1, w: 0.5, d: 0.85, isReserved: i === 3 });
    }

    lotsData.forEach((lot) => {
      const lotMesh = new THREE.Mesh(
        new THREE.BoxGeometry(lot.w, 0.02, lot.d),
        lot.isReserved ? lotReserved : lotAvailable,
      );
      lotMesh.position.set(lot.x, 0.1, lot.z);
      structure.add(lotMesh);

      const lotBorder = new THREE.LineSegments(
        new THREE.EdgesGeometry(lotMesh.geometry),
        lot.isReserved || lot.hasVilla ? gold : faintGold,
      );
      lotBorder.position.copy(lotMesh.position);
      structure.add(lotBorder);

      if (lot.hasVilla) {
        const villaGroup = new THREE.Group();
        villaGroup.position.set(lot.x, 0.11, lot.z);

        const deck = new THREE.Mesh(
          new THREE.BoxGeometry(lot.w * 0.85, 0.015, lot.d * 0.75),
          woodDeck,
        );
        deck.position.set(0, 0.01, 0);
        villaGroup.add(deck);

        const mainW = lot.w * 0.55;
        const mainD = lot.d * 0.48;
        const mainH = 0.22;
        const glass = new THREE.Mesh(new THREE.BoxGeometry(mainW, mainH, mainD), glassMaterial);
        glass.position.set(-0.04, mainH / 2 + 0.01, -0.04);
        villaGroup.add(glass);

        const core = new THREE.Mesh(
          new THREE.BoxGeometry(mainW * 0.75, mainH * 0.7, mainD * 0.75),
          interiorGlow,
        );
        core.position.copy(glass.position);
        villaGroup.add(core);

        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(mainW * 1.35, 0.02, mainD * 1.35),
          roofMaterial,
        );
        roof.position.set(glass.position.x + 0.02, mainH + 0.02, glass.position.z + 0.02);
        villaGroup.add(roof);

        const roofTrim = new THREE.LineSegments(new THREE.EdgesGeometry(roof.geometry), gold);
        roofTrim.position.copy(roof.position);
        villaGroup.add(roofTrim);

        const pool = new THREE.Mesh(
          new THREE.BoxGeometry(lot.w * 0.24, 0.02, lot.d * 0.42),
          poolWater,
        );
        pool.position.set(mainW * 0.5, 0.01, 0.02);
        villaGroup.add(pool);

        structure.add(villaGroup);
      }
    });

    // 4. Natural Lake / Eco-Amenity Canal
    const lakeShape = new THREE.Shape();
    lakeShape.moveTo(-1.5, -0.2);
    lakeShape.bezierCurveTo(-0.9, 0.35, 0.2, -0.35, 1.3, 0.2);
    lakeShape.bezierCurveTo(1.5, 0.55, 0.3, 0.75, -1.1, 0.45);
    lakeShape.closePath();

    const lakeGeo = new THREE.ShapeGeometry(lakeShape);
    const lake = new THREE.Mesh(lakeGeo, poolWater);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(0, 0.105, -0.2);
    structure.add(lake);

    const lakeEdge = new THREE.LineSegments(new THREE.EdgesGeometry(lakeGeo), gold);
    lakeEdge.rotation.x = -Math.PI / 2;
    lakeEdge.position.copy(lake.position);
    structure.add(lakeEdge);

    // 5. Trees
    const treePositions = [
      [-3.0, 0.35],
      [-2.4, 0.35],
      [-1.8, 0.35],
      [-1.2, 0.35],
      [-0.6, 0.35],
      [0.0, 0.35],
      [0.6, 0.35],
      [1.2, 0.35],
      [1.8, 0.35],
      [2.4, 0.35],
      [-3.1, -1.7],
      [3.1, -1.7],
    ];

    treePositions.forEach(([x, z]) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0.09, z);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.18, 5), stemMaterial);
      stem.position.y = 0.09;
      treeGroup.add(stem);

      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), canopyMaterial);
      crown.position.y = 0.21;
      treeGroup.add(crown);

      structure.add(treeGroup);
    });

    for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
      const ring = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 65 }, (_, index) => {
            const angle = (index / 64) * Math.PI * 2;
            const radiusX = 3.2 + ringIndex * 0.48;
            const radiusZ = 2.15 + ringIndex * 0.34;
            return new THREE.Vector3(
              Math.cos(angle) * radiusX,
              -0.1 - ringIndex * 0.035,
              Math.sin(angle) * radiusZ,
            );
          }),
        ),
        faintGold,
      );
      structure.add(ring);
    }

    const scan = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 3.4),
      new THREE.MeshBasicMaterial({
        color: 0xe5bd69,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    scan.rotation.x = -Math.PI / 2;
    scan.position.y = 0.25;
    structure.add(scan);

    const particlePositions = new Float32Array(54 * 3);
    for (let index = 0; index < 54; index += 1) {
      const angle = (index / 54) * Math.PI * 2;
      const radius = 3.2 + (index % 5) * 0.24;
      particlePositions[index * 3] = Math.cos(angle) * radius;
      particlePositions[index * 3 + 1] = ((index * 0.5) % 2.2) - 0.2;
      particlePositions[index * 3 + 2] = Math.sin(angle) * radius * 0.68;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0xe5bd69, size: 0.038, transparent: true, opacity: 0.5 }),
    );
    structure.add(particles);

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointerTarget.set(
        ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        ((event.clientY - rect.top) / rect.height - 0.5) * 2,
      );
    };
    const onPointerLeave = () => pointerTarget.set(0, 0);
    if (finePointer && !reducedMotion) mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerleave", onPointerLeave);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    let visible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibilityObserver.observe(mount);

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!visible) return;
      pointer.lerp(pointerTarget, 0.045);
      const elapsed = performance.now() * 0.001;
      structure.rotation.y =
        -0.42 + (reducedMotion ? 0 : Math.sin(elapsed * 0.32) * 0.11 + pointer.x * 0.1);
      structure.rotation.x = reducedMotion ? 0 : pointer.y * 0.035;
      scan.position.y = reducedMotion ? 2.15 : ((elapsed * 0.65) % 4.65) - 0.05;
      particles.rotation.y = reducedMotion ? 0 : elapsed * 0.055;
      renderer.render(scene, camera);
    };
    resize();
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerleave", onPointerLeave);
      scene.traverse((object) => {
        if (!(
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.LineSegments ||
          object instanceof THREE.Points
        ))
          return;
        object.geometry.dispose();
        if (Array.isArray(object.material))
          object.material.forEach((material) => material.dispose());
        else object.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" className="absolute inset-0 cursor-crosshair" />;
}
