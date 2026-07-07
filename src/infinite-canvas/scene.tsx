import { Stats, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { useIsTouchDevice } from "~/src/use-is-touch-device";
import { lerp, seededRandom } from "~/src/utils";
import styles from "./style.module.css";
import { getTexture } from "./texture-manager";
import type { InfiniteCanvasProps, MediaItem } from "./types";

const PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1);
const INVIS_THRESHOLD = 0.01;
const MAX_DRIFT = 5.0;
const SCATTERED_MAX_DRIFT = 1.5; // reduced drift when images form a frame
const DRIFT_LERP = 0.055;
const POSITION_LERP = 0.07;
const TAN30 = Math.tan(Math.PI / 6); // ~0.577
const LAYOUT_ASPECT = 16 / 9;
const SCATTER_BORDER = 0.88; // NDC fraction of screen to place scattered images

type PlacedImage = {
  id: string;
  x: number;
  y: number;
  z: number;
  scatterX: number;
  scatterY: number;
  size: number;
  mediaIndex: number;
  targetOpacity: number;
};

function isInExclusionCircle(x: number, y: number, D: number): boolean {
  const r = 0.3 * D * TAN30;
  return x * x + y * y < r * r;
}

function computeScatterTarget(x: number, y: number, D: number): { scatterX: number; scatterY: number } {
  const ndcX = x / (D * TAN30 * LAYOUT_ASPECT);
  const ndcY = y / (D * TAN30);

  // Pixel-space direction (aspect-corrected so the border is a screen rectangle)
  const pxX = ndcX * LAYOUT_ASPECT;
  const pxY = ndcY;
  const pixMag = Math.sqrt(pxX * pxX + pxY * pxY);

  if (pixMag < 0.05) {
    // Shouldn't happen after exclusion circle, but safe fallback: right edge
    return { scatterX: SCATTER_BORDER * D * TAN30 * LAYOUT_ASPECT, scatterY: 0 };
  }

  const dirX = pxX / pixMag;
  const dirY = pxY / pixMag;

  // Find t where ray hits the rectangle border
  const tX = (SCATTER_BORDER * LAYOUT_ASPECT) / Math.abs(dirX); // Infinity when dirX=0
  const tY = SCATTER_BORDER / Math.abs(dirY);                    // Infinity when dirY=0
  const t = Math.min(tX, tY);

  const scatterNdcX = (t * dirX) / LAYOUT_ASPECT;
  const scatterNdcY = t * dirY;

  return {
    scatterX: scatterNdcX * D * TAN30 * LAYOUT_ASPECT,
    scatterY: scatterNdcY * D * TAN30,
  };
}

function generateLayout(count: number): PlacedImage[] {
  return Array.from({ length: count }, (_, i) => {
    const rStable = (slot: number) => seededRandom(i * 97 + slot * 1000);
    const size = 10 + rStable(3) * 10;

    let x = 0;
    let y = 0;
    let z = -(20 + rStable(2) * 140);

    for (let attempt = 0; attempt < 30; attempt++) {
      const rp = (slot: number) => seededRandom(i * 97 + attempt * 500 + slot * 1000);
      z = -(20 + rp(2) * 140);
      const D = Math.abs(z);
      x = (rp(0) * 2 - 1) * D * TAN30 * LAYOUT_ASPECT * 1.15;
      y = (rp(1) * 2 - 1) * D * TAN30 * 1.15;
      if (!isInExclusionCircle(x, y, D)) break;
    }

    const D = Math.abs(z);
    const { scatterX, scatterY } = computeScatterTarget(x, y, D);

    const depthFraction = (D - 20) / 140;
    const targetOpacity = Math.max(0.15, 1.0 - depthFraction * 0.85);

    return { id: `img-${i}`, x, y, z, scatterX, scatterY, size, mediaIndex: i, targetOpacity };
  });
}

