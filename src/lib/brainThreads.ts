import type * as ThreeNS from "three";

/**
 * The strokes that circle the brain at the two ends of the story.
 *
 * A tangle of long pen lines orbiting it, drawn on at the opening, unwritten as
 * the story starts, and written again as it closes. They exist to give the
 * brain somewhere to be at the two moments when nothing is being said about it:
 * a mesh alone on a field of paper is an object waiting, and a mesh inside a
 * drawn tangle is a subject being thought about.
 *
 * They are lines rather than glow. The reference for this was neon filaments on
 * black, which is a different drawing altogether; what carries over is the
 * movement, not the light. Everything here is the same pen as the marks on the
 * page behind it, so the tangle reads as more of the same hand.
 *
 * Orbits rather than scribble. An earlier pass gave every stroke a random plane
 * and a heavy wobble, and twenty of those crossing each other is noise: no line
 * you can follow, and nothing behind it you can see. These are ellipses with
 * only enough drift in them to keep the pen in it, their planes spread evenly
 * over the sphere rather than thrown at it, and their radii stepped rather than
 * drawn from a hat. It reads as a system around the brain, which is the idea,
 * and it still is not a set of rings: no two share a plane, a radius or a shape.
 */

/* Ten. Twenty was a ball of wool; below about eight there is no system left to
   read, only a few loops. */
const THREADS = 10;
/** Points per stroke. The wobble is low-frequency, so this is plenty smooth. */
const POINTS = 220;
const TAU = Math.PI * 2;

/* Outside the brain, which reaches about 1.02 in its own units, and inside what
   the camera can see, which is around 1.19 above and below the middle at the
   distance it sits. A stroke wider than that stops being an orbit and becomes a
   line crossing the screen. */
const NEAR = 1.08;
const FAR = 1.4;

/** Longest a stroke waits before it begins to draw, as a fraction of the run-in. */
const STAGGER = 0.4;

/** Turns an index into a direction, spreading the set evenly over a sphere. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export type BrainThreads = {
  group: ThreeNS.Group;
  /**
   * @param presence 0 hides them, 1 is the whole tangle drawn.
   * @param clock Seconds since the scene started, for the drift.
   */
  set: (presence: number, clock: number) => void;
  dispose: () => void;
};

