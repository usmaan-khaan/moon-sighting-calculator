import tzLookup from 'tz-lookup';

export function stationTimeZone(latitude: number, longitude: number): string {
  return tzLookup(latitude, longitude);
}

export function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const value = (name: string) => Number(parts.find(p => p.type === name)?.value);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute'), second: value('second') };
}

// Convert a station's civil time to an instant, including its historical DST offset.
export function stationDate(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let instant = target;
  let previous = target;
  for (let i = 0; i < 4; i++) {
    const p = zonedParts(new Date(instant), timeZone);
    const delta = target - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    if (delta === 0) return new Date(instant);
    previous = instant;
    instant += delta;
  }
  // A missing DST hour is normalized forward to the first corresponding valid time.
  return new Date(Math.max(previous, instant));
}

export function formatTime(date: Date | null, timeZone: string): string {
  return date ? date.toLocaleTimeString('en-US', { timeZone, hour: '2-digit', minute: '2-digit' }) : 'N/A';
}

export function formatMetric(value: number | null, digits = 1): string {
  return value === null ? 'N/A' : value.toFixed(digits);
}
