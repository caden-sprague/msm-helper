/**
 * Minimal ISO 8601 duration support — only the subset the dataset uses (PnDTnHnMnS).
 * Not worth a dependency.
 */
const PATTERN = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

export function parseDurationSeconds(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const match = PATTERN.exec(iso);
  if (!match) return undefined;
  const [, d, h, m, s] = match;
  return (
    Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0)
  );
}

export function formatDuration(iso: string | undefined): string {
  const total = parseDurationSeconds(iso);
  if (total === undefined) return '—';
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);
  return parts.join(' ') || '0s';
}
