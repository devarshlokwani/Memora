"use client";

import { useEffect, useRef, useState } from "react";

import { BrainMark } from "@/components/layout/Logo";
import { brainstemRing, cerebellumPoint, cerebrumPoint } from "@/lib/brain";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The brain, in actual 3D, turning slowly beside the creator's note.
 *
 * Shaded in bands rather than smoothly, with a line round the outside, so it
 * belongs to the same drawing as the logo instead of arriving as a photoreal
 * object from somewhere else. The shape comes from `lib/brain`.
 *
 * three.js is a large thing to hand someone who has only scrolled to a footer,
 * so it is imported on the way in: nothing is fetched until the panel is on
 * screen, and the drawn mark stands in until it is.
 */

const SIZE = 460;
const SPIN = 0.16;

export function BrainScene({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let teardown: (() => void) | undefined;

    const start = async (): Promise<(() => void) | undefined> => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        if (!cancelled) setFailed(true);
        return;
      }
      if (cancelled) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        // No WebGL — a phone with it switched off, or a locked-down browser.
        if (!cancelled) setFailed(true);
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      // Above and slightly to one side: the fissure and the folds are on top,
      // and level with it you see a plain silhouette and none of the relief.
      camera.position.set(0.3, 0.72, 3.3);
      camera.lookAt(0, -0.04, 0);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(SIZE, SIZE, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      host.appendChild(renderer.domElement);

      /* Banded shading, which is what turns a lit surface into something that
         looks drawn rather than photographed.

         Sixteen steps, not four. Toon shading looks the ramp up at
         `dot(normal, light) * 0.5 + 0.5`, so everything facing the light at all
         is squeezed into the top half of the texture — a four-step ramp spends
         two of them on the shadow side and leaves the whole lit surface with a
         single tone, which is how a folded brain comes out as a smooth pebble.
         Weighted light, so it reads as paper with shadow in the sulci rather
         than as a grey rock. */
      const STEPS = 16;
      const ramp = new THREE.DataTexture(
        new Uint8Array(
          Array.from({ length: STEPS }, (_, i) => {
            const t = i / (STEPS - 1);
            const value = Math.round(255 * (0.17 + 0.83 * Math.pow(t, 0.8)));
            return [value, value, value, 255];
          }).flat(),
        ),
        STEPS,
        1,
        THREE.RGBAFormat,
      );
      ramp.minFilter = THREE.NearestFilter;
      ramp.magFilter = THREE.NearestFilter;
      ramp.needsUpdate = true;

      const surface = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: ramp });
      const outline = new THREE.MeshBasicMaterial({ color: 0x0b090a, side: THREE.BackSide });

      const spent: { dispose: () => void }[] = [ramp, surface, outline, renderer];

      /* Icosahedron detail is not a doubling: each face is cut into
         (detail + 1)^2 triangles, so 5 is 720 triangles for the whole sphere and
         far too coarse to hold a fold. These numbers are chosen for the size of
         the features they have to carry. */
      const CEREBRUM = 30;
      const CEREBELLUM = 14;

      /** Reshapes an icosphere's vertices through one of the brain functions. */
      const shaped = (detail: number, map: (x: number, y: number, z: number) => number[]) => {
        const geometry = new THREE.IcosahedronGeometry(1, detail);
        const position = geometry.getAttribute("position");
        for (let i = 0; i < position.count; i++) {
          const [x, y, z] = map(position.getX(i), position.getY(i), position.getZ(i));
          position.setXYZ(i, x, y, z);
        }
        geometry.computeVertexNormals();
        spent.push(geometry);
        return geometry;
      };

      const stem = () => {
        const geometry = new THREE.CylinderGeometry(1, 1, 1, 24, 12, true);
        const position = geometry.getAttribute("position");
        for (let i = 0; i < position.count; i++) {
          // The cylinder's own coordinates carry the ring angle and the height.
          const angle = Math.atan2(position.getZ(i), position.getX(i));
          const [x, y, z] = brainstemRing(0.5 - position.getY(i), angle);
          position.setXYZ(i, x, y, z);
        }
        geometry.computeVertexNormals();
        spent.push(geometry);
        return geometry;
      };

      const brain = new THREE.Group();
      const parts = [shaped(CEREBRUM, cerebrumPoint), shaped(CEREBELLUM, cerebellumPoint), stem()];
      for (const geometry of parts) brain.add(new THREE.Mesh(geometry, surface));

      /* The outline: the same geometry again, a little larger and drawn
         inside-out, so only its far side survives and reads as a line round the
         edge. Scaled from the centre rather than pushed out along each normal —
         normals in a fold point at each other, so an offset shell turns itself
         inside out in every sulcus and scribbles black through the surface. */
      for (const geometry of parts) {
        const shell = new THREE.Mesh(geometry, outline);
        shell.scale.setScalar(1.012);
        brain.add(shell);
      }

      brain.rotation.y = 1.15;
      scene.add(brain);

      /* Kept low on purpose. The bands are what draw the folds, and anything
         much past full brightness pins the whole surface to the top of the ramp
         and hands back a white blob with an outline round it. */
      // Ambient stays low: it lifts every band by the same amount, and enough
      // of it flattens the shading back out into one tone.
      scene.add(new THREE.AmbientLight(0xffffff, 0.2));
      const key = new THREE.DirectionalLight(0xffffff, 1.35);
      key.position.set(-1.5, 2.1, 2.2);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xffffff, 0.3);
      rim.position.set(2.2, -0.4, -1.9);
      scene.add(rim);

      if (cancelled) {
        for (const item of spent) item.dispose();
        renderer.domElement.remove();
        return;
      }
      setReady(true);

      const still = prefersReducedMotion();
      const pointer = { x: 0, y: 0 };
      const tilt = { x: 0, y: 0 };

      const follow = (event: PointerEvent) => {
        const box = host.getBoundingClientRect();
        pointer.x = ((event.clientX - box.left) / box.width - 0.5) * 2;
        pointer.y = ((event.clientY - box.top) / box.height - 0.5) * 2;
      };
      const release = () => {
        pointer.x = 0;
        pointer.y = 0;
      };
      if (!still) {
        host.addEventListener("pointermove", follow);
        host.addEventListener("pointerleave", release);
      }

      // Only turning while it is on screen: an animation frame loop behind the
      // fold is work nobody asked for and battery nobody gets back.
      let visible = false;
      const watcher = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
        threshold: 0.05,
      });
      watcher.observe(host);

      let frame = 0;
      let last = performance.now();
      const draw = (now: number) => {
        frame = requestAnimationFrame(draw);
        const delta = Math.min((now - last) / 1000, 0.1);
        last = now;
        if (!visible) return;

        if (!still) {
          brain.rotation.y += SPIN * delta;
          tilt.x += (pointer.y * 0.22 - tilt.x) * Math.min(delta * 4, 1);
          tilt.y += (pointer.x * 0.3 - tilt.y) * Math.min(delta * 4, 1);
        }
        brain.rotation.x = tilt.x;
        brain.position.x = tilt.y * 0.1;
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(draw);

      return () => {
        cancelAnimationFrame(frame);
        watcher.disconnect();
        host.removeEventListener("pointermove", follow);
        host.removeEventListener("pointerleave", release);
        for (const item of spent) item.dispose();
        renderer.domElement.remove();
      };
    };

    /* Nothing is fetched until the footer is nearly in view. three.js is a
       large thing to hand someone who has only opened the page, and the effect
       runs the moment this mounts — which, since the footer is on every route,
       is immediately. The margin gives it a screen's warning so it is ready by
       the time anyone has scrolled to it. */
    const approach = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        approach.disconnect();
        void start().then((fn) => {
          if (cancelled) fn?.();
          else teardown = fn;
        });
      },
      { rootMargin: "600px" },
    );
    approach.observe(host);

    return () => {
      cancelled = true;
      approach.disconnect();
      teardown?.();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="A brain, turning slowly"
      className={`relative aspect-square w-full max-w-[26rem] ${className}`}
    >
      {/* Holds the space and says the same thing, while three.js is on its way
          or if this browser will not give us a canvas at all. */}
      <BrainMark
        className={`absolute inset-[18%] h-auto w-auto transition-opacity duration-500 ${
          ready && !failed ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}
