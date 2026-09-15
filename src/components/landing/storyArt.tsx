import { drawnRectPath } from "@/lib/sketch";

/**
 * The drawn things that stand around the brain while the story is told.
 *
 * Each one is a small piece of the thing its beat is talking about: sheets of
 * paper for what you hand over, a course tree for what comes back, a card for
 * each way of being asked. They are not decoration for its own sake: a stage
 * with nothing on it but a subject and a caption reads as a diagram, and the
 * point of this part of the site is that it should read as a story.
 *
 * All of them are drawn the way the rest of the site is drawn (wobbling boxes,
 * dashed rules, marginalia in the hand face) so they belong to the same page.
 *
 * And they are drawn in front of you rather than simply appearing. Every stroke
 * takes its dash offset from a custom property that the stage counts down as the
 * beat runs: the outline goes round first, then the ruled lines fill in one
 * after another like something being written, then the words come up. Setting
 * `pathLength` to 100 normalises every path, so one number drives them all
 * however long the actual stroke happens to be.
 */

const INK = "var(--color-ink)";
const GUIDE = "var(--color-guide-strong)";
const ACCENT = "var(--color-accent)";

/** A stroke that draws itself, taking its place in the order from `step`. */
const drawn = (step: number) => ({
  pathLength: 100,
  strokeDasharray: 100,
  style: { strokeDashoffset: `var(--d${Math.min(7, step)}, 0)` },
});

/** Anything a line cannot draw: words, fills and dots, which fade instead. */
const inked = { style: { opacity: "var(--ink, 1)" } };

function Box({
  w,
  h,
  seed,
  fill = "var(--color-card)",
  stroke = INK,
  dashed = false,
  children,
}: {
  w: number;
  h: number;
  seed: string;
  fill?: string;
  stroke?: string;
  dashed?: boolean;
  children?: React.ReactNode;
}) {
  const path = drawnRectPath(w, h, seed, 1.5);
  return (
    <>
      {/* The paper arrives with the words; the pen goes round it first. */}
      <path d={path} fill={fill} stroke="none" {...inked} />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.3}
        strokeLinejoin="round"
        strokeLinecap="round"
        {...(dashed ? { strokeDasharray: "5 5", ...inked } : drawn(0))}
      />
      {children}
    </>
  );
}

/**
 * Ruled lines inside something meant to read as written on.
 *
 * Solid rather than dashed: a dash pattern and a draw-in both want the dash
 * array, and the writing is the better use of it.
 */
function Ruled({
  from,
  count,
  width,
  step = 13,
  at = 1,
}: {
  from: number;
  count: number;
  width: number;
  step?: number;
  /** Which of the stage's counters the first line is written on. */
  at?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <path
          key={i}
          d={`M14 ${from + i * step}H${i === count - 1 ? width - 34 : width - 14}`}
          fill="none"
          stroke={GUIDE}
          strokeWidth={1.3}
          strokeLinecap="round"
          {...drawn(at + i)}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ the art */

/** A sheet of whatever you handed over. */
function Sheet({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 132 152" className="h-full w-full overflow-visible">
      <Box w={132} h={152} seed={`sheet-${name}`}>
        <text
          x={66}
          y={26}
          textAnchor="middle"
          className="font-hand text-[14px]"
          fill={INK}
          {...inked}
        >
          {name}
        </text>
        <Ruled from={48} count={6} width={132} />
      </Box>
    </svg>
  );
}

/** A course coming out of it: one theme, the topics under it. */
function Branch() {
  return (
    <svg viewBox="0 0 176 138" className="h-full w-full overflow-visible">
      <Box w={176} h={34} seed="branch-head">
        <text x={88} y={22} textAnchor="middle" className="text-[12px]" fill={INK} {...inked}>
          Module 2
        </text>
      </Box>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path
            d={`M18 34V${64 + i * 34}H34`}
            fill="none"
            stroke={GUIDE}
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...drawn(1 + i * 2)}
          />
          <g transform={`translate(34 ${50 + i * 34})`}>
            <Box w={128} h={26} seed={`branch-${i}`} dashed stroke="var(--color-ink-soft)">
              <text
                x={64}
                y={17}
                textAnchor="middle"
                className="text-[11px]"
                fill="var(--color-ink-soft)"
                {...inked}
              >
                {["Glycolysis", "The Krebs cycle", "ATP yield"][i]}
              </text>
            </Box>
          </g>
        </g>
      ))}
    </svg>
  );
}

