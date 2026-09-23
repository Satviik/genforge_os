export function formatINR(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(value);
}

export function formatCompactINR(value: number): string {
  if (value >= 100_000) {
    return `₹${(value / 100_000).toFixed(1)}L`;
  }

  if (value >= 1000) {
    const compact = value / 1000;
    return `₹${compact.toFixed(compact >= 10 ? 1 : 1)}K`;
  }

  return formatINR(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatPercent(value: number): string {
  return `${value}%`;
}
