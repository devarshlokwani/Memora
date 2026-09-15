"use client";

import { useEffect, useRef, useState } from "react";

import { BrainMark } from "@/components/layout/Logo";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The brain turning through the story, with a label pinned to whichever part of
 * it is facing you.
 *
 * Nothing here re-renders. Scroll writes a number into `progress`, and the
 * animation loop reads it and writes transforms and opacities straight onto the
 * nodes — putting five labels and a rotating mesh through React state at sixty
 * frames a second would spend the whole budget on reconciliation.
 *
 * The label cards sit still and the line to the brain moves. The other way
 * round — cards chasing their anchors around the screen — is far harder to read
 * and lands the text somewhere different at every window size.
 */

export type Beat = {
  /** A point on the brain in its own coordinates, roughly on the surface. */
  anchor: [number, number, number];
  /** Where the brain has turned to when this beat is the one being read. */
  turn: number;
  tilt: number;
  side: "left" | "right";
  title: string;
  body: string;
};

/** Everything the beats are laid out across, leaving room to arrive and leave. */
const FIRST = 0.08;
const LAST = 0.86;

export function StoryStage({
  beats,
  progress,
  className = "",
}: {
  beats: Beat[];
  /** Written by whatever is driving the story; read here, never written. */
  progress: { current: number };
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<SVGSVGElement>(null);
  const dotRef = useRef<SVGSVGElement>(null);
  const [ready, setReady] = useState(false);

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
        return;
      }
      if (cancelled) return;

      const { brainLights, buildBrain } = await import("@/lib/brainMesh");
      if (cancelled) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0.55, 4.15);
      camera.lookAt(0, 0, 0);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      /* Positioned and given a layer of its own so the leader line can sit
         behind it. An unpositioned canvas paints below every absolute sibling
         whatever the DOM order, which put the line over the top of the brain
         and had it running across the surface to reach a point on the front. */
      Object.assign(renderer.domElement.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        display: "block",
        zIndex: "1",
      });
      host.appendChild(renderer.domElement);

      const { group: brain, dispose: releaseBrain } = buildBrain(THREE);
      scene.add(brain);
      for (const light of brainLights(THREE)) scene.add(light);

      let width = 0;
      let height = 0;
      /** No room beside the brain, so the label goes under it instead. */
      let narrow = false;
      const measure = () => {
        const box = host.getBoundingClientRect();
        width = Math.max(1, Math.round(box.width));
        height = Math.max(1, Math.round(box.height));
        narrow = width < 640;
        camera.aspect = width / height;
        // On a tall narrow window the brain would fill the frame edge to edge,
        // leaving the labels nowhere to sit. Pulling back keeps it a subject.
        camera.position.z = 4.15 + Math.max(0, 1.25 - width / height) * 3.1;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        for (const node of [lineRef.current, dotRef.current]) {
          node?.setAttribute("viewBox", `0 0 ${width} ${height}`);
        }
      };
      measure();
      const sizes = new ResizeObserver(measure);
      sizes.observe(host);

      if (cancelled) {
        sizes.disconnect();
        releaseBrain();
        renderer.dispose();
        renderer.domElement.remove();
        return;
      }
      setReady(true);

      const still = prefersReducedMotion();
      const point = new THREE.Vector3();
      const normal = new THREE.Vector3();
      const toCamera = new THREE.Vector3();

      /** Which beat is being read, and how far through it we are. */
      const readBeat = (p: number) => {
        const span = (LAST - FIRST) / beats.length;
        const raw = (p - FIRST) / span;
        const index = Math.min(beats.length - 1, Math.max(0, Math.floor(raw)));
        return { index, within: Math.min(1, Math.max(0, raw - index)) };
      };

      const smooth = (t: number) => t * t * (3 - 2 * t);
      const clamp = (t: number) => Math.min(1, Math.max(0, t));
      /** Which way the brain leans to leave the label its half of the screen. */
      const aside = (side: Beat["side"]) => (side === "left" ? 0.46 : -0.46);

      /* The scroll position is not read straight. A wheel arrives in lumps of a
         hundred pixels or more, and a brain wired directly to it jumps between
         those lumps — worst of all through a turn, where the whole move can land
         in two frames. Chasing the scroll instead of matching it gives the mass
         back. */
      let eased = clamp(progress.current);
      let clock = 0;
      let last = performance.now();

      let frame = 0;
      const draw = (now: number) => {
        frame = requestAnimationFrame(draw);
        const delta = Math.min((now - last) / 1000, 0.1);
        last = now;
        clock += delta;

        eased += (clamp(progress.current) - eased) * Math.min(1, delta * 4.2);
        const p = eased;
        const { index, within } = readBeat(p);

        /* Each beat holds still while its label is up, then turns to the next
           one. Turning the whole time would mean never actually looking at the
           thing being labelled — and holding for less than about two thirds of
           the beat leaves more of the scroll spent watching it move than
           reading. */
        const here = beats[index];
        const next = beats[Math.min(beats.length - 1, index + 1)];
        const travel = smooth(clamp((within - 0.58) / 0.42));

        const open = smooth(clamp((FIRST - p) / FIRST));
        const close = smooth(clamp((p - LAST) / (1 - LAST)));
        // Nothing on the site is ever perfectly still; a brain held dead level
        // between stops looks switched off rather than waiting.
        const alive = (1 - open) * (1 - close);

        brain.rotation.y =
          here.turn + (next.turn - here.turn) * travel + Math.sin(clock * 0.37) * 0.055 * alive;
        brain.rotation.x =
          here.tilt + (next.tilt - here.tilt) * travel + Math.sin(clock * 0.51) * 0.035 * alive;
        brain.rotation.z = Math.sin(clock * 0.29) * 0.035 * alive;
        /* Low in the frame to open, so the title has the top of the screen to
           itself, and rising into place as the first label comes up; drawn back
           and down again at the close to clear the middle for the last line and
           the way onward. Both ends are the same idea: the brain gets out of the
           way of whatever there is to read. */
        brain.scale.setScalar((narrow ? 1 : 0.92) * (1 - close * 0.38));

        /* Leaning away from whichever side the label is on. Centred, the brain
           runs under the text — and moving over for it is the same gesture a
           camera makes to give a caption room, so it reads as deliberate rather
           than as a fix. Centred again at both ends, where there is no label. */
        brain.position.x = narrow
          ? 0
          : (aside(here.side) + (aside(next.side) - aside(here.side)) * travel) * alive;
        // Lifted on a phone, where the label sits underneath rather than beside.
        brain.position.y =
          (narrow ? 0.34 : 0) - open * 0.62 - close * 0.34 + Math.sin(clock * 0.44) * 0.022 * alive;
        brain.updateMatrixWorld();

        // The label is up for the still part of the beat and gone by the turn.
        const shown =
          p < FIRST || p > LAST
            ? 0
            : Math.min(smooth(clamp(within / 0.14)), 1 - smooth(clamp((within - 0.5) / 0.16)));

        for (let i = 0; i < beats.length; i++) {
          const node = labelRefs.current[i];
          if (node) node.style.opacity = String(i === index ? shown : 0);
        }

        // Where the labelled part of the brain has got to on screen.
        point.set(...here.anchor).applyMatrix4(brain.matrixWorld);
        normal.set(...here.anchor).normalize().transformDirection(brain.matrixWorld);
        toCamera.copy(camera.position).sub(point).normalize();
        const facing = normal.dot(toCamera);

        const projected = point.clone().project(camera);
        const x = (projected.x * 0.5 + 0.5) * width;
        const y = (-projected.y * 0.5 + 0.5) * height;

        const svg = lineRef.current;
        if (svg) {
          const dot = dotRef.current?.querySelector("[data-dot]") as SVGCircleElement | null;
          const lead = svg.querySelector("[data-lead]") as SVGPathElement | null;
          const node = labelRefs.current[index];
          // Faded out as the part turns away, so the line never points at the
          // far side of the brain through the middle of it.
          const strength = shown * smooth(clamp(facing / 0.35));
          svg.style.opacity = String(strength);
          if (dotRef.current) dotRef.current.style.opacity = String(strength);

          if (dot) {
            dot.setAttribute("cx", String(x));
            dot.setAttribute("cy", String(y));
          }
          if (lead && node) {
            const box = node.getBoundingClientRect();
            const stage = host.getBoundingClientRect();
            const fromX = narrow
              ? box.left - stage.left + box.width / 2
              : here.side === "left"
                ? box.right - stage.left
                : box.left - stage.left;
            const fromY = narrow ? box.top - stage.top : box.top - stage.top + box.height / 2;
            const bend = (x - fromX) * 0.45;
            lead.setAttribute(
              "d",
              `M${fromX} ${fromY}C${fromX + bend} ${fromY} ${x - bend} ${y} ${x} ${y}`,
            );
          }
        }

        renderer.render(scene, camera);
      };

      if (still) {
        // No loop at all: one frame at the first beat, and the labels stacked
        // as plain text underneath by the caller.
        brain.rotation.y = beats[0].turn;
        brain.rotation.x = beats[0].tilt;
        brain.scale.setScalar(narrow ? 1 : 0.92);
        brain.updateMatrixWorld();
        renderer.render(scene, camera);
      } else {
        frame = requestAnimationFrame(draw);
      }

      return () => {
        cancelAnimationFrame(frame);
        sizes.disconnect();
        releaseBrain();
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    void start().then((fn) => {
      if (cancelled) fn?.();
      else teardown = fn;
    });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [beats, progress]);

  return (
    <div ref={hostRef} className={`relative ${className}`}>
      {!ready && (
        <BrainMark className="absolute left-1/2 top-1/2 h-32 w-36 -translate-x-1/2 -translate-y-1/2 text-ink/40" />
      )}

      {/* Behind the brain, so the run of it that would cross the surface is
          simply hidden and the line reads as going round the back. */}
      <svg
        ref={lineRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      >
        <path
          data-lead=""
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.4"
          strokeDasharray="5 6"
          strokeLinecap="round"
        />
      </svg>

      {/* The mark itself stays in front: it is the thing being pointed at. */}
      <svg
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
      >
        <circle data-dot="" r="4.5" fill="var(--color-accent)" />
      </svg>

      {beats.map((beat, i) => (
        <div
          key={beat.title}
          ref={(el) => {
            labelRefs.current[i] = el;
          }}
          style={{ opacity: 0 }}
          /* Under the brain on a phone and beside it on anything wider. The
             line to the anchor is measured from wherever the card actually
             lands, so it follows this without being told. */
          className={`pointer-events-none absolute inset-x-5 bottom-[7%] z-20 text-left sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:w-[min(21rem,40vw)] sm:-translate-y-1/2 ${
            beat.side === "left" ? "sm:left-[6vw] sm:text-left" : "sm:right-[6vw] sm:text-right"
          }`}
        >
          <p className="font-hand text-lg text-accent">0{i + 1}</p>
          <h3 className="mt-1 font-reading text-[1.6rem] leading-[1.15] text-ink sm:text-[2rem]">
            {beat.title}
          </h3>
          <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink-soft sm:text-[1rem]">
            {beat.body}
          </p>
        </div>
      ))}
    </div>
  );
}