/** One of the five ways of being asked. */
function FormatCard({ label, inverted = false }: { label: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 138 92" className="h-full w-full overflow-visible">
      <Box
        w={138}
        h={92}
        seed={`format-${label}`}
        fill={inverted ? INK : "var(--color-card)"}
        stroke={inverted ? "var(--color-paper)" : INK}
      >
        <text
          x={16}
          y={30}
          className="font-reading text-[16px]"
          fill={inverted ? "var(--color-paper)" : INK}
          {...inked}
        >
          {label}
        </text>
        <Ruled from={50} count={3} width={138} at={2} />
      </Box>
    </svg>
  );
}

/** A numbered passage, with the bit the card came from marked. */
function Passage() {
  return (
    <svg viewBox="0 0 196 104" className="h-full w-full overflow-visible">
      <Box w={196} h={104} seed="passage">
        <text x={16} y={26} className="font-hand text-[14px]" fill={ACCENT} {...inked}>
          [C1]
        </text>
        <Ruled from={44} count={4} width={196} at={1} />
        {/* The mark over the line it was taken from, put down last of all. */}
        <path
          d="M15 60C58 57 118 63 160 59"
          fill="none"
          stroke={ACCENT}
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.55}
          {...drawn(6)}
        />
      </Box>
    </svg>
  );
}

/** What memory does on its own, and where a card is put to catch it. */
function ForgettingCurve() {
  return (
    <svg viewBox="0 0 208 116" className="h-full w-full overflow-visible">
      <path
        d="M12 100H196"
        fill="none"
        stroke={GUIDE}
        strokeWidth={1.3}
        strokeLinecap="round"
        {...drawn(0)}
      />
      {/* Falling away from the left, the way it is read. */}
      <path
        d="M12 18C44 66 74 88 196 96"
        fill="none"
        stroke={INK}
        strokeWidth={1.5}
        strokeLinecap="round"
        {...drawn(1)}
      />
      {[
        [56, 62],
        [104, 82],
      ].map(([x, y]) => (
        <circle
          key={x}
          cx={x}
          cy={y}
          r={3.2}
          fill="var(--color-card)"
          stroke={INK}
          strokeWidth={1.3}
          {...inked}
        />
      ))}
      <path
        d="M150 90V28"
        fill="none"
        stroke={ACCENT}
        strokeWidth={1.3}
        strokeLinecap="round"
        {...drawn(5)}
      />
      <circle cx={150} cy={90} r={5} fill={ACCENT} {...inked} />
      <text
        x={150}
        y={20}
        textAnchor="middle"
        className="font-hand text-[13px]"
        fill={ACCENT}
        {...inked}
      >
        due
      </text>
    </svg>
  );
}

export type PropKind =
  | { art: "sheet"; name: string }
  | { art: "branch" }
  | { art: "format"; label: string; inverted?: boolean }
  | { art: "passage" }
  | { art: "curve" };

/** Where a prop stands, as a fraction of the stage, and how big. */
export type StoryProp = {
  kind: PropKind;
  x: number;
  y: number;
  /** Width as a fraction of the stage's width. */
  size: number;
  tilt: number;
};

/** How many counters the stage has to run for a prop to finish drawing. */
export const DRAW_STEPS = 8;

export function StoryArt({ kind }: { kind: PropKind }) {
  switch (kind.art) {
    case "sheet":
      return <Sheet name={kind.name} />;
    case "branch":
      return <Branch />;
    case "format":
      return <FormatCard label={kind.label} inverted={kind.inverted} />;
    case "passage":
      return <Passage />;
    case "curve":
      return <ForgettingCurve />;
  }
}
