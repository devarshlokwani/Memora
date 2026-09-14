"use client";

import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { SketchCard } from "@/components/ui/SketchFrame";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { drawnRectPath } from "@/lib/sketch";

/**
 * The three passes a course goes through, drawn as a diagram you can step
 * through rather than three paragraphs claiming it happens.
 *
 * It advances on its own until you touch it, then it is yours — a widget that
 * keeps moving after someone has taken hold of it is fighting them.
 */

const HOLD = 5200;
const W = 560;
const H = 320;

type StageId = "intake" | "outline" | "drill";

const STEPS: { id: StageId; title: string; body: string }[] = [
  {
    id: "intake",
    title: "Drop in your material",
    body: "Lecture slides, a textbook chapter, your own notes. Up to twelve files at once — Memora reads them together as one body of material rather than one file at a time.",
  },
  {
    id: "outline",
    title: "Get a course, not a pile",
    body: "It works out the themes, orders them the way you should learn them, and splits each into topics worth a single sitting.",
  },
  {
    id: "drill",
    title: "Drill it your way",
    body: "Every topic becomes cards in five formats. Answer them and Memora schedules each card for the day you were about to forget it.",
  },
];

/* ------------------------------------------------------------------ drawing */

const INK = "var(--color-ink)";
const GUIDE = "var(--color-guide-strong)";

