"use client";

import { useEffect, useRef, useState } from "react";

import { BrainMark } from "@/components/layout/Logo";
import { DRAW_STEPS, StoryArt, type StoryProp } from "@/components/landing/storyArt";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The brain turning through the story, with a label pinned to whichever part of
 * it is facing you.
 *
 * Nothing here re-renders. Scroll writes a number into `progress`, and the
 * animation loop reads it and writes transforms and opacities straight onto the
 * nodes. Putting five labels and a rotating mesh through React state at sixty
 * frames a second would spend the whole budget on reconciliation.
 *
 * The label cards sit still and the line to the brain moves. The other way
 * round (cards chasing their anchors around the screen) is far harder to read
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
  /** The drawn things standing around the brain while this beat is up. */
  props: StoryProp[];
  /** A note in the margin, in the hand face, the way the rest of the site does. */
  aside: string;
};

/** Everything the beats are laid out across, leaving room to arrive and leave. */
const FIRST = 0.08;
const LAST = 0.86;

/* Turned side on to open. Head on, a brain is a circle with a crease down it;
   from the side you get the length of it, the cerebellum tucked under the back
   and the stem coming away, which is the view that reads as a brain at a glance. */
const OPENING = { turn: -1.28, tilt: 0.1 };

/* The width at which a label can stand beside the brain rather than under it.
   The same number appears as a `min-[900px]:` variant on the cards below, and
   the two have to agree: a card placed beside the brain by CSS while the brain
   still thinks it has the whole stage to itself is a card with a brain on it. */
const BESIDE_AT = 900;

