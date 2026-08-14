import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function TerritoryField() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const compactViewport = window.matchMedia("(max-width: 767px)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    camera.position.set(0, 5.4, 9.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactViewport ? 1 : 1.5));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const field = new THREE.Group();
    field.rotation.z = -0.08;
    scene.add(field);

    const terrainGeometry = new THREE.PlaneGeometry(
      17,
      11,
      compactViewport ? 34 : 68,
      compactViewport ? 22 : 44,
    );
    const positions = terrainGeometry.attributes.position as THREE.BufferAttribute;
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      const ridge = Math.exp(-((x - 2.4) ** 2 + (y + 0.5) ** 2) / 15) * 1.15;
      positions.setZ(
        index,
        Math.sin(x * 0.72) * Math.cos(y * 0.92) * 0.32 + Math.sin((x + y) * 0.38) * 0.18 + ridge,
      );
    }
    terrainGeometry.computeVertexNormals();

    const terrainUniforms = {
      uTime: { value: 0 },
      uMotion: { value: reducedMotion ? 0 : 1 },
      uPointer: { value: 0 },
    };
    const terrainMaterial = new THREE.ShaderMaterial({
      uniforms: terrainUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `
        uniform float uTime;
        uniform float uMotion;
        uniform float uPointer;
        varying float vElevation;
        varying vec2 vTerrainUv;

        void main() {
          vec3 p = position;
          float waveA = sin(p.x * 0.72 + uTime * 0.55) * cos(p.y * 0.9 - uTime * 0.42);
          float waveB = sin((p.x + p.y) * 1.15 - uTime * 0.3) * 0.35;
          p.z += (waveA + waveB) * 0.13 * uMotion * (0.7 + uPointer * 0.3);
          vElevation = p.z;
          vTerrainUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying float vElevation;
        varying vec2 vTerrainUv;

        void main() {
          float elevationBand = abs(fract(vElevation * 6.2) - 0.5);
          float contour = smoothstep(0.455, 0.495, elevationBand);
          float gridX = smoothstep(0.485, 0.5, abs(fract(vTerrainUv.x * 17.0) - 0.5));
          float gridY = smoothstep(0.485, 0.5, abs(fract(vTerrainUv.y * 11.0) - 0.5));
          float draftingGrid = max(gridX, gridY) * 0.18;
          float edgeFade = smoothstep(0.0, 0.17, vTerrainUv.x) *
            smoothstep(0.0, 0.17, 1.0 - vTerrainUv.x) *
            smoothstep(0.0, 0.18, vTerrainUv.y) *
            smoothstep(0.0, 0.18, 1.0 - vTerrainUv.y);
          vec3 deepGold = vec3(0.34, 0.24, 0.09);
          vec3 brightGold = vec3(0.88, 0.70, 0.34);
          vec3 color = mix(deepGold, brightGold, contour * 0.88 + draftingGrid);
          float alpha = (0.035 + contour * 0.38 + draftingGrid) * edgeFade;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2.5;
    field.add(terrain);

    const pointMaterial = new THREE.PointsMaterial({
      color: 0xe2c477,
      size: 0.025,
      transparent: true,
      opacity: 0.32,
    });
    const points = new THREE.Points(terrainGeometry, pointMaterial);
    points.rotation.copy(terrain.rotation);
    field.add(points);

    const beacon = new THREE.Group();
    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.16, 32),
      new THREE.MeshBasicMaterial({
        color: 0xe4bd74,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      }),
    );
    const beaconCore = new THREE.Mesh(
      new THREE.CircleGeometry(0.035, 18),
      new THREE.MeshBasicMaterial({ color: 0xffdc86, transparent: true, opacity: 0.95 }),
    );
    beaconCore.position.z = 0.012;
    beacon.add(beaconRing, beaconCore);
    beacon.position.set(1.4, 0.4, 0.45);
    terrain.add(beacon);

    const frameMaterial = new THREE.LineBasicMaterial({
      color: 0xc5a059,
      transparent: true,
      opacity: 0.38,
    });
    const frames: THREE.LineSegments[] = [];
    [
      [-3.8, 0.8, 0.25, 2.4, 1.45, 1.8],
      [-0.5, 0.3, -0.5, 3.1, 0.9, 2.1],
      [3.2, 0.7, 0.4, 2.1, 1.6, 1.6],
    ].forEach(([x, y, z, width, height, depth]) => {
      const frame = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
        frameMaterial,
      );
      frame.position.set(x, y, z);
      frame.userData.baseY = y;
      frame.rotation.y = -0.12;
      frames.push(frame);
      field.add(frame);
    });

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 121 }, (_, index) => {
        const angle = (index / 120) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * 6.5, Math.sin(angle) * 1.1, -1.7);
      }),
    );
    const orbit = new THREE.Line(
      orbitGeometry,
      new THREE.LineBasicMaterial({ color: 0xc5a059, transparent: true, opacity: 0.22 }),
    );
    orbit.rotation.z = 0.16;
    field.add(orbit);

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    let scrollProgress = 0;
    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointerTarget.set(
        ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        ((event.clientY - rect.top) / rect.height - 0.5) * 2,
      );
    };
    if (finePointer && !reducedMotion) mount.addEventListener("pointermove", onPointerMove);
    const onPointerLeave = () => pointerTarget.set(0, 0);
    const onScroll = () => {
      const progress = -mount.getBoundingClientRect().top / window.innerHeight;
      scrollProgress = THREE.MathUtils.clamp(progress, 0, 1);
    };
    mount.addEventListener("pointerleave", onPointerLeave);
    if (!reducedMotion) window.addEventListener("scroll", onScroll, { passive: true });

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
      pointer.lerp(pointerTarget, 0.035);
      const elapsed = performance.now() * 0.001;
      const time = elapsed * 0.18;
      terrainUniforms.uTime.value = elapsed;
      terrainUniforms.uPointer.value = pointer.length();
      beacon.position.x = THREE.MathUtils.lerp(beacon.position.x, pointer.x * 4.2, 0.05);
      beacon.position.y = THREE.MathUtils.lerp(beacon.position.y, -pointer.y * 2.5, 0.05);
      beaconRing.scale.setScalar(1 + Math.sin(elapsed * 2.4) * 0.16);
      field.position.y = THREE.MathUtils.lerp(field.position.y, -scrollProgress * 0.8, 0.05);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 9.5 - scrollProgress * 0.7, 0.04);
      if (!reducedMotion) {
        field.rotation.y = Math.sin(time) * 0.055 + pointer.x * 0.045;
        field.rotation.x = pointer.y * 0.025;
        frames.forEach((frame, index) => {
          frame.position.y = frame.userData.baseY + Math.sin(time * 8 + index) * 0.045;
        });
        orbit.rotation.y = time * 0.32;
      }
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
      window.removeEventListener("scroll", onScroll);
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

  return <div ref={mountRef} aria-hidden="true" className="absolute inset-0" />;
}
