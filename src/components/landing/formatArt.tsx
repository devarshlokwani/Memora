import { drawnRectPath } from "@/lib/sketch";

/**
 * A drawing for each way of being asked.
 *
 * The cards in this section used to be five paragraphs in five boxes, which is
 * a list of features rather than a look at anything. These say the same thing in
 * one glance: a card being turned over, four options with one ticked, a sentence
 * with a hole in it, two columns wired together, a term with its meaning written
 * underneath.
 *
 * Every stroke is `currentColor`, because the deck alternates ink cards and
 * paper ones and the same drawing has to work either way round.
 *
 * Nothing here is a piece of clip art with a rounded rectangle and a perfect
 * circle. The boxes come from the same pen as the rest of the site, and the
 * lines wander, so a drawing sits on the page as though somebody put it there.
 */

const SIZE = 132;

function Sheet({
  x,
  y,
  w,
  h,
  seed,
  fill = "none",
  tilt = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  seed: string;
  fill?: string;
  tilt?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt} ${w / 2} ${h / 2})`}>
      <path d={drawnRectPath(w, h, seed, 1.6)} fill={fill} />
    </g>
  );
}

/** The frame every drawing is set in, so they all sit at the same weight. */
function Art({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="overflow-visible"
    >
      {children}
    </svg>
  );
}

/** A prompt on one side and an answer on the other, caught mid turn. */
function Flashcard() {
  return (
    <Art>
      <Sheet x={14} y={30} w={74} h={62} seed="fmt-flash-back" tilt={-7} />
      <Sheet x={40} y={40} w={74} h={62} seed="fmt-flash-front" tilt={4} />
      {/* The question mark, drawn rather than set: a hook, a turn and a dot. */}
      <path d="M62 60c1-7 8-10 13-7s3 9-1 12-5 5-5 9" />
      <path d="M68 84.5h.6" strokeWidth={3.6} />
      {/* The way round, over the top. */}
      <path d="M22 26c14-11 40-13 58-6" strokeDasharray="4 5" />
      <path d="M74 13l8 7-9 6" />
    </Art>
  );
}

/** Four options, one of them right. */
function Mcq() {
  return (
    <Art>
      {[0, 1, 2, 3].map((n) => {
        const y = 24 + n * 25;
        const right = n === 1;
        return (
          <g key={n}>
            <circle cx={22} cy={y} r={7.5} />
            {right ? <path d="M18.5 24.5l3 3.5 5.5-6.5" strokeWidth={2.4} /> : null}
            <path
              d={`M40 ${y}h${right ? 66 : 48 + (n % 3) * 9}`}
              strokeWidth={right ? 2.6 : 1.8}
            />
          </g>
        );
      })}
    </Art>
  );
}

/** A sentence with the one word that matters taken out of it. */
function FillBlank() {
  return (
    <Art>
      <path d="M16 34h100" />
      <path d="M16 52h30" />
      {/* The hole, and the line you write on. */}
      <path d="M52 56h32" strokeWidth={2.8} />
      <path d="M90 52h26" />
      <path d="M16 70h74" />
      <path d="M16 88h54" />
      {/* The cursor, waiting in the hole. */}
      <path d="M66 42v11" strokeWidth={2.2} />
    </Art>
  );
}

/** Two columns that belong together, being wired up. */
function Match() {
  const rows = [0, 1, 2];
  return (
    <Art>
      {rows.map((n) => {
        const y = 32 + n * 26;
        return (
          <g key={n}>
            <path d={`M14 ${y}h30`} />
            <circle cx={50} cy={y} r={4} />
            <circle cx={82} cy={y + (n === 1 ? -26 : n === 0 ? 26 : 0)} r={4} />
            <path d={`M88 ${y + (n === 1 ? -26 : n === 0 ? 26 : 0)}h30`} />
          </g>
        );
      })}
      {/* Crossed over, because the pairs are never in the same order twice. */}
      <path d="M54 32c12 4 16 18 24 24" strokeDasharray="4 4" />
      <path d="M54 58c12-4 16-18 24-24" strokeDasharray="4 4" />
      <path d="M54 84h24" strokeDasharray="4 4" />
    </Art>
  );
}

/** A term, and what you have to be able to write under it. */
function Jargon() {
  return (
    <Art>
      <Sheet x={16} y={18} w={62} h={24} seed="fmt-jargon-term" tilt={-2} />
      <path d="M28 30h38" strokeWidth={2.6} />
      <path d="M16 58h94" />
      <path d="M16 74h80" />
      {/* Still being written: the line stops, and the nib is on it. */}
      <path d="M16 90h34" />
      <path d="M56 96l6-18 7 4-8 17z" />
      <path d="M58 89l7 4" />
    </Art>
  );
}

export const FORMAT_ART: Record<string, () => React.ReactElement> = {
  flashcard: Flashcard,
  mcq: Mcq,
  fill_blank: FillBlank,
  match: Match,
  jargon: Jargon,
};
