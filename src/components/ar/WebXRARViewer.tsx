/**
 * WebXRARViewer — Full-screen AR viewer for Android (Chrome + ARCore).
 *
 * Uses Three.js (already installed) + the native WebXR Device API.
 * - Hit-test surface detection with visual reticle
 * - Tap-to-place model anchoring
 * - 1-finger drag → rotate Y, 2-finger pinch → scale
 * - No external dependencies beyond `three`
 */
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { X, Loader2, Hand, Move, ZoomIn } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface WebXRARViewerProps {
  modelSrc: string;
  propertyName: string;
  onClose: () => void;
  onError: (msg: string) => void;
}

type ARPhase = "loading" | "scanning" | "placing" | "placed";

// ── Reticle geometry (ring that follows detected surfaces) ───────────────────

function createReticle(): THREE.Mesh {
  const ring = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xc5a059, // AUTEM gold accent
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(ring, mat);
  mesh.matrixAutoUpdate = false;
  mesh.visible = false;
  return mesh;
}

// ── Component ────────────────────────────────────────────────────────────────

export function WebXRARViewer({ modelSrc, propertyName, onClose, onError }: WebXRARViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const reticleRef = useRef<THREE.Mesh | null>(null);
  const sessionRef = useRef<XRSession | null>(null);
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
  const localSpaceRef = useRef<XRReferenceSpace | null>(null);

  const [phase, setPhase] = useState<ARPhase>("loading");
  const [loadProgress, setLoadProgress] = useState(0);

  // Touch gesture state (refs to avoid re-renders on every pointer move)
  const gestureRef = useRef({
    isRotating: false,
    lastX: 0,
    initialPinchDist: 0,
    initialScale: 1,
    activePointers: new Map<number, { x: number; y: number }>(),
  });

  // Scale limits
  const SCALE_MIN = 0.3;
  const SCALE_MAX = 3.0;

  // ── Cleanup helper ───────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    // End XR session
    if (sessionRef.current) {
      sessionRef.current.end().catch(() => {});
      sessionRef.current = null;
    }
    hitTestSourceRef.current = null;
    localSpaceRef.current = null;

    // Dispose Three.js resources
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      modelRef.current = null;
    }

    if (reticleRef.current) {
      (reticleRef.current.geometry as THREE.BufferGeometry)?.dispose();
      (reticleRef.current.material as THREE.Material)?.dispose();
      reticleRef.current = null;
    }

    if (rendererRef.current) {
      rendererRef.current.setAnimationLoop(null);
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    sceneRef.current = null;
    cameraRef.current = null;
  }, []);

  // ── Handle close (cleanup + callback) ────────────────────────────────────

  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  // ── Main initialization effect ───────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const init = async () => {
      // ─── 1. Check WebXR support ────────────────────────────────────
      if (!("xr" in navigator)) {
        onError("Tu navegador no soporta WebXR. Usa Chrome en Android.");
        return;
      }

      const xr = navigator.xr!;
      const supported = await xr.isSessionSupported("immersive-ar");
      if (!supported) {
        onError(
          "Tu dispositivo no soporta Realidad Aumentada inmersiva. Asegúrate de tener ARCore instalado.",
        );
        return;
      }

      if (cancelled) return;

      // ─── 2. Create Three.js renderer ───────────────────────────────
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true, // Camera passthrough
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      rendererRef.current = renderer;
      container.appendChild(renderer.domElement);

      // ─── 3. Scene + Camera ─────────────────────────────────────────
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        40,
      );
      cameraRef.current = camera;

      // Ambient + directional light for the placed model
      const ambient = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambient);

      const directional = new THREE.DirectionalLight(0xffffff, 1.4);
      directional.position.set(2, 5, 3);
      directional.castShadow = false;
      scene.add(directional);

      // ─── 4. Reticle ────────────────────────────────────────────────
      const reticle = createReticle();
      scene.add(reticle);
      reticleRef.current = reticle;

      // ─── 5. Load GLB model (hidden until placed) ───────────────────
      const loader = new GLTFLoader();
      let loadedModel: THREE.Group | null = null;

      try {
        const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
          loader.load(
            modelSrc,
            (result) => resolve(result as unknown as { scene: THREE.Group }),
            (progress) => {
              if (progress.lengthComputable && !cancelled) {
                setLoadProgress(Math.round((progress.loaded / progress.total) * 100));
              }
            },
            (err) => reject(err),
          );
        });

        if (cancelled) return;

        loadedModel = gltf.scene;
        loadedModel.visible = false; // Hidden until user taps to place

        // Center the model on its bounding box
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        loadedModel.position.sub(center);
        loadedModel.position.y += size.y / 2; // Sit on the ground plane

        // Normalize to ~1m tall for AR (adjust scale based on actual model size)
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const targetSize = 1.0; // 1 meter
          const s = targetSize / maxDim;
          loadedModel.scale.setScalar(s);
        }

        // Wrap in a pivot group for placement positioning
        const pivot = new THREE.Group();
        pivot.add(loadedModel);
        pivot.visible = false;
        scene.add(pivot);
        modelRef.current = pivot;
      } catch (err) {
        if (!cancelled) {
          onError("No se pudo cargar el modelo 3D. Verifica tu conexión e intenta de nuevo.");
        }
        return;
      }

      if (cancelled) return;

      // ─── 6. Start XR Session ───────────────────────────────────────
      let session: XRSession;
      try {
        session = await xr.requestSession("immersive-ar", {
          requiredFeatures: ["hit-test"],
          optionalFeatures: ["dom-overlay"],
          domOverlay: container.querySelector(".ar-overlay")
            ? { root: container.querySelector(".ar-overlay")! }
            : undefined,
        });
      } catch (err) {
        if (!cancelled) {
          onError(
            "No se pudo iniciar la sesión de AR. Verifica los permisos de cámara en tu dispositivo.",
          );
        }
        return;
      }

      if (cancelled) {
        session.end().catch(() => {});
        return;
      }

      sessionRef.current = session;
      await renderer.xr.setSession(session);

      // ─── 7. Reference spaces + hit-test source ─────────────────────
      const viewerSpace = await session.requestReferenceSpace("viewer");
      const localSpace = await session.requestReferenceSpace("local");
      localSpaceRef.current = localSpace;

      const hitTestSource = await session.requestHitTestSource!({ space: viewerSpace });
      hitTestSourceRef.current = hitTestSource!;

      if (cancelled) return;
      setPhase("scanning");

      // ─── 8. Tap-to-place via XR select event ──────────────────────
      session.addEventListener("select", () => {
        if (!reticleRef.current?.visible || !modelRef.current) return;

        // Place model at reticle position
        const reticleMatrix = reticleRef.current.matrix;
        const pos = new THREE.Vector3();
        pos.setFromMatrixPosition(reticleMatrix);

        modelRef.current.position.copy(pos);
        modelRef.current.visible = true;
        if (loadedModel) loadedModel.visible = true;

        // Hide reticle after placing
        reticleRef.current.visible = false;
        setPhase("placed");
      });

      // Session end cleanup
      session.addEventListener("end", () => {
        if (!cancelled) {
          cleanup();
        }
      });

      // ─── 9. Animation loop ─────────────────────────────────────────
      renderer.setAnimationLoop((_timestamp, frame) => {
        if (!frame || !hitTestSourceRef.current || !localSpaceRef.current) return;

        const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);

        if (hitTestResults.length > 0 && reticleRef.current) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(localSpaceRef.current);
          if (pose) {
            reticleRef.current.visible = true;
            reticleRef.current.matrix.fromArray(pose.transform.matrix);

            // Update phase to "placing" once we see a surface
            setPhase((prev) => (prev === "scanning" ? "placing" : prev));
          }
        } else if (reticleRef.current) {
          reticleRef.current.visible = false;
        }

        renderer.render(scene, camera);
      });
    };

    init();

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelSrc]);

  // ── Touch gesture handlers (rotate + pinch-to-scale) ─────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const g = gestureRef.current;
    g.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.activePointers.size === 1) {
      g.isRotating = true;
      g.lastX = e.clientX;
    } else if (g.activePointers.size === 2) {
      g.isRotating = false;
      const pts = Array.from(g.activePointers.values());
      g.initialPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      g.initialScale = modelRef.current?.scale.x ?? 1;
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const g = gestureRef.current;
      g.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (!modelRef.current || phase !== "placed") return;

      if (g.activePointers.size === 1 && g.isRotating) {
        // Single finger: rotate model on Y
        const deltaX = e.clientX - g.lastX;
        g.lastX = e.clientX;

        // Rotate the inner model (first child of pivot group)
        const inner = modelRef.current.children[0];
        if (inner) {
          inner.rotation.y += deltaX * 0.008;
        }
      } else if (g.activePointers.size === 2 && g.initialPinchDist > 0) {
        // Two fingers: pinch to scale
        const pts = Array.from(g.activePointers.values());
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const scaleFactor = dist / g.initialPinchDist;
        const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, g.initialScale * scaleFactor));

        const inner = modelRef.current.children[0];
        if (inner) {
          inner.scale.setScalar(newScale);
        }
      }
    },
    [phase, SCALE_MIN, SCALE_MAX],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const g = gestureRef.current;
    g.activePointers.delete(e.pointerId);

    if (g.activePointers.size < 2) {
      g.initialPinchDist = 0;
    }
    if (g.activePointers.size === 1) {
      const remaining = Array.from(g.activePointers.values())[0];
      g.lastX = remaining.x;
      g.isRotating = true;
    }
    if (g.activePointers.size === 0) {
      g.isRotating = false;
    }
  }, []);

  // ── Phase-based instruction text ─────────────────────────────────────────

  const instructionText = (() => {
    switch (phase) {
      case "loading":
        return "Cargando modelo 3D...";
      case "scanning":
        return "Apunta la cámara a una superficie plana";
      case "placing":
        return "Toca la pantalla para colocar la propiedad";
      case "placed":
        return "Arrastra para rotar · Pellizca para escalar";
    }
  })();

  const InstructionIcon = (() => {
    switch (phase) {
      case "loading":
        return Loader2;
      case "scanning":
        return Move;
      case "placing":
        return Hand;
      case "placed":
        return ZoomIn;
    }
  })();

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label={`Visor de realidad aumentada: ${propertyName}`}
      role="application"
    >
      {/* Overlay UI (rendered on top of the WebGL canvas) */}
      <div className="ar-overlay pointer-events-none absolute inset-0 z-10">
        {/* Top bar: property name + close button */}
        <div className="pointer-events-auto flex items-center justify-between px-4 pt-safe-top py-4">
          <div className="rounded-full bg-black/50 backdrop-blur-md px-4 py-2">
            <span className="text-xs font-bold text-white tracking-wide">{propertyName}</span>
          </div>

          <button
            onClick={handleClose}
            className="flex size-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white transition-colors active:bg-black/70"
            aria-label="Cerrar visor AR"
          >
            <X size={20} />
          </button>
        </div>

        {/* Bottom instruction bar */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 pb-safe-bottom pb-8 flex justify-center">
          <div className="flex items-center gap-2.5 rounded-full bg-black/60 backdrop-blur-xl px-5 py-3 shadow-2xl">
            <InstructionIcon
              size={16}
              className={`text-[#c5a059] ${phase === "loading" ? "animate-spin" : ""}`}
            />
            <span className="text-xs font-medium text-white">{instructionText}</span>
          </div>
        </div>

        {/* Loading progress (only during model load phase) */}
        {phase === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#c5a059]/20" />
              <div className="relative flex size-20 items-center justify-center rounded-full border border-[#c5a059]/30 bg-black/60 backdrop-blur-md">
                <Loader2 size={32} className="animate-spin text-[#c5a059]" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c5a059]">
                Preparando AR
              </span>
              <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#c5a059] transition-all duration-300"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-white/60">{loadProgress}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