function Box({
  x,
  y,
  w,
  h,
  seed,
  rotate = 0,
  fill = "var(--color-card)",
  stroke = INK,
  dashed = false,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  seed: string;
  rotate?: number;
  fill?: string;
  stroke?: string;
  dashed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} ${w / 2} ${h / 2})`}>
      <path
        d={drawnRectPath(w, h, seed, 1.6)}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.4}
        strokeDasharray={dashed ? "6 6" : undefined}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {children}
    </g>
  );
}

/** A labelled box, which is most of what these diagrams are made of. */
function Chip({
  x,
  y,
  w,
  h,
  seed,
  label,
  sub,
  dashed = false,
  tone = INK,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  seed: string;
  label: string;
  sub?: string;
  dashed?: boolean;
  tone?: string;
}) {
  return (
    <g data-rise="">
      <Box x={x} y={y} w={w} h={h} seed={seed} dashed={dashed} stroke={tone}>
        <text
          x={w / 2}
          y={sub ? h / 2 - 1 : h / 2 + 4}
          textAnchor="middle"
          className="text-[12px]"
          fill={tone}
        >
          {label}
        </text>
        {sub ? (
          <text
            x={w / 2}
            y={h / 2 + 14}
            textAnchor="middle"
            className="font-hand text-[13px]"
            fill="var(--color-ink-faint)"
          >
            {sub}
          </text>
        ) : null}
      </Box>
    </g>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <text
      data-rise=""
      x={W / 2}
      y={H - 6}
      textAnchor="middle"
      className="font-hand text-[15px]"
      fill="var(--color-ink-soft)"
    >
      {children}
    </text>
  );
}

/* -------------------------------------------------------------- the scenes */

const FILES = [
  { name: "lecture-04.pdf", x: 30, y: 34, r: -6 },
  { name: "chapter-9.pdf", x: 221, y: 24, r: 1.5 },
  { name: "my-notes.md", x: 412, y: 36, r: 6.5 },
];

const FUNNEL = [
  "M89 180C89 214 200 210 280 238",
  "M280 160C280 196 280 214 280 238",
  "M471 182C471 216 360 210 280 238",
];

function Intake() {
  return (
    <>
      {FILES.map((file, i) => (
        <g key={file.name} data-rise="">
          <Box x={file.x} y={file.y} w={118} h={132} seed={`file-${i}`} rotate={file.r}>
            <text x={59} y={26} textAnchor="middle" className="font-hand text-[14px]" fill={INK}>
              {file.name}
            </text>
            {[0, 1, 2, 3, 4].map((line) => (
              <path
                key={line}
                d={`M18 ${48 + line * 16}H${line === 4 ? 74 : 100}`}
                stroke={GUIDE}
                strokeWidth={1.4}
                strokeDasharray="3 5"
                strokeLinecap="round"
              />
            ))}
          </Box>
        </g>
      ))}

      <g clipPath="url(#intake-reveal)">
        {FUNNEL.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={GUIDE}
            strokeWidth={1.5}
            strokeDasharray="6 7"
            strokeLinecap="round"
          />
        ))}
      </g>

      <g data-rise="">
        <Box x={150} y={240} w={260} h={46} seed="tray">
          <text x={130} y={28} textAnchor="middle" className="text-[13px]" fill={INK}>
            one body of material
          </text>
        </Box>
      </g>

      <Caption>twelve files, read together — not one at a time</Caption>
    </>
  );
}

const MODULES = [
  {
    title: "Module 1",
    sub: "Cell structure",
    x: 58,
    topics: ["Membrane transport", "Organelles", "The nucleus"],
  },
  {
    title: "Module 2",
    sub: "Respiration",
    x: 318,
    topics: ["Glycolysis", "The Krebs cycle", "ATP yield"],
  },
];

function Outline() {
  return (
    <>
      <Chip x={215} y={12} w={130} h={36} seed="course" label="Your course" />

      <g clipPath="url(#outline-reveal)">
        {MODULES.map((module) => (
          <g key={module.title}>
            <path
              d={`M280 48C280 72 ${module.x + 92} 66 ${module.x + 92} 90`}
              fill="none"
              stroke={GUIDE}
              strokeWidth={1.5}
              strokeDasharray="6 7"
              strokeLinecap="round"
            />
            {module.topics.map((topic, i) => (
              <path
                key={topic}
                d={`M${module.x + 16} 130V${163 + i * 42}H${module.x + 32}`}
                fill="none"
                stroke={GUIDE}
                strokeWidth={1.5}
                strokeDasharray="6 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        ))}
      </g>

      {MODULES.map((module) => (
        <g key={module.title}>
          <Chip
            x={module.x}
            y={90}
            w={184}
            h={40}
            seed={module.title}
            label={module.title}
            sub={module.sub}
          />
          {module.topics.map((topic, i) => (
            <Chip
              key={topic}
              x={module.x + 32}
              y={148 + i * 42}
              w={152}
              h={30}
              seed={topic}
              label={topic}
              dashed
              tone="var(--color-ink-soft)"
            />
          ))}
        </g>
      ))}

      <Caption>themes first, then topics worth a single sitting</Caption>
    </>
  );
}

const FORMATS = ["Flashcard", "MCQ", "Fill-in", "Match", "Jargon"];
const SCHEDULE = [
  { day: "1d", x: 74, due: false },
  { day: "3d", x: 178, due: false },
  { day: "8d", x: 312, due: true },
  { day: "21d", x: 486, due: false },
];

function Drill() {
  return (
    <>
      <Chip x={180} y={10} w={200} h={38} seed="topic" label="Topic · Glycolysis" />

      <g clipPath="url(#drill-reveal)">
        {FORMATS.map((format, i) => {
          const cx = 62 + i * 109;
          return (
            <path
              key={format}
              d={`M280 48C280 72 ${cx} 72 ${cx} 94`}
              fill="none"
              stroke={GUIDE}
              strokeWidth={1.5}
              strokeDasharray="6 7"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {FORMATS.map((format, i) => (
        <Chip
          key={format}
          x={12 + i * 109}
          y={94}
          w={100}
          h={34}
          seed={format}
          label={format}
          tone="var(--color-ink-soft)"
        />
      ))}

      <g data-rise="">
        {/* One answer, then a date for it: without this leg the formats and the
            schedule read as two unrelated drawings sharing a frame. */}
        <path
          d="M280 140V178"
          fill="none"
          stroke={GUIDE}
          strokeWidth={1.5}
          strokeDasharray="6 7"
          strokeLinecap="round"
        />
        <path
          d="M275 172L280 180L285 172"
          fill="none"
          stroke={GUIDE}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x={296} y={166} className="font-hand text-[14px]" fill="var(--color-ink-soft)">
          answer one
        </text>

        <path
          d="M40 208C180 204 380 212 520 207"
          fill="none"
          stroke={GUIDE}
          strokeWidth={1.5}
          strokeDasharray="6 7"
          strokeLinecap="round"
        />
        {SCHEDULE.map((stop) => (
          <g key={stop.day}>
            <circle
              cx={stop.x}
              cy={208}
              r={stop.due ? 6.5 : 4}
              fill={stop.due ? "var(--color-accent)" : "var(--color-card)"}
              stroke={stop.due ? "var(--color-accent)" : INK}
              strokeWidth={1.4}
            />
            <text
              x={stop.x}
              y={232}
              textAnchor="middle"
              className="text-[11px]"
              fill={stop.due ? "var(--color-accent)" : "var(--color-ink-soft)"}
            >
              {stop.day}
            </text>
          </g>
        ))}
        <text
          x={280}
          y={268}
          textAnchor="middle"
          className="font-hand text-[14px]"
          fill="var(--color-accent)"
        >
          the next review lands the day you were about to forget it
        </text>
      </g>

      <Caption>five ways in, one schedule out</Caption>
    </>
  );
}

/* -------------------------------------------------------------- the widget */

const SCENES: Record<
  StageId,
  { node: React.ReactNode; clip: string; rect: { y: number; h: number } }
> = {
  intake: { node: <Intake />, clip: "intake-reveal", rect: { y: 154, h: 96 } },
  outline: {
    node: <Outline />,
    clip: "outline-reveal",
    rect: { y: 44, h: 230 },
  },
  drill: { node: <Drill />, clip: "drill-reveal", rect: { y: 44, h: 60 } },
};

export function CoursePipeline() {
  const [stage, setStage] = useState<StageId>("intake");
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SVGGElement>(null);

  // Only cycle while someone is actually looking at it.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !seen || prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      setStage((current) => {
        const next = STEPS.findIndex((step) => step.id === current) + 1;
        return STEPS[next % STEPS.length].id;
      });
    }, HOLD);
    return () => window.clearInterval(timer);
  }, [auto, seen]);

  useLayoutEffect(() => {
    const scene = sceneRef.current;
    if (!scene || prefersReducedMotion()) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-rise]",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: EASE, stagger: 0.055 },
      );
      // The connectors are dashed, so they cannot be drawn with a dash offset —
      // that marches the pattern along instead. A clip growing downward over
      // them is the same gesture without fighting the stroke.
      gsap.fromTo(
        "[data-clip]",
        { attr: { height: 0 } },
        {
          attr: { height: SCENES[stage].rect.h },
          duration: 0.75,
          ease: "power2.out",
          delay: 0.2,
        },
      );
    }, scene);

    return () => context.revert();
  }, [stage]);

  const pick = (id: StageId) => {
    setStage(id);
    setAuto(false);
  };

  const scene = SCENES[stage];
  const active = STEPS.find((step) => step.id === stage);

  return (
    <div ref={hostRef} className="mx-auto mt-14 max-w-5xl">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-center">
        <ol className="space-y-3">
          {STEPS.map((step, i) => {
            const on = step.id === stage;
            return (
              <li key={step.id}>
                <SketchCard
                  seed={`step-${step.id}`}
                  tilt={false}
                  filled={on}
                  dashed={!on}
                  stroke={on ? "var(--color-ink)" : "var(--color-rule)"}
                >
                  <button
                    type="button"
                    onClick={() => pick(step.id)}
                    aria-pressed={on}
                    className="block w-full rounded-[1.4rem] px-5 py-4 text-left"
                  >
                    <span className="flex items-baseline gap-3">
                      <span
                        className={`font-hand text-2xl ${on ? "text-accent" : "text-ink-faint"}`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`text-[1.02rem] font-semibold ${on ? "text-ink" : "text-ink-soft"}`}
                      >
                        {step.title}
                      </span>
                    </span>
                    <span className="mt-1.5 block text-[0.92rem] leading-relaxed text-ink-soft">
                      {step.body}
                    </span>
                  </button>
                </SketchCard>
              </li>
            );
          })}
        </ol>

        {/* Under about 520px the labels in the diagram would shrink past reading
            size, so it keeps its width and scrolls rather than scaling with the
            column it sits in. */}
        {/* min-w-0 or the grid column sizes itself to the diagram's minimum
            width and takes the whole page sideways with it. */}
        <div className="min-w-0">
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label={`Diagram: ${active?.title ?? ""}`}
              className="h-auto w-full min-w-[520px] overflow-visible"
            >
              <g ref={sceneRef} key={stage}>
                <defs>
                  <clipPath id={scene.clip}>
                    <rect data-clip="" x={0} y={scene.rect.y} width={W} height={scene.rect.h} />
                  </clipPath>
                </defs>
                {scene.node}
              </g>
            </svg>
          </div>
          <p className="mt-3 text-center font-hand text-base text-ink-soft/70 sm:hidden">
            drag the drawing sideways to see the rest &rarr;
          </p>
        </div>
      </div>
    </div>
  );
}
