export interface RatioCandidate {
  a: number;
  b: number;
}

export interface RatioResult {
  originalRatio: number;
  closest: RatioCandidate;
  closestRatio: number;
  diff: number;
  quality: 'good' | 'warning' | 'bad';
  cssValue: string;
}

const STANDARD_RATIOS: RatioCandidate[] = [
  { a: 1, b: 1 },
  { a: 6, b: 5 },
  { a: 4, b: 3 },
  { a: 3, b: 2 },
  { a: 16, b: 9 },
  { a: 3, b: 4 },
  { a: 2, b: 3 },
  { a: 9, b: 16 },
];

export function getClosestRatio(width: number, height: number): RatioResult | null {
  if (width <= 0 || height <= 0) return null;

  const originalRatio = width / height;

  let best: RatioCandidate = STANDARD_RATIOS[0];
  let bestDiff = Infinity;

  for (const candidate of STANDARD_RATIOS) {
    const candidateRatio = candidate.a / candidate.b;
    const diff = Math.abs(originalRatio - candidateRatio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }

  const quality: RatioResult['quality'] =
    bestDiff < 0.03 ? 'good' : bestDiff < 0.08 ? 'warning' : 'bad';

  return {
    originalRatio,
    closest: best,
    closestRatio: best.a / best.b,
    diff: bestDiff,
    quality,
    cssValue: `${best.a} / ${best.b}`,
  };
}
