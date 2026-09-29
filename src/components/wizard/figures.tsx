import type { MeasurementView } from "@/lib/catalog/types";

/*
 * One consistent line-art set for the measurement wizard: front, back and side croquis
 * (about 8 heads, natural waist at the narrowest point, hips at the fullest part of the
 * seat) and a heeled shoe. All share a 240×480 frame, a single 1.25px stroke and no fills.
 * Measured areas are drawn on top by <MeasureOverlay/> in champagne.
 */

const HALF_FRONT = [
  // neck and shoulder slope
  "M113,64 L113,84 C106,88 92,90 84,95",
  // arm: outer edge down, hand, inner edge back up to the armpit
  "C78,98 75,106 74,118 L70,186 L66,252 C64,262 64,272 66,282 C68,288 74,288 75,282 L76,254 L80,188 L86,130",
  // body side: under bust, natural waist, fullest hip, thigh, knee, calf, ankle, foot
  "M88,126 C88,142 86,152 90,164 C94,176 97,184 97,192 C95,210 85,222 83,238 C82,252 86,262 90,274 L99,344 C99,360 98,380 100,400 L104,440 C104,448 100,454 96,460 L114,461 L113,442 C114,400 114,370 114,346 L117,276 C118,268 119,264 120,262",
  // collarbone
  "M106,92 C110,94 114,94 118,93",
].join(" ");

const BUST = "M96,132 C98,146 108,150 118,144";
const SHOULDER_BLADE = "M100,112 C104,124 110,126 114,120";

function Mirror({ d }: { d: string }) {
  return (
    <>
      <path d={d} />
      <path d={d} transform="translate(240,0) scale(-1,1)" />
    </>
  );
}

function FigureFront() {
  return (
    <g>
      <ellipse cx="120" cy="43" rx="16" ry="21" />
      <Mirror d={HALF_FRONT} />
      <Mirror d={BUST} />
    </g>
  );
}

function FigureBack() {
  return (
    <g>
      <ellipse cx="120" cy="43" rx="16" ry="21" />
      <Mirror d={HALF_FRONT} />
      <Mirror d={SHOULDER_BLADE} />
      <path d="M120,90 L120,196" strokeDasharray="2 4" opacity="0.6" />
    </g>
  );
}

function FigureSide() {
  return (
    <g>
      <ellipse cx="118" cy="43" rx="16" ry="21" />
      <path d="M133,38 L138,46 L133,49" />
      {/* neck */}
      <path d="M112,63 L110,86 M126,62 L126,84" />
      {/* front edge: chest, bust, under bust, waist, hip front, thigh, knee, shin, foot */}
      <path d="M126,84 C130,96 134,110 140,130 C144,140 142,150 134,160 C130,172 128,182 128,192 C130,206 132,216 132,232 C134,256 132,280 130,300 L128,344 C127,380 125,410 124,440 C126,452 138,456 148,461 L114,461 L114,452" />
      {/* back edge: upper back, waist, fullest part of the seat, thigh, knee, calf */}
      <path d="M110,86 C104,100 102,116 104,140 C106,166 110,182 112,192 C104,208 98,224 98,240 C98,258 104,272 108,290 L114,344 C110,370 108,396 112,440 L114,452" />
      {/* arm hanging at the side */}
      <path d="M116,96 C112,100 112,110 112,120 L114,190 L122,254 C124,264 126,272 124,280" />
    </g>
  );
}

function Shoe() {
  return (
    <g>
      <path d="M40,300 C40,290 50,284 64,282 C90,278 110,272 126,262 C136,256 146,246 156,238 C164,232 176,228 186,230 C194,232 198,240 196,252 L194,262 L190,330 L180,330 L178,272 C160,286 110,300 60,304 C48,305 40,304 40,300 Z" />
      <path d="M24,331 L216,331" opacity="0.5" />
    </g>
  );
}

export function Figure({ view }: { view: MeasurementView }) {
  if (view === "back") return <FigureBack />;
  if (view === "side") return <FigureSide />;
  if (view === "shoe") return <Shoe />;
  return <FigureFront />;
}

type Band = { type: "band"; cx: number; cy: number; rx: number; ry: number };
type Line = { type: "line"; points: [number, number][] };
type Overlay = Band | Line;

/** Where each measurement sits on its view. Keys match measurement_definitions.id. */
export const OVERLAYS: Record<string, Overlay> = {
  height: { type: "line", points: [[206, 22], [206, 461]] },
  bust: { type: "band", cx: 120, cy: 140, rx: 36, ry: 6 },
  underbust: { type: "band", cx: 120, cy: 162, rx: 31, ry: 5 },
  waist: { type: "band", cx: 120, cy: 192, rx: 25, ry: 5 },
  hips: { type: "band", cx: 115, cy: 238, rx: 20, ry: 6 },
  shoulder_width: { type: "line", points: [[84, 96], [156, 96]] },
  hollow_to_floor: { type: "line", points: [[120, 88], [120, 461]] },
  heel_height: { type: "line", points: [[206, 331], [206, 262]] },
  neck: { type: "band", cx: 120, cy: 78, rx: 9, ry: 3 },
  bicep: { type: "band", cx: 79, cy: 150, rx: 7, ry: 2.5 },
  sleeve_length: { type: "line", points: [[116, 96], [114, 190], [122, 254]] },
  wrist: { type: "band", cx: 71, cy: 250, rx: 6, ry: 2 },
  front_waist_length: { type: "line", points: [[110, 86], [104, 142], [104, 192]] },
  back_length: { type: "line", points: [[120, 88], [120, 192]] },
  bust_point_height: { type: "line", points: [[110, 86], [104, 142]] },
  hollow_to_hem: { type: "line", points: [[120, 88], [120, 344]] },
  waist_to_knee: { type: "line", points: [[142, 192], [142, 344]] },
};

function ticks(points: [number, number][]) {
  const end = (a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 4;
    const ny = (dx / len) * 4;
    return `M${a[0] - nx},${a[1] - ny} L${a[0] + nx},${a[1] + ny}`;
  };
  const n = points.length;
  return `${end(points[0], points[1])} ${end(points[n - 1], points[n - 2])}`;
}

/** The measured area: draws itself in, pulses twice, then rests. */
export function MeasureOverlay({ id }: { id: string }) {
  const o = OVERLAYS[id];
  if (!o) return null;
  if (o.type === "band") {
    const { cx, cy, rx, ry } = o;
    return (
      <g className="measure-pulse text-gold-ink" stroke="currentColor" fill="none">
        {/* back of the tape, behind the body */}
        <path d={`M${cx - rx},${cy} A${rx},${ry} 0 0 1 ${cx + rx},${cy}`} strokeWidth="1.25" strokeDasharray="3 3" opacity="0.8" />
        {/* front of the tape */}
        <path
          className="measure-draw"
          pathLength={1}
          d={`M${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy}`}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    );
  }
  const d = o.points.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  return (
    <g className="measure-pulse text-gold-ink" stroke="currentColor" fill="none" strokeLinecap="round">
      <path className="measure-draw" pathLength={1} d={d} strokeWidth="2" />
      <path d={ticks(o.points)} strokeWidth="1.5" className="measure-ticks" />
    </g>
  );
}

export function MeasurementIllustration({ view, measurementId, className }: { view: MeasurementView; measurementId?: string; className?: string }) {
  return (
    <svg viewBox="0 0 240 480" className={className} aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-ink/70" vectorEffect="non-scaling-stroke">
        <Figure view={view} />
      </g>
      {measurementId && <MeasureOverlay key={measurementId} id={measurementId} />}
    </svg>
  );
}