/** Small deterministic generator, so the tangle is the same one every visit. */
function seeded(seed: number) {
  let h = seed >>> 0;
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp = (t: number) => Math.min(1, Math.max(0, t));

export function buildThreads(THREE: typeof ThreeNS, seed = 0x6d656d): BrainThreads {
  const rand = seeded(seed);
  const group = new THREE.Group();

  type Thread = {
    line: ThreeNS.Line;
    material: ThreeNS.LineBasicMaterial;
    geometry: ThreeNS.BufferGeometry;
    /** Where in the run-in this one starts to draw. */
    delay: number;
    /** Radians a second the stroke travels around inside its own plane. */
    spin: number;
    phase: number;
    opacity: number;
  };

  const threads: Thread[] = [];

  for (let i = 0; i < THREADS; i++) {
    /* Stepped out from the brain rather than drawn at random, with a little
       play so the spacing is not a ruler. Evenly spaced orbits are what make a
       set of them read as one arrangement instead of as a pile. */
    const step = i / (THREADS - 1);
    const radius = NEAR + (step + (rand() - 0.5) * 0.12) * (FAR - NEAR);
    // Flatter than it is wide: there is room either side of the brain and very
    // little above it, and an ellipse lying that way also reads as an orbit
    // seen at an angle rather than as a hoop.
    const squash = 0.64 + rand() * 0.3;

    /* One harmonic, and a shallow one. This is the whole of the hand in it: the
       line is off true by a few per cent of its radius, which is a pen going
       round rather than a compass, and no more than that. Two deeper ones read
       as a scribble the moment several cross. */
    const wobble = [{ k: 2 + Math.floor(rand() * 2), a: 0.012 + rand() * 0.03, p: rand() * TAU }];
    /* Out of its own plane, so the stroke passes over the brain and back behind.
       Enough of it that no orbit is ever flat: a flat one seen edge on projects
       to a straight line, and a straight line among a dozen curves does not read
       as an orbit end on, it reads as a stick somebody left in the drawing. */
    const lift = { k: 1 + Math.floor(rand() * 2), a: 0.1 + rand() * 0.22, p: rand() * TAU };

    /* A couple of them stop short of closing. Every loop complete is a little
       too tidy, and the open ends are where you can tell it was drawn. */
    const closed = rand() > 0.25;
    const arc = closed ? TAU : TAU * (0.72 + rand() * 0.2);

    const positions = new Float32Array(POINTS * 3);
    for (let n = 0; n < POINTS; n++) {
      const t = (n / (POINTS - 1)) * arc;
      let r = radius;
      for (const w of wobble) r *= 1 + w.a * Math.sin(w.k * t + w.p);
      positions[n * 3] = Math.cos(t) * r;
      positions[n * 3 + 1] = Math.sin(t) * r * squash;
      positions[n * 3 + 2] = Math.sin(lift.k * t + lift.p) * lift.a * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);

    /* Ink for most of them and the rule grey for the rest. Every stroke in full
       ink flattens the tangle into a stencil; the pale ones fall back and give
       it a front and a back. */
    const material = new THREE.LineBasicMaterial({
      color: rand() > 0.38 ? 0x0b090a : 0x8b807e,
      transparent: true,
      opacity: 0,
      /* Tested against the brain, so a stroke behind it is hidden by it, but
         never written to the buffer: strokes crossing each other should stack
         up in tone rather than punch holes in one another. */
      depthWrite: false,
    });

    const line = new THREE.Line(geometry, material);
    const pivot = new THREE.Object3D();
    pivot.add(line);
    group.add(pivot);
    // Set once and never touched again. See `set` for why.

    /* Planes spread over the sphere by the golden angle rather than picked at
       random. Random orientations clump: three of ten end up near enough the
       same plane to read as one thick line, and the gaps they leave read as the
       set being unfinished. This gives every orbit its own piece of the sphere. */
    const height = 1 - (i / (THREADS - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - height * height));
    const normal = new THREE.Vector3(
      Math.cos(GOLDEN * i) * ring,
      height,
      Math.sin(GOLDEN * i) * ring,
    );
    // The loop is drawn in the xy plane, so its normal is z. Turn that to face
    // the direction this one has been given.
    pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

    threads.push({
      line,
      material,
      geometry,
      delay: rand() * STAGGER,
      spin: (0.03 + rand() * 0.07) * (rand() > 0.5 ? 1 : -1),
      phase: rand() * TAU,
      // Darker than before. Ten lines have to carry what twenty were carrying.
      opacity: 0.2 + rand() * 0.22,
    });
  }

  const set = (presence: number, clock: number) => {
    const shown = clamp(presence);
    group.visible = shown > 0.002;
    if (!group.visible) return;

    /* The whole arrangement turns as one, and no orbit ever leaves its plane.

       This is the difference between the two ends of the story looking alike and
       not. An earlier pass tumbled each stroke about an axis of its own, which
       looks fine for the first second and then undoes the even spread they were
       given: by the far end of the scroll each has turned by a different amount,
       several have wandered into the same plane and read as one heavy line, and
       what was an arrangement is a thicket. Turning the set rigidly keeps the
       spacing it was built with for as long as anyone is looking at it. */
    group.rotation.y = clock * 0.055;
    group.rotation.x = Math.sin(clock * 0.09) * 0.2;

    for (const thread of threads) {
      /* Drawn on from one end rather than faded up. Every other mark on the
         site arrives by being drawn, and a tangle that simply appears at full
         opacity is the one thing here that was printed. Scrub back up and it
         unwrites itself, the same way the props do. */
      const at = smooth(clamp((shown - thread.delay) / (1 - STAGGER)));
      thread.geometry.setDrawRange(0, Math.round(at * POINTS));
      thread.material.opacity = thread.opacity * at;

      /* Inside its own plane, which is the one turn that costs the arrangement
         nothing: the orbit stays exactly where it was put and the stroke travels
         around it, carrying its open end and its wobble with it. */
      thread.line.rotation.z = thread.phase + clock * thread.spin;
    }
  };

  return {
    group,
    set,
    dispose: () => {
      for (const thread of threads) {
        thread.geometry.dispose();
        thread.material.dispose();
      }
    },
  };
}
