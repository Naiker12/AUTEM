import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroBuildingScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(7.6, 5.9, 10.2);
    camera.lookAt(0, 0.15, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff6dc, 0x15130e, 2.4));
    const keyLight = new THREE.DirectionalLight(0xffd98d, 4.6);
    keyLight.position.set(5, 9, 7);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xc5a059, 22, 18);
    rimLight.position.set(-3, 2, 4);
    scene.add(rimLight);

    const masterplan = new THREE.Group();
    masterplan.rotation.y = -0.28;
    masterplan.position.y = -0.7;
    scene.add(masterplan);

    // Materials
    const goldLine = new THREE.LineBasicMaterial({
      color: 0xf5d38a,
      transparent: true,
      opacity: 0.95,
    });
    const subtleGold = new THREE.LineBasicMaterial({
      color: 0xc5a059,
      transparent: true,
      opacity: 0.45,
    });
    const roadMarking = new THREE.LineBasicMaterial({
      color: 0xf0cf85,
      transparent: true,
      opacity: 0.8,
    });
    const contourLine = new THREE.LineBasicMaterial({
      color: 0xd8b15f,
      transparent: true,
      opacity: 0.65,
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
      emissiveIntensity: 2.6,
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
      { w: 7.8, h: 0.06, d: 5.4, y: -0.06 },
      { w: 7.3, h: 0.06, d: 4.9, y: 0.0 },
      { w: 6.8, h: 0.06, d: 4.4, y: 0.06 },
    ];
    baseContours.forEach((t, index) => {
      const geo = new THREE.BoxGeometry(t.w, t.h, t.d);
      const mesh = new THREE.Mesh(geo, index % 2 === 0 ? slateTerrain : terraceTerrain);
      mesh.position.y = t.y;
      masterplan.add(mesh);

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        index === baseContours.length - 1 ? goldLine : contourLine,
      );
      edge.position.copy(mesh.position);
      masterplan.add(edge);
    });

    // 2. Realistic Masterplan Road Network
    // Main Avenue (East-West spine)
    const mainAvenue = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.015, 0.32), roadMaterial);
    mainAvenue.position.set(0, 0.1, 0.1);
    masterplan.add(mainAvenue);

    // Avenue center dashed line
    const roadLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-3.1, 0.11, 0.1),
        new THREE.Vector3(3.1, 0.11, 0.1),
      ]),
      roadMarking,
    );
    masterplan.add(roadLine);

    // North-South Access Boulevards
    const avenueWest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 3.6), roadMaterial);
    avenueWest.position.set(-1.8, 0.1, 0.1);
    masterplan.add(avenueWest);

    const avenueEast = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 3.6), roadMaterial);
    avenueEast.position.set(1.8, 0.1, 0.1);
    masterplan.add(avenueEast);

    // 3. Grid of 24 Individual Parcel Lots
    // We generate 4 organized real-estate blocks with individual parcel coordinates:
    const lotsData: {
      x: number;
      z: number;
      w: number;
      d: number;
      isReserved?: boolean;
      hasVilla?: boolean;
    }[] = [];

    // Block North-West (Lots 01 to 05)
    for (let i = 0; i < 5; i++) {
      lotsData.push({
        x: -3.0 + i * 0.58,
        z: -1.05,
        w: 0.52,
        d: 0.88,
        isReserved: i === 2,
      });
    }

    // Block North-Center & East (Lots 06 to 12)
    for (let i = 0; i < 6; i++) {
      lotsData.push({
        x: -0.3 + i * 0.58,
        z: -1.05,
        w: 0.52,
        d: 0.88,
        isReserved: i === 4,
        hasVilla: i === 1, // Only Lot 07 has the flagship showcase villa!
      });
    }

    // Block South-West (Lots 13 to 17)
    for (let i = 0; i < 5; i++) {
      lotsData.push({
        x: -3.0 + i * 0.58,
        z: 1.15,
        w: 0.52,
        d: 0.88,
        isReserved: i === 1,
      });
    }

    // Block South-Center & East (Lots 18 to 24)
    for (let i = 0; i < 6; i++) {
      lotsData.push({
        x: -0.3 + i * 0.58,
        z: 1.15,
        w: 0.52,
        d: 0.88,
        isReserved: i === 3,
      });
    }

    lotsData.forEach((lot) => {
      // Individual Lot Polygon Plinth
      const lotMesh = new THREE.Mesh(
        new THREE.BoxGeometry(lot.w, 0.02, lot.d),
        lot.isReserved ? lotReserved : lotAvailable,
      );
      lotMesh.position.set(lot.x, 0.1, lot.z);
      masterplan.add(lotMesh);

      // Fine golden perimeter lot boundary line
      const lotBorder = new THREE.LineSegments(
        new THREE.EdgesGeometry(lotMesh.geometry),
        lot.isReserved || lot.hasVilla ? goldLine : subtleGold,
      );
      lotBorder.position.copy(lotMesh.position);
      masterplan.add(lotBorder);

      // Only on the flagship showcase lot (Lot 07), render a single luxury villa
      if (lot.hasVilla) {
        const villaGroup = new THREE.Group();
        villaGroup.position.set(lot.x, 0.11, lot.z);

        // Deck
        const deck = new THREE.Mesh(
          new THREE.BoxGeometry(lot.w * 0.85, 0.015, lot.d * 0.75),
          woodDeck,
        );
        deck.position.set(0, 0.01, 0);
        villaGroup.add(deck);

        // Glass volume
        const mainW = lot.w * 0.55;
        const mainD = lot.d * 0.48;
        const mainH = 0.22;
        const glass = new THREE.Mesh(new THREE.BoxGeometry(mainW, mainH, mainD), glassMaterial);
        glass.position.set(-0.04, mainH / 2 + 0.01, -0.04);
        villaGroup.add(glass);

        // Glowing core
        const core = new THREE.Mesh(
          new THREE.BoxGeometry(mainW * 0.75, mainH * 0.7, mainD * 0.75),
          interiorGlow,
        );
        core.position.copy(glass.position);
        villaGroup.add(core);

        // Thin Cantilever Roof
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(mainW * 1.35, 0.02, mainD * 1.35),
          roofMaterial,
        );
        roof.position.set(glass.position.x + 0.02, mainH + 0.02, glass.position.z + 0.02);
        villaGroup.add(roof);

        const roofTrim = new THREE.LineSegments(new THREE.EdgesGeometry(roof.geometry), goldLine);
        roofTrim.position.copy(roof.position);
        villaGroup.add(roofTrim);

        // Private Infinity Pool
        const pool = new THREE.Mesh(
          new THREE.BoxGeometry(lot.w * 0.24, 0.02, lot.d * 0.42),
          poolWater,
        );
        pool.position.set(mainW * 0.5, 0.01, 0.02);
        villaGroup.add(pool);

        masterplan.add(villaGroup);
      }
    });

    // 4. Natural Lake / Eco-Amenity Canal
    const lakeShape = new THREE.Shape();
    lakeShape.moveTo(-1.6, -0.2);
    lakeShape.bezierCurveTo(-1.0, 0.4, 0.2, -0.4, 1.4, 0.2);
    lakeShape.bezierCurveTo(1.6, 0.6, 0.4, 0.8, -1.2, 0.5);
    lakeShape.closePath();

    const lakeGeo = new THREE.ShapeGeometry(lakeShape);
    const lake = new THREE.Mesh(lakeGeo, poolWater);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(0, 0.105, -0.2);
    masterplan.add(lake);

    const lakeEdge = new THREE.LineSegments(new THREE.EdgesGeometry(lakeGeo), goldLine);
    lakeEdge.rotation.x = -Math.PI / 2;
    lakeEdge.position.copy(lake.position);
    masterplan.add(lakeEdge);

    // 5. Slender Boulevard & Perimeter Landscaping Trees
    const treePositions = [
      [-3.1, 0.35],
      [-2.5, 0.35],
      [-1.9, 0.35],
      [-1.3, 0.35],
      [-0.7, 0.35],
      [-0.1, 0.35],
      [0.5, 0.35],
      [1.1, 0.35],
      [1.7, 0.35],
      [2.3, 0.35],
      [2.9, 0.35],
      [-3.3, -1.8],
      [3.3, -1.8],
      [-3.3, 1.8],
      [3.3, 1.8],
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

      masterplan.add(treeGroup);
    });

    // 6. Holographic Orbital Rings around Masterplan
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0xf0c66d,
      transparent: true,
      opacity: 0.28,
    });
    const orbits: THREE.LineLoop[] = [];
    [0, 1].forEach((index) => {
      const orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 90 }, (_, pointIndex) => {
            const angle = (pointIndex / 90) * Math.PI * 2;
            return new THREE.Vector3(
              Math.cos(angle) * (4.2 + index * 0.4),
              Math.sin(angle) * (0.3 + index * 0.12) + 0.15,
              Math.sin(angle) * (2.9 + index * 0.25),
            );
          }),
        ),
        orbitMaterial,
      );
      orbit.rotation.set(0.14 + index * 0.06, -0.22 + index * 0.25, index * 0.15);
      scene.add(orbit);
      orbits.push(orbit);
    });

    const particlePositions = new Float32Array(48 * 3);
    for (let index = 0; index < 48; index += 1) {
      const angle = (index / 48) * Math.PI * 2;
      particlePositions[index * 3] = Math.cos(angle) * (4.0 + (index % 4) * 0.25);
      particlePositions[index * 3 + 1] = 0.15 + Math.sin(angle * 3) * 0.35;
      particlePositions[index * 3 + 2] = Math.sin(angle) * 2.7;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf0c66d,
      size: 0.042,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

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

    const syncTheme = () => {
      const darkTheme = document.documentElement.classList.contains("dark");
      orbitMaterial.opacity = darkTheme ? 0.18 : 0.42;
      particleMaterial.opacity = darkTheme ? 0.72 : 0.96;
      particleMaterial.size = darkTheme ? 0.055 : 0.07;
      keyLight.intensity = darkTheme ? 4.6 : 5.4;
      rimLight.intensity = darkTheme ? 22 : 27;
    };
    syncTheme();
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

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
      const elapsed = performance.now() * 0.001;
      pointer.lerp(pointerTarget, 0.04);
      if (!reducedMotion) {
        masterplan.rotation.y = -0.28 + Math.sin(elapsed * 0.22) * 0.04 + pointer.x * 0.06;
        masterplan.rotation.x = pointer.y * 0.02;
        masterplan.position.y = -0.7 + Math.sin(elapsed * 0.45) * 0.02;
        orbits.forEach((orbit, index) => {
          orbit.rotation.y += 0.0006 * (index + 1);
        });
        particles.rotation.y = elapsed * 0.025;
      }
      renderer.render(scene, camera);
    };
    resize();
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerleave", onPointerLeave);
      scene.traverse((object) => {
        if (!(
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.LineLoop ||
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

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 cursor-crosshair"
      aria-label="Modelo arquitectónico 3D interactivo"
      role="img"
    />
  );
}
