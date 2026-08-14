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
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(8.2, 5.8, 11.3);
    // Aim slightly below the visual center so the ground platform stays inside
    // the transparent canvas. In light mode a clipped platform produced a hard,
    // rectangular edge against the hero background.
    camera.lookAt(0, 0.5, 0);

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

    const building = new THREE.Group();
    building.rotation.y = -0.36;
    building.position.y = -2.15;
    scene.add(building);

    const facadeUniforms = { uTime: { value: 0 }, uDark: { value: 0 } };
    const facadeMaterial = new THREE.ShaderMaterial({
      uniforms: facadeUniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          vec3 transformed = position;
          transformed.x += sin(position.y * 1.8 + uTime * 0.45) * 0.012;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uDark;
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vec3 charcoal = mix(vec3(0.34, 0.31, 0.25), vec3(0.12, 0.105, 0.08), uDark);
          vec3 gold = vec3(0.773, 0.627, 0.349);
          float verticals = smoothstep(0.965, 1.0, abs(sin(vUv.x * 42.0)));
          float floors = smoothstep(0.94, 1.0, abs(sin(vUv.y * 38.0)));
          float scanY = fract(uTime * 0.085);
          float scan = smoothstep(0.035, 0.0, abs(vUv.y - scanY));
          vec3 color = mix(charcoal, gold, (verticals + floors) * 0.18 + scan * 0.62);
          float alpha = 0.58 + verticals * 0.1 + floors * 0.1 + scan * 0.22;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    const shell = new THREE.Mesh(new THREE.BoxGeometry(3.6, 5.05, 2.75), facadeMaterial);
    shell.position.y = 2.7;
    building.add(shell);

    const goldLine = new THREE.LineBasicMaterial({
      color: 0xd6ad5b,
      transparent: true,
      opacity: 0.9,
    });
    const darkSlab = new THREE.MeshStandardMaterial({
      color: 0x20201d,
      metalness: 0.44,
      roughness: 0.38,
    });
    const warmGlass = new THREE.MeshPhysicalMaterial({
      color: 0x8c6a32,
      transparent: true,
      opacity: 0.42,
      roughness: 0.18,
      metalness: 0.34,
      emissive: 0x2b1805,
      emissiveIntensity: 0.55,
      side: THREE.DoubleSide,
    });
    const windowLit = new THREE.MeshStandardMaterial({
      color: 0xffd98d,
      emissive: 0xd18c2e,
      emissiveIntensity: 2.1,
      metalness: 0.15,
      roughness: 0.28,
    });
    const windowDim = new THREE.MeshStandardMaterial({
      color: 0x2b2822,
      emissive: 0x6b4318,
      emissiveIntensity: 0.38,
      metalness: 0.52,
      roughness: 0.24,
    });

    for (let floor = 0; floor < 8; floor += 1) {
      const y = 0.3 + floor * 0.67;
      const terraceOffset = floor % 3 === 2 ? 0.22 : 0;
      const width = 4.25 - floor * 0.055 + terraceOffset;
      const depth = 3.25 - floor * 0.045 + terraceOffset;
      const slabGeometry = new THREE.BoxGeometry(width, 0.11, depth);
      const slab = new THREE.Mesh(slabGeometry, darkSlab);
      slab.position.y = y;
      building.add(slab);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(slabGeometry), goldLine);
      edge.position.y = y;
      building.add(edge);

      if (floor > 0) {
        const balcony = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.38, 0.035), warmGlass);
        balcony.position.set(0, y + 0.28, depth / 2 + 0.025);
        building.add(balcony);

        for (let bay = 0; bay < 6; bay += 1) {
          const windowPanel = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.34, 0.025),
            (floor + bay) % 4 === 0 || (floor * bay) % 7 === 0 ? windowLit : windowDim,
          );
          windowPanel.position.set(-1.3 + bay * 0.52, y + 0.27, depth / 2 + 0.055);
          building.add(windowPanel);
        }
      }
    }

    const columnMaterial = new THREE.MeshStandardMaterial({
      color: 0xb58d44,
      metalness: 0.68,
      roughness: 0.28,
    });
    [
      [-1.55, -1.15],
      [1.55, -1.15],
      [-1.55, 1.15],
      [1.55, 1.15],
    ].forEach(([x, z]) => {
      const column = new THREE.Mesh(new THREE.BoxGeometry(0.055, 5.1, 0.055), columnMaterial);
      column.position.set(x, 2.7, z);
      building.add(column);
    });

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(5.35, 0.18, 4.15),
      new THREE.MeshStandardMaterial({ color: 0x181714, metalness: 0.48, roughness: 0.42 }),
    );
    platform.position.y = 0.05;
    building.add(platform);
    const platformEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(platform.geometry),
      new THREE.LineBasicMaterial({ color: 0xf0c66d, transparent: true, opacity: 1 }),
    );
    platformEdge.position.copy(platform.position);
    building.add(platformEdge);

    const planterMaterial = new THREE.MeshStandardMaterial({ color: 0x76613b, roughness: 0.9 });
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x31472d, roughness: 0.88 });
    for (let index = 0; index < 18; index += 1) {
      const angle = (index / 18) * Math.PI * 2;
      const radiusX = 1.25 + (index % 3) * 0.28;
      const radiusZ = 0.88 + (index % 2) * 0.25;
      const level = index % 4 === 0 ? 4.5 : index % 3 === 0 ? 3.15 : 0.28;
      const planter = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.26), planterMaterial);
      planter.position.set(Math.cos(angle) * radiusX, level, Math.sin(angle) * radiusZ);
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.21 + (index % 2) * 0.06, 1),
        foliageMaterial,
      );
      crown.position.copy(planter.position);
      crown.position.y += 0.25;
      building.add(planter, crown);
    }

    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0xc5a059,
      transparent: true,
      opacity: 0.18,
    });
    const orbits: THREE.LineLoop[] = [];
    [0, 1].forEach((index) => {
      const orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 100 }, (_, pointIndex) => {
            const angle = (pointIndex / 100) * Math.PI * 2;
            return new THREE.Vector3(
              Math.cos(angle) * (3.25 + index * 0.32),
              Math.sin(angle) * (0.78 + index * 0.12) + 2.35,
              0,
            );
          }),
        ),
        orbitMaterial,
      );
      orbit.rotation.set(0.22 + index * 0.18, -0.28 + index * 0.25, 0.1 + index * 0.4);
      scene.add(orbit);
      orbits.push(orbit);
    });

    const particlePositions = new Float32Array(48 * 3);
    for (let index = 0; index < 48; index += 1) {
      const angle = (index / 48) * Math.PI * 2;
      particlePositions[index * 3] = Math.cos(angle) * (3.1 + (index % 4) * 0.24);
      particlePositions[index * 3 + 1] = 2.35 + Math.sin(angle * 2.4) * 1.45;
      particlePositions[index * 3 + 2] = Math.sin(angle) * 1.65;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf0c66d,
      size: 0.055,
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
      facadeUniforms.uDark.value = darkTheme ? 1 : 0;
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
      facadeUniforms.uTime.value = elapsed;
      if (!reducedMotion) {
        building.rotation.y = -0.36 + Math.sin(elapsed * 0.3) * 0.055 + pointer.x * 0.08;
        building.rotation.x = pointer.y * 0.025;
        building.position.y = -2.15 + Math.sin(elapsed * 0.62) * 0.035;
        orbits.forEach((orbit, index) => {
          orbit.rotation.y += 0.0007 * (index + 1);
        });
        particles.rotation.y = elapsed * 0.035;
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
