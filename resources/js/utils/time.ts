/**
 * Format a duration in seconds as `hh:mm:ss` with zero-padded parts.
 * Example: 40944 → "11:22:24". Used for session-length displays where
 * the raw float-hours representation from Carbon::diffInHours is ugly.
 */
export function formatHMS(totalSeconds: number | null | undefined): string {
    if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
        return '00:00:00';
    }
    const s = Math.floor(totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/**
 * Short, compact relative-time formatter: "just now", "5m", "2h", "3d".
 * Keeps cards readable — Carbon's diffForHumans("5 minutes ago") is too
 * wordy for a pill.
 */
export function relativeTimeShort(iso?: string | null): string | null {
    if (!iso) return null;
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return 'now';
    const sec = Math.round(ms / 1000);
    if (sec < 45) return 'just now';
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.round(hr / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.round(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    const months = Math.round(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.round(days / 365)}y ago`;
}