function BackgroundImage({
  placed,
  media,
  viewportHeight,
  scattered,
}: {
  placed: PlacedImage;
  media: MediaItem;
  viewportHeight: number;
  scattered: boolean;
}) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const localOpacity = React.useRef(0);
  const isReadyRef = React.useRef(false);
  // Track animated position independently of JSX prop (to avoid reconciler resets)
  const animPos = React.useRef({ x: placed.x, y: placed.y });
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  const displayScale = React.useMemo(() => {
    const aspect = media.width && media.height ? media.width / media.height : 1;
    const depth = Math.abs(placed.z);
    const maxWorldWidth = (200 * 2 * depth * TAN30) / viewportHeight;
    let worldWidth = placed.size * aspect;
    let worldHeight = placed.size;
    if (worldWidth > maxWorldWidth) {
      worldWidth = maxWorldWidth;
      worldHeight = worldWidth / aspect;
    }
    return new THREE.Vector3(worldWidth, worldHeight, 1);
  }, [media.width, media.height, placed.size, placed.z, viewportHeight]);

  React.useEffect(() => {
    localOpacity.current = 0;
    isReadyRef.current = false;
    setIsReady(false);
    const material = materialRef.current;
    if (material) {
      material.opacity = 0;
      material.depthWrite = false;
      material.map = null;
    }
    const tex = getTexture(media, () => {
      isReadyRef.current = true;
      setIsReady(true);
    });
    setTexture(tex);
  }, [media]);

  React.useEffect(() => {
    const material = materialRef.current;
    const mesh = meshRef.current;
    if (!material || !mesh || !texture || !isReady) return;
    material.map = texture;
    material.needsUpdate = true;
    mesh.scale.copy(displayScale);
  }, [displayScale, texture, isReady]);

  useFrame(() => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    // Animate position toward either scatter target or original position
    const tx = scattered ? placed.scatterX : placed.x;
    const ty = scattered ? placed.scatterY : placed.y;
    animPos.current.x = lerp(animPos.current.x, tx, POSITION_LERP);
    animPos.current.y = lerp(animPos.current.y, ty, POSITION_LERP);
    mesh.position.x = animPos.current.x;
    mesh.position.y = animPos.current.y;

    // Opacity
    const opTarget = isReadyRef.current ? placed.targetOpacity : 0;
    localOpacity.current = lerp(localOpacity.current, opTarget, 0.05);
    const op = localOpacity.current;

    if (op < INVIS_THRESHOLD) {
      mesh.visible = false;
      material.opacity = 0;
      material.depthWrite = false;
      return;
    }
    mesh.visible = true;
    material.opacity = op;
    material.depthWrite = op > 0.99 && placed.targetOpacity > 0.99;
  });

  if (!texture) return null;

  return (
    <mesh
      ref={meshRef}
      position={[placed.x, placed.y, placed.z]}
      scale={displayScale}
      visible={false}
      geometry={PLANE_GEOMETRY}
    >
      <meshBasicMaterial ref={materialRef} transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ParallaxController({
  media,
  layout,
  scattered,
  onTextureProgress,
  showFps,
}: {
  media: MediaItem[];
  layout: PlacedImage[];
  scattered: boolean;
  onTextureProgress?: (progress: number) => void;
  showFps?: boolean;
}) {
  const { camera, gl, size } = useThree();
  const isTouchDevice = useIsTouchDevice();
  const mouse = React.useRef({ x: 0, y: 0 });
  const drift = React.useRef({ x: 0, y: 0 });
  const maxProgress = React.useRef(0);
  const { progress } = useProgress();

  React.useEffect(() => {
    const rounded = Math.round(progress);
    if (rounded > maxProgress.current) {
      maxProgress.current = rounded;
      onTextureProgress?.(rounded);
    }
  }, [progress, onTextureProgress]);

  React.useEffect(() => {
    if (isTouchDevice) return;
    const onMouseMove = (e: MouseEvent) => {
      mouse.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    const onMouseLeave = () => {
      mouse.current = { x: 0, y: 0 };
    };
    window.addEventListener("mousemove", onMouseMove);
    gl.domElement.addEventListener("mouseleave", onMouseLeave);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      gl.domElement.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [gl, isTouchDevice]);

  useFrame(() => {
    if (!isTouchDevice) {
      const maxDrift = scattered ? SCATTERED_MAX_DRIFT : MAX_DRIFT;
      drift.current.x = lerp(drift.current.x, mouse.current.x * maxDrift, DRIFT_LERP);
      drift.current.y = lerp(drift.current.y, mouse.current.y * maxDrift, DRIFT_LERP);
    }
    camera.position.x = drift.current.x;
    camera.position.y = drift.current.y;
  });

  return (
    <>
      {layout.map((placed) => {
        const mediaItem = media[placed.mediaIndex];
        if (!mediaItem) return null;
        return (
          <BackgroundImage
            key={placed.id}
            placed={placed}
            media={mediaItem}
            viewportHeight={size.height}
            scattered={scattered}
          />
        );
      })}
      {showFps && <Stats />}
    </>
  );
}

export function InfiniteCanvasScene({
  media,
  onTextureProgress,
  showFps = false,
  scattered = false,
  cameraFov = 60,
  cameraNear = 0.5,
  cameraFar = 500,
  backgroundColor = "#ffffff",
}: InfiniteCanvasProps) {
  const isTouchDevice = useIsTouchDevice();
  const dpr = Math.min(window.devicePixelRatio || 1, isTouchDevice ? 1.25 : 1.5);
  const layout = React.useMemo(() => generateLayout(media.length), [media.length]);

  if (!media.length) return null;

  return (
    <div className={styles.container}>
      <Canvas
        camera={{ position: [0, 0, 0], fov: cameraFov, near: cameraNear, far: cameraFar }}
        dpr={dpr}
        flat
        gl={{ antialias: false, powerPreference: "high-performance" }}
        className={styles.canvas}
      >
        <color attach="background" args={[backgroundColor]} />
        <ParallaxController
          media={media}
          layout={layout}
          scattered={scattered}
          onTextureProgress={onTextureProgress}
          showFps={showFps}
        />
      </Canvas>
    </div>
  );
}
