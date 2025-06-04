const DURATION_REGEX = /PT(?:(?<H>\d+)H)?(?:(?<M>\d+)M)?(?:(?<S>\d+)S)?/;
export function formatDuration(duration: string): string {
  const match = duration.match(DURATION_REGEX);
  const { H = "0", M = "0", S = "0" } = (match?.groups as { H?: string; M?: string; S?: string }) || {};
  const hours = Number(H);
  const minutes = String(M).padStart(hours > 0 ? 2 : 1, "0");
  const seconds = String(S).padStart(2, "0");
  return [hours > 0 ? hours : null, minutes, seconds].filter(Boolean).join(":");
}
export default formatDuration;
