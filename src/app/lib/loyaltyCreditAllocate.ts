/** کف به مضارب ۱۰۰۰ تومان */
export function floorToThousand(amount: number): number {
  const n = Math.max(0, Number(amount) || 0);
  if (n < 1000) return 0;
  return Math.floor(n / 1000) * 1000;
}

/** نزدیک‌ترین مضارب ۱۰۰۰ تومان */
export function roundToThousand(amount: number): number {
  const n = Math.max(0, Number(amount) || 0);
  if (n <= 0) return 0;
  return Math.round(n / 1000) * 1000;
}

/**
 * تقسیم اعتبار بین اقلام فقط با مضارب ۱۰۰۰؛ باقیمانده در حساب مشتری می‌ماند.
 */
export function allocateLoyaltyCreditByThousands(
  lineTotals: number[],
  creditAvailable: number,
): { shares: number[]; used: number } {
  const weights = lineTotals.map((v) => Math.max(0, Math.round(Number(v) || 0)));
  const shares = weights.map(() => 0);
  const total = weights.reduce((s, w) => s + w, 0);
  const budget = floorToThousand(Math.min(Math.max(0, creditAvailable), total));
  if (budget < 1000 || total <= 0) {
    return { shares, used: 0 };
  }

  const raw = weights.map((w) => (budget * w) / total);
  for (let i = 0; i < weights.length; i++) {
    const cap = floorToThousand(weights[i]);
    shares[i] = Math.min(cap, roundToThousand(raw[i]));
  }

  let sum = shares.reduce((s, v) => s + v, 0);

  const pickReduce = (): number => {
    let best = -1;
    let bestWeight = -1;
    let bestOvershoot = -Infinity;
    for (let i = 0; i < shares.length; i++) {
      if (shares[i] < 1000) continue;
      const overshoot = shares[i] - raw[i];
      const weight = weights[i];
      if (
        best < 0 ||
        weight > bestWeight + 0.01 ||
        (Math.abs(weight - bestWeight) < 0.01 && overshoot > bestOvershoot)
      ) {
        best = i;
        bestWeight = weight;
        bestOvershoot = overshoot;
      }
    }
    return best;
  };

  const pickIncrease = (): number => {
    let best = -1;
    let bestWeight = -1;
    let bestUnder = -Infinity;
    for (let i = 0; i < weights.length; i++) {
      const cap = floorToThousand(weights[i]);
      if (shares[i] + 1000 > cap + 0.01) continue;
      const under = raw[i] - shares[i];
      const weight = weights[i];
      if (
        best < 0 ||
        weight > bestWeight + 0.01 ||
        (Math.abs(weight - bestWeight) < 0.01 && under > bestUnder)
      ) {
        best = i;
        bestWeight = weight;
        bestUnder = under;
      }
    }
    return best;
  };

  while (sum > budget + 0.01) {
    const idx = pickReduce();
    if (idx < 0) break;
    shares[idx] -= 1000;
    sum -= 1000;
  }

  while (sum + 1000 <= budget + 0.01) {
    const idx = pickIncrease();
    if (idx < 0) break;
    shares[idx] += 1000;
    sum += 1000;
  }

  return { shares, used: shares.reduce((s, v) => s + v, 0) };
}
