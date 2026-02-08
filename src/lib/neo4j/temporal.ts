// Temporal query helpers for copy-on-write versioning

export function currentPredicate(alias: string = "n"): string {
  return `${alias}.valid_to IS NULL`;
}

export function asOfPredicate(alias: string = "n", paramName: string = "asOf"): string {
  return `${alias}.valid_from <= $${paramName} AND (${alias}.valid_to IS NULL OR ${alias}.valid_to > $${paramName})`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
