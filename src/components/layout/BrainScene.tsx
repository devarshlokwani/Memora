"use client";

import { useEffect, useRef, useState } from "react";

import { BrainMark } from "@/components/layout/Logo";
import { brainLights, buildBrain } from "@/lib/brainMesh";
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
        // No WebGL, a phone with it switched off, or a locked-down browser.
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

      const { group: brain, dispose: releaseBrain } = buildBrain(THREE);
      brain.rotation.y = 1.15;
      scene.add(brain);
      for (const light of brainLights(THREE)) scene.add(light);

      const spent: { dispose: () => void }[] = [renderer, { dispose: releaseBrain }];

      if (cancelled) {
        for (const item of spent) item.dispose();
        renderer.domElement.remove();
        return;
      }
      setReady(true);

      const still = prefersReducedMotion();
      const pointer = { x: 0, y: 0 };
      const tilt = { x: 0, y: 0 };

      /* Tracked from the window rather than from the canvas, because the canvas
         takes no pointer events at all: it is a square box laid over other
         things (in the footer, over the links beside the wordmark) and a
         decoration that swallows a click on a real link is not worth a tilt.
         The pull falls off with distance instead, so it answers a cursor near
         it and ignores one on the other side of the page. */
      const follow = (event: PointerEvent) => {
        const box = host.getBoundingClientRect();
        if (!box.width) return;
        const dx = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
        const dy = (event.clientY - (box.top + box.height / 2)) / (box.height / 2);
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / 2.4);
        pointer.x = Math.max(-1, Math.min(1, dx)) * near;
        pointer.y = Math.max(-1, Math.min(1, dy)) * near;
      };
      if (!still) window.addEventListener("pointermove", follow, { passive: true });

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
        window.removeEventListener("pointermove", follow);
        for (const item of spent) item.dispose();
        renderer.domElement.remove();
      };
    };

    /* Nothing is fetched until the footer is nearly in view. three.js is a
       large thing to hand someone who has only opened the page, and the effect
       runs the moment this mounts, which, since the footer is on every route,
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
      className={`pointer-events-none relative aspect-square w-full ${className}`}
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
