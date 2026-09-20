import brainMark from "@/assets/brain-mark.png";

/**
 * The brain the whole site is signed with: the nav, the footer, the login
 * screen, and the placeholder that holds the space while the 3D one loads.
 *
 * It was a drawn SVG using `currentColor`, which inked itself on paper and
 * chalked itself on the board without a second asset. This is a fixed image
 * instead, so it no longer takes its colour from the text around it. That is
 * fine everywhere it is currently used, because all of them sit on paper, but
 * it is the thing to remember before putting it on an ink ground: it will not
 * invert, and it would need a light variant.
 *
 * The line drawing rather than the filled illustration, which is the other way
 * round from the favicon. At favicon size the solid one reads as a brain and
 * the outline turns to mush; at nav size the solid one is a dense grey blob
 * beside a light serif wordmark, and the outline sits with it. Same subject,
 * two drawings, each used where it survives.
 *
 * A plain `img` rather than `next/image`: every caller sizes this with utility
 * classes, several of them with `h-auto w-auto` inside an absolutely
 * positioned box, and the layout rules `next/image` imposes fight all of that
 * for no benefit at this size. The file is a trimmed 240px copy, under 30 KB
 * and already about twice the largest size it is ever drawn at.
 */
export function BrainMark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brainMark.src}
      alt=""
      aria-hidden="true"
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-ink ${className}`}>
      <BrainMark className="h-10 w-12 shrink-0" />
      <span className="font-reading text-[1.6rem] leading-none tracking-[-0.01em]">Memora</span>
    </span>
  );
}