/** Clear air between the text and the edge of the brain. */
const GAP = 44;
/** How far the brain reaches from its own centre, in its own units. */
const REACH = 1.02;

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
  const propRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const numeralRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const asideRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const tickRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
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
      const { buildThreads } = await import("@/lib/brainThreads");
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

      /* Hung on the brain rather than on the scene, so the tangle keeps its
         place around it as it turns, moves aside for a label and shrinks away
         at the end. Loose in the scene it would sit where the brain used to be
         the moment the brain went anywhere. */
      const threads = buildThreads(THREE);
      brain.add(threads.group);

      let width = 0;
      let height = 0;
      /** No room beside the brain, so the label goes under it instead. */
      let narrow = false;
      const measure = () => {
        const box = host.getBoundingClientRect();
        width = Math.max(1, Math.round(box.width));
        height = Math.max(1, Math.round(box.height));
        narrow = width < BESIDE_AT;
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
        threads.dispose();
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

      /**
       * The strip of the stage the brain may stand in, given where a label sits.
       *
       * Measured from the label's own box rather than guessed at from a fixed
       * offset: the card is a fraction of the viewport wide and the brain's size
       * on screen depends on the camera, so any pair of numbers that clears the
       * text at one window size buries it at another.
       */
      const roomBeside = (node: HTMLDivElement | null, side: Beat["side"]) => {
        if (!node) return { centre: width / 2, room: width };
        const box = node.getBoundingClientRect();
        const stage = host.getBoundingClientRect();
        const inner = side === "left" ? box.right - stage.left : box.left - stage.left;
        const lo = side === "left" ? inner + GAP : 0;
        const hi = side === "left" ? width : inner - GAP;
        return { centre: (lo + hi) / 2, room: Math.max(60, hi - lo) };
      };

      /* The scroll position is not read straight. A wheel arrives in lumps of a
         hundred pixels or more, and a brain wired directly to it jumps between
         those lumps, worst of all through a turn, where the whole move can land
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

        eased += (clamp(progress.current) - eased) * Math.min(1, delta * 3.4);
        const p = eased;
        const { index, within } = readBeat(p);

        /* Each beat holds still while its label is up, then turns to the next
           one. Turning the whole time would mean never actually looking at the
           thing being labelled, and holding for less than about two thirds of
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

        /* The tangle belongs to the two ends and to nothing in between. It is
           drawn while the brain is still being introduced, unwrites itself as
           the first beat takes over, and writes itself again once the last one
           is done. Driven by the clock rather than by `alive`, because the ends
           are the only place it is seen and a still tangle is a dead one. */
        threads.set(Math.max(open, close), clock);

        /* Read before anything is written this frame, so measuring the cards
           never lands in the middle of the same frame's style changes. */
        const from = roomBeside(labelRefs.current[index], here.side);
        const to = roomBeside(labelRefs.current[Math.min(beats.length - 1, index + 1)], next.side);
        const centrePx = from.centre + (to.centre - from.centre) * travel;
        const room = from.room + (to.room - from.room) * travel;

        brain.rotation.y =
          here.turn +
          (next.turn - here.turn) * travel +
          (OPENING.turn - beats[0].turn) * open +
          Math.sin(clock * 0.37) * 0.055 * alive;
        brain.rotation.x =
          here.tilt +
          (next.tilt - here.tilt) * travel +
          (OPENING.tilt - beats[0].tilt) * open +
          Math.sin(clock * 0.51) * 0.035 * alive;
        brain.rotation.z = Math.sin(clock * 0.29) * 0.035 * alive;

        /* World units per pixel at the depth the brain sits, which is what turns
           a gap measured off a text box into somewhere to put a mesh. */
        const perPixel = (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360)) / height;
        const reach = REACH / perPixel;
        // Shrunk if the strip left over is narrower than the brain is wide, so
        // it gives way to the words rather than the other way about.
        const fit = narrow ? 1 : Math.min(1, room / (reach * 2));

        /* Pulled in at both ends, and hardest at the opening.

           The stage is a whole window tall but starts below the header, so its
           bottom edge is off the foot of the screen before anyone has scrolled:
           the brain at full size and dropped a whole unit was cut through the
           cerebellum by the fold. Smaller and lifted, it stands clear of both
           the fold and the words above it, and the strokes around it have
           somewhere to go. */
        brain.scale.setScalar(fit * (1 - open * 0.4) * (1 - close * 0.38));

        /* Standing in the middle of whatever the label has left it, and back in
           the middle of the stage at both ends where there is no label. Moving
           over for the text is the same gesture a camera makes to give a caption
           room, so it reads as deliberate rather than as a fix. */
        brain.position.x = narrow ? 0 : (centrePx - width / 2) * perPixel * alive;
        // Lifted on a phone, where the label sits underneath rather than beside.
        brain.position.y =
          (narrow ? 0.34 : 0) - open * 0.3 - close * 0.34 + Math.sin(clock * 0.44) * 0.022 * alive;
        brain.updateMatrixWorld();

        // The label is up for the still part of the beat and gone by the turn.
        const shown =
          p < FIRST || p > LAST
            ? 0
            : Math.min(smooth(clamp(within / 0.14)), 1 - smooth(clamp((within - 0.5) / 0.16)));

        for (let i = 0; i < beats.length; i++) {
          const node = labelRefs.current[i];
          if (node) node.style.opacity = String(i === index ? shown : 0);

          const note = asideRefs.current[i];
          if (note) note.style.opacity = String(i === index ? shown * 0.9 : 0);

          const tick = tickRefs.current[i];
          // The spine marks how far through the telling you are: the one you are
          // on is inked, the rest are pencilled.
          if (tick) {
            const on = i === index && p > FIRST && p < LAST;
            tick.style.backgroundColor = on ? "var(--color-accent)" : "var(--color-rule)";
            tick.style.transform = `scale(${on ? 1 : 0.55})`;
          }

          const numeral = numeralRefs.current[i];
          // The chapter number sits behind everything and lingers a little
          // longer than the words, so the stage is never completely bare.
          if (numeral) numeral.style.opacity = String(i === index ? shown * 0.55 : 0);

          /* The props come up a touch after the label and drift while they are
             there. Staggered by their own index so they arrive as a handful of
             things being set down rather than as one block appearing. */
          const row = propRefs.current[i] ?? [];
          for (let n = 0; n < row.length; n++) {
            const prop = row[n];
            if (!prop) continue;
            if (i !== index) {
              prop.style.opacity = "0";
              continue;
            }
            const late = smooth(clamp((within - 0.04 - n * 0.045) / 0.16));
            prop.style.opacity = String(Math.min(late, shown) * (narrow ? 0 : 1));
            const sway = Math.sin(clock * (0.31 + n * 0.07) + n * 1.7);
            prop.style.transform = `translate(-50%, -50%) translateY(${(sway * 7).toFixed(1)}px) rotate(${(beats[i].props[n].tilt + sway * 1.1).toFixed(2)}deg)`;

            /* Drawn rather than simply shown: the counters run in order, and
               each stroke in the art is pinned to one of them, so the outline
               goes round before the ruled lines are written and the words land
               last. Scrub back up the page and it unwrites itself. */
            const drawing = clamp((within - 0.03 - n * 0.05) / 0.44);
            for (let step = 0; step < DRAW_STEPS; step++) {
              const at = smooth(clamp((drawing - step * 0.055) / 0.4));
              prop.style.setProperty(`--d${step}`, (100 - at * 100).toFixed(1));
            }
            prop.style.setProperty("--ink", smooth(clamp((drawing - 0.22) / 0.34)).toFixed(3));
          }
        }

        // Where the labelled part of the brain has got to on screen.
        point.set(...here.anchor).applyMatrix4(brain.matrixWorld);
        normal
          .set(...here.anchor)
          .normalize()
          .transformDirection(brain.matrixWorld);
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

        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
        }

        renderer.render(scene, camera);
      };

      if (still) {
        // No loop at all: one frame at the first beat, and the labels stacked
        // as plain text underneath by the caller.
        brain.rotation.y = OPENING.turn;
        brain.rotation.x = OPENING.tilt;
        brain.updateMatrixWorld();
        // The opening frame, which is where the tangle is at its fullest.
        threads.set(1, 0);
        renderer.render(scene, camera);
      } else {
        frame = requestAnimationFrame(draw);
      }

      return () => {
        cancelAnimationFrame(frame);
        sizes.disconnect();
        // Off the screen straight away, which is all that has to be immediate.
        renderer.domElement.remove();

        /* The rest is walking every geometry in the scene and dropping a GL
           context, and it was landing in the same frame as the section change
           that unmounted this. One frame doing the teardown, the mount of a
           whole new page and a scroll to the top. Nothing is waiting on it, so
           it goes when the browser next has a moment. */
        const release = () => {
          threads.dispose();
          releaseBrain();
          renderer.dispose();
        };
        const idle = (
          window as Window & {
            requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
          }
        ).requestIdleCallback;
        if (idle) idle(release, { timeout: 1200 });
        else window.setTimeout(release, 300);
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
        <BrainMark className="absolute left-1/2 top-1/2 h-32 w-36 -translate-x-1/2 -translate-y-1/2 opacity-40" />
      )}

      {/* Over the brain rather than behind it. A leader that vanishes where it
          crosses the surface leaves the card pointing at nothing; a line drawn
          across it is read as a line drawn across it. */}
      <svg
        ref={lineRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
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

      {/* How far through the telling you are, down the edge of the page. */}
      <div className="pointer-events-none absolute left-[2.2vw] top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 min-[900px]:flex">
        {beats.map((beat, i) => (
          <span
            key={`tick-${beat.title}`}
            ref={(el) => {
              tickRefs.current[i] = el;
            }}
            aria-hidden="true"
            className="block h-2 w-2 rounded-full transition-[background-color,transform] duration-300"
            style={{ backgroundColor: "var(--color-rule)", transform: "scale(0.55)" }}
          />
        ))}
      </div>

      {/* The scroll, drawn along the foot. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-rule/40"
      >
        <div
          ref={progressRef}
          className="h-full w-full origin-left bg-accent/70"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* A note in the margin, the way the rest of the site annotates itself. */}
      {beats.map((beat, i) => (
        <p
          key={`aside-${beat.title}`}
          ref={(el) => {
            asideRefs.current[i] = el;
          }}
          aria-hidden="true"
          style={{ opacity: 0 }}
          className={`pointer-events-none absolute bottom-[7vh] z-10 hidden font-hand text-lg text-ink-faint min-[900px]:block ${
            beat.side === "left" ? "left-[7vw]" : "right-[7vw]"
          }`}
        >
          {beat.aside}
        </p>
      ))}

      {/* Behind everything: the chapter number, big enough to be scenery. */}
      {beats.map((beat, i) => (
        <p
          key={`numeral-${beat.title}`}
          ref={(el) => {
            numeralRefs.current[i] = el;
          }}
          aria-hidden="true"
          style={{ opacity: 0 }}
          /* Set high rather than dead centre: centred it sits squarely behind
             the brain and never shows at all. From here its top half stands in
             the empty strip above, which is the space it is there to fill. */
          className="pointer-events-none absolute left-1/2 top-[27%] z-0 -translate-x-1/2 -translate-y-1/2 select-none font-reading text-[42vh] leading-none text-ink/[0.05]"
        >
          0{i + 1}
        </p>
      ))}

      {/* The drawn things standing around it. */}
      {beats.map((beat, i) => (
        <div key={`props-${beat.title}`}>
          {beat.props.map((prop, n) => (
            <div
              key={n}
              ref={(el) => {
                if (!propRefs.current[i]) propRefs.current[i] = [];
                propRefs.current[i][n] = el;
              }}
              aria-hidden="true"
              style={{
                opacity: 0,
                left: `${prop.x * 100}%`,
                top: `${prop.y * 100}%`,
                width: `${prop.size * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
              className="pointer-events-none absolute z-10 hidden min-[900px]:block"
            >
              <StoryArt kind={prop.kind} />
            </div>
          ))}
        </div>
      ))}

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
          className={`pointer-events-none absolute inset-x-5 bottom-[7%] z-20 text-left min-[900px]:inset-x-auto min-[900px]:bottom-auto min-[900px]:top-1/2 min-[900px]:w-[min(21rem,38vw)] min-[900px]:-translate-y-1/2 ${
            beat.side === "left"
              ? "min-[900px]:left-[5vw] min-[900px]:text-left"
              : "min-[900px]:right-[5vw] min-[900px]:text-right"
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
