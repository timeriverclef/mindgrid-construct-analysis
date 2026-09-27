import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  Element,
  Construct,
  Ratings,
  AnalysisSettings,
  IDilemma,
} from "../types";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const generateId = () => crypto.randomUUID();
export const localDateStamp = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
export const DEFAULT_SETTINGS: AnalysisSettings = {
  congruent: 1,
  discrepant: 3,
  correlation: 0.35,
  excludeSelf: false,
};
export const isScore = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 7;
export const mean = (a: number[]) =>
  a.length ? a.reduce((s, n) => s + n, 0) / a.length : null;
export function pearsonCorrelation(x: number[], y: number[]): number | null {
  if (
    x.length !== y.length ||
    x.length < 3 ||
    [...x, ...y].some((v) => !Number.isFinite(v))
  )
    return null;
  const mx = mean(x)!,
    my = mean(y)!;
  let numerator = 0,
    xx = 0,
    yy = 0;
  x.forEach((v, i) => {
    const a = v - mx,
      b = y[i] - my;
    numerator += a * b;
    xx += a * a;
    yy += b * b;
  });
  return xx === 0 || yy === 0
    ? null
    : Math.max(-1, Math.min(1, numerator / Math.sqrt(xx * yy)));
}
export function analyzeGrid(
  elements: Element[],
  constructs: Construct[],
  ratings: Ratings,
  settings = DEFAULT_SETTINGS,
) {
  const self = elements.find((e) => e.role === "self")?.id,
    ideal = elements.find((e) => e.role === "ideal")?.id;
  const differenceConstructs: string[] = [],
    consistentConstructs: string[] = [],
    undifferentiated: string[] = [];
  const realScores: number[] = [],
    idealScores: number[] = [],
    distances: number[] = [],
    otherDistances: number[] = [];
  let valid = 0,
    extremes = 0;
  constructs.forEach((c) => {
    const a = self ? ratings[c.id]?.[self] : undefined,
      b = ideal ? ratings[c.id]?.[ideal] : undefined;
    if (isScore(a) && isScore(b)) {
      realScores.push(a);
      idealScores.push(b);
      distances.push(Math.abs(a - b));
      if (b === 4) undifferentiated.push(c.id);
      else if (Math.abs(a - b) >= settings.discrepant)
        differenceConstructs.push(c.id);
      else if (Math.abs(a - b) <= settings.congruent)
        consistentConstructs.push(c.id);
      else undifferentiated.push(c.id);
    } else undifferentiated.push(c.id);
    elements.forEach((e) => {
      const v = ratings[c.id]?.[e.id];
      if (isScore(v)) {
        valid++;
        if (v === 1 || v === 7) extremes++;
      }
      if (e.role === "other" && isScore(v) && isScore(a))
        otherDistances.push(Math.abs(v - a));
    });
  });
  const dilemmas: IDilemma[] = [];
  let unavailablePairs = 0,
    testedPairs = 0;
  const eligible = elements.filter(
    (e) => !settings.excludeSelf || e.role === "other",
  );
  differenceConstructs.forEach((dc) =>
    consistentConstructs.forEach((cc) => {
      const pairs = eligible
        .map((e) => [ratings[dc]?.[e.id], ratings[cc]?.[e.id]])
        .filter((p) => p.every(isScore)) as number[][];
      const r = pearsonCorrelation(
        pairs.map((p) => p[0]),
        pairs.map((p) => p[1]),
      );
      if (r === null) {
        unavailablePairs++;
        return;
      }
      testedPairs++;
      const direction = Math.sign(
        (ratings[dc][ideal!] as number) - (ratings[dc][self!] as number),
      );
      const preferred = Math.sign((ratings[cc][ideal!] as number) - 4);
      if (Math.abs(r) >= settings.correlation && r * direction * preferred < 0)
        dilemmas.push({
          differenceConstructId: dc,
          consistentConstructId: cc,
          correlation: r,
          n: pairs.length,
        });
    }),
  );
  return {
    differenceConstructs,
    consistentConstructs,
    undifferentiated,
    dilemmas,
    valid,
    total: elements.length * constructs.length,
    polarizationRatio: valid ? extremes / valid : null,
    selfEsteemCorrelation: pearsonCorrelation(realScores, idealScores),
    selfDistance: mean(distances),
    selfPairs: distances.length,
    perceivedSocialDistance: mean(otherDistances),
    socialPairs: otherDistances.length,
    testedPairs,
    unavailablePairs,
  };
}
