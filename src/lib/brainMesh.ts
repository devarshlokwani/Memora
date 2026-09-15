import type * as ThreeNS from "three";

import { brainstemRing, cerebellumPoint, cerebrumPoint } from "@/lib/brain";

/**
 * The brain as three.js objects, built from the shapes in `lib/brain`.
 *
 * Kept out of any one component because two places show the same brain now:
 * standing in front of the wordmark in the footer, and turning through the
 * story at the top of the site. Two copies of this would drift apart the first
 * time either was touched.
 *
 * `THREE` is handed in rather than imported: the library is loaded on demand by
 * whichever component needs it, and importing it here would drag the whole of
 * it into the initial bundle. The type import costs nothing, being erased.
 */

/* Icosahedron detail is not a doubling: each face is cut into (detail + 1)^2
   triangles, so 5 is 720 triangles for the whole sphere and far too coarse to
   hold a fold. These are chosen for the size of the features they carry. */
const CEREBRUM = 30;
const CEREBELLUM = 14;

export type BrainMesh = {
  group: ThreeNS.Group;
  /** Everything the group owns, to be released when the scene goes. */
  dispose: () => void;
};

export function buildBrain(THREE: typeof ThreeNS): BrainMesh {
  /* Banded shading, which is what turns a lit surface into something that looks
     drawn rather than photographed.

     Sixteen steps, not four. Toon shading looks the ramp up at
     `dot(normal, light) * 0.5 + 0.5`, so everything facing the light at all is
     squeezed into the top half of the texture. A four-step ramp spends two of
     them on the shadow side and leaves the whole lit surface with a single tone,
     which is how a folded brain comes out as a smooth pebble. Weighted light, so
     it reads as paper with shadow in the sulci rather than as a grey rock. */
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

  const spent: { dispose: () => void }[] = [ramp, surface, outline];

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

  const group = new THREE.Group();
  const parts = [shaped(CEREBRUM, cerebrumPoint), shaped(CEREBELLUM, cerebellumPoint), stem()];
  for (const geometry of parts) group.add(new THREE.Mesh(geometry, surface));

  /* The outline: the same geometry again, a little larger and drawn inside-out,
     so only its far side survives and reads as a line round the edge. Scaled
     from the centre rather than pushed out along each normal: normals in a fold
     point at each other, so an offset shell turns itself inside out in every
     sulcus and scribbles black through the surface. */
  for (const geometry of parts) {
    const shell = new THREE.Mesh(geometry, outline);
    shell.scale.setScalar(1.012);
    group.add(shell);
  }

  return {
    group,
    dispose: () => {
      for (const item of spent) item.dispose();
    },
  };
}

/**
 * The three lights the brain is lit by, kept here so both scenes agree.
 *
 * Deliberately dim. The bands are what draw the folds, and anything much past
 * full brightness pins the whole surface to the top of the ramp and hands back
 * a white blob with an outline round it. Ambient especially: it lifts every band
 * by the same amount, and enough of it flattens the shading into one tone.
 */
export function brainLights(THREE: typeof ThreeNS): ThreeNS.Light[] {
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(-1.5, 2.1, 2.2);

  const rim = new THREE.DirectionalLight(0xffffff, 0.3);
  rim.position.set(2.2, -0.4, -1.9);

  return [new THREE.AmbientLight(0xffffff, 0.2), key, rim];
}
