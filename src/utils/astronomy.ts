import { Body, Observer, Equator, Horizon, Illumination, MoonPhase, SearchMoonPhase, SearchRiseSet, SunPosition, KM_PER_AU } from 'astronomy-engine';
import { stationTimeZone, stationDate, zonedParts, formatTime } from './time.js';

export interface ObserverLocation {
  latitude: number;
  longitude: number;
  elevation: number;
  name: string;
}

export enum SightingVisibility {
  IMPOSSIBLE = 'Not visible by Odeh criterion',
  AIDED_ONLY = 'Optical aid required',
  EASY = 'Visible to naked eye under suitable conditions',
  CHALLENGING = 'Optical aid; naked eye may be possible',
  SET_BEFORE_SUN = 'Moon sets before sunset',
  UNAVAILABLE = 'No sunset or moonset for this observation window',
  NOT_CRESCENT = 'Outside the young evening crescent phase',
}

export interface MoonCalculationResult {
  julianDate: number;
  phaseAngle: number;
  phaseLongitude: number;
  elongation: number;
  illumination: number;
  phaseName: string;
  ageDays: number;
  ageHours: number;
  distanceKm: number;
  altitude: number;
  azimuth: number;
  altitudeAtSunset: number | null;
  arcOfVision: number | null;
  daz: number | null;
  odehValue: number | null;
  odehCategory: string;
  bestObservationWindow: string;
  nextNewMoonDate: string;
  nextNewMoonTimestamp: number;
  riseTime: string | null;
  setTime: string | null;
  sunsetTime: string | null;
  sunsetDate: Date | null;
  moonsetTime: string | null;
  moonsetDate: Date | null;
  lagTimeMinutes: number | null;
  crescentWidth: number | null;
  isSightedPossible: SightingVisibility;
  timeZone: string;
  hijriCalendar: { day: number; monthName: string; month: number; year: number };
  chineseCalendar: { day: number; month: string; year: number; animal: string; term: string };
  hebrewCalendar: { day: number; monthName: string; year: number };
}

const DAY = 86400000;
const RAD = Math.PI / 180;
export const getJulianDate = (date: Date) => date.getTime() / DAY + 2440587.5;
export const jdToDate = (jd: number) => new Date((jd - 2440587.5) * DAY);

function position(body: Body, date: Date, observer: Observer, refract = true) {
  const eq = Equator(body, date, observer, true, true);
  return { ...Horizon(date, observer, eq.ra, eq.dec, refract ? 'normal' : undefined), ...eq };
}

function separation(a: ReturnType<typeof position>, b: ReturnType<typeof position>) {
  const cosine = Math.sin(a.dec * RAD) * Math.sin(b.dec * RAD)
    + Math.cos(a.dec * RAD) * Math.cos(b.dec * RAD) * Math.cos((a.ra - b.ra) * 15 * RAD);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) / RAD;
}

export function evaluateOdeh(arcOfVision: number, width: number) {
  // Odeh (2006), equation 2: airless topocentric values at sunset + 4/9 lag.
  const value = arcOfVision - (7.1651 - 6.3226 * width + 0.7319 * width ** 2 - 0.1018 * width ** 3);
  const zone = value >= 5.65 ? 'A' : value >= 2 ? 'B' : value >= -0.96 ? 'C' : 'D';
  const status = { A: SightingVisibility.EASY, B: SightingVisibility.CHALLENGING,
    C: SightingVisibility.AIDED_ONLY, D: SightingVisibility.IMPOSSIBLE }[zone];
  return { value, zone, status };
}

function phaseName(phase: number) {
  if (phase < 10 || phase > 350) return 'New Moon';
  if (phase < 80) return 'Waxing Crescent';
  if (phase < 100) return 'First Quarter';
  if (phase < 170) return 'Waxing Gibbous';
  if (phase < 190) return 'Full Moon';
  if (phase < 260) return 'Waning Gibbous';
  if (phase < 280) return 'Third Quarter';
  return 'Waning Crescent';
}

function calendarParts(date: Date, calendar: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat(`en-US-u-ca-${calendar}`, {
    timeZone, day: 'numeric', month: 'long', year: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  return { day: Number(get('day')), monthName: get('month'), year: Number(get('year') || get('relatedYear')) };
}

export function calculateMoonDetails(date: Date, loc: ObserverLocation, islamicOffset = 0): MoonCalculationResult {
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(loc.latitude) || Math.abs(loc.latitude) > 90
    || !Number.isFinite(loc.longitude) || Math.abs(loc.longitude) > 180
    || !Number.isFinite(loc.elevation) || loc.elevation < -500 || loc.elevation > 9000) {
    throw new RangeError('Invalid observation date or station coordinates/elevation.');
  }
  const timeZone = stationTimeZone(loc.latitude, loc.longitude);
  const civil = zonedParts(date, timeZone);
  const start = stationDate(civil.year, civil.month, civil.day, 0, 0, timeZone);
  const end = stationDate(civil.year, civil.month, civil.day + 1, 0, 0, timeZone);
  const observer = new Observer(loc.latitude, loc.longitude, loc.elevation);
  const sunsetEvent = SearchRiseSet(Body.Sun, observer, -1, start, (end.getTime() - start.getTime()) / DAY);
  const sunsetDate = sunsetEvent && sunsetEvent.date < end ? sunsetEvent.date : null;
  const nowMoon = position(Body.Moon, date, observer);
  const sun = position(Body.Sun, date, observer);
  const illum = Illumination(Body.Moon, date);
  const phase = MoonPhase(date);
  const previousNewMoon = SearchMoonPhase(0, date, -40)!.date;
  const nextNewMoon = SearchMoonPhase(0, new Date(date.getTime() + 1000), 40)!.date;
  const ageDays = (date.getTime() - previousNewMoon.getTime()) / DAY;
  let moonsetDate: Date | null = null;
  let altitudeAtSunset: number | null = null;
  let lag: number | null = null;
  let arcOfVision: number | null = null;
  let daz: number | null = null;
  let width: number | null = null;
  let odehValue: number | null = null;
  let status = SightingVisibility.UNAVAILABLE;
  let category = 'Unavailable: no sunset or nearby moonset';
  let bestObservationWindow = 'No observation window';
  if (sunsetDate) {
    const moon = position(Body.Moon, sunsetDate, observer);
    altitudeAtSunset = moon.altitude;
    const nextSet = SearchRiseSet(Body.Moon, observer, -1, sunsetDate, 1)?.date ?? null;
    const nextRise = SearchRiseSet(Body.Moon, observer, 1, sunsetDate, 1)?.date ?? null;
    const isAbove = nextSet && (!nextRise || nextSet < nextRise);
    moonsetDate = isAbove ? nextSet : SearchRiseSet(Body.Moon, observer, -1, sunsetDate, -1)?.date ?? null;
    if (moonsetDate) {
      lag = (moonsetDate.getTime() - sunsetDate.getTime()) / 60000;
      if (lag <= 0) {
        status = SightingVisibility.SET_BEFORE_SUN;
        category = 'Not applicable: Moon sets before sunset';
      } else if (MoonPhase(sunsetDate) >= 90) {
        status = SightingVisibility.NOT_CRESCENT;
        category = 'Not applicable: this is not a young evening crescent';
      } else {
        const best = new Date(sunsetDate.getTime() + lag * 60000 * 4 / 9);
        const bestMoon = position(Body.Moon, best, observer, false);
        const bestSun = position(Body.Sun, best, observer, false);
        arcOfVision = bestMoon.altitude - bestSun.altitude;
        const diff = Math.abs(bestMoon.azimuth - bestSun.azimuth);
        daz = Math.min(diff, 360 - diff);
        const elongation = separation(bestMoon, bestSun);
        width = Math.asin(1737.4 / (bestMoon.dist * KM_PER_AU)) / RAD * 60 * (1 - Math.cos(elongation * RAD));
        const odeh = evaluateOdeh(arcOfVision, width);
        odehValue = odeh.value;
        status = odeh.status;
        category = `Odeh Zone ${odeh.zone}: ${status}`;
        if (status !== SightingVisibility.IMPOSSIBLE) {
          const from = new Date(Math.max(sunsetDate.getTime(), best.getTime() - 5 * 60000));
          const to = new Date(Math.min(moonsetDate.getTime(), best.getTime() + 5 * 60000));
          bestObservationWindow = `${formatTime(from, timeZone)} – ${formatTime(to, timeZone)}`;
        }
      }
    }
  }
  const adjusted = new Date(date.getTime() + islamicOffset * DAY);
  const hijri = calendarParts(adjusted, 'islamic-civil', timeZone);
  const hijriNumeric = new Intl.DateTimeFormat('en-US-u-ca-islamic-civil', { timeZone, month: 'numeric' }).format(adjusted);
  const chinese = calendarParts(date, 'chinese', timeZone);
  const chineseMonth = new Intl.DateTimeFormat('en-US-u-ca-chinese', { timeZone, month: 'numeric' }).format(date);
  const animals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  const terms = ['Chunfen', 'Qingming', 'Guyu', 'Lixia', 'Xiaoman', 'Mangzhong', 'Xiazhi', 'Xiaoshu', 'Dashu', 'Liqiu', 'Chushu', 'Bailu', 'Qiufen', 'Hanlu', 'Shuangjiang', 'Lidong', 'Xiaoxue', 'Daxue', 'Dongzhi', 'Xiaohan', 'Dahan', 'Lichun', 'Yushui', 'Jingzhe'];
  const rise = SearchRiseSet(Body.Moon, observer, 1, start, (end.getTime() - start.getTime()) / DAY)?.date ?? null;
  return {
    julianDate: getJulianDate(date), phaseAngle: illum.phase_angle, phaseLongitude: phase, elongation: separation(nowMoon, sun),
    illumination: illum.phase_fraction, phaseName: phaseName(phase), ageDays, ageHours: ageDays * 24,
    distanceKm: illum.geo_dist * KM_PER_AU, altitude: nowMoon.altitude, azimuth: nowMoon.azimuth,
    altitudeAtSunset, arcOfVision, daz, odehValue, odehCategory: category, bestObservationWindow,
    nextNewMoonTimestamp: nextNewMoon.getTime(),
    nextNewMoonDate: nextNewMoon.toLocaleDateString('en-US', { timeZone, month: 'short', day: 'numeric', year: 'numeric' }),
    sunsetDate, moonsetDate, lagTimeMinutes: lag,
    sunsetTime: sunsetDate ? formatTime(sunsetDate, timeZone) : null,
    moonsetTime: moonsetDate ? formatTime(moonsetDate, timeZone) : null,
    riseTime: rise && rise < end ? formatTime(rise, timeZone) : null,
    setTime: moonsetDate ? formatTime(moonsetDate, timeZone) : null,
    crescentWidth: width, isSightedPossible: status, timeZone,
    hijriCalendar: { ...hijri, month: Number(hijriNumeric) },
    chineseCalendar: { day: chinese.day, month: chineseMonth, year: chinese.year,
      animal: animals[((chinese.year - 4) % 12 + 12) % 12], term: terms[Math.floor(SunPosition(date).elon / 15) % 24] },
    hebrewCalendar: calendarParts(date, 'hebrew', timeZone),
  };
}

/**
 * Formats a decimal degree coordinate into Degrees, Minutes, Seconds (DMS) string
 */
export function decimalToDMS(deg: number, isLatitude: boolean): string {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

  let direction = "";
  if (isLatitude) {
    direction = deg >= 0 ? "N" : "S";
  } else {
    direction = deg >= 0 ? "E" : "W";
  }

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

export interface StationTelemetry {
  elevationMeters: number;
  elevationFt: number;
  dipDegrees: number;
  dipArcMin: number;
  horizonDistanceKm: number;
  horizonDistanceMiles: number;
  solarOffsetStr: string;
  extraSightingMinutes: number;
  dmsLat: string;
  dmsLng: string;
}

/**
 * Calculates geometric and astronomical telemetry for an observer station
 */
export function getStationTelemetry(loc: ObserverLocation): StationTelemetry {
  const elevation = Math.max(0, loc.elevation || 0);
  // Horizon dip angle d in degrees: ~ 0.0293 * sqrt(h)
  const dipDegrees = 0.0293 * Math.sqrt(elevation);
  const dipArcMin = dipDegrees * 60;

  // Horizon distance in km: ~ 3.57 * sqrt(h)
  const horizonDistanceKm = 3.57 * Math.sqrt(elevation);
  const horizonDistanceMiles = horizonDistanceKm * 0.621371;

  // Elevation in feet
  const elevationFt = Math.round(elevation * 3.28084);

  // Solar noon offset relative to UTC (each degree of longitude = 4 minutes of solar time)
  const solarTimeDiffMinutes = loc.longitude * 4;
  const offsetHours = Math.floor(Math.abs(solarTimeDiffMinutes) / 60);
  const offsetMins = Math.floor(Math.abs(solarTimeDiffMinutes) % 60);
  const offsetSign = solarTimeDiffMinutes >= 0 ? "+" : "-";
  const solarOffsetStr = `UTC ${offsetSign}${offsetHours}h ${String(offsetMins).padStart(2, "0")}m`;

  // Extra sighting minutes gained from horizon dip (approx 1 min per 0.25 deg of dip near the equator/mid latitudes)
  const extraSightingMinutes = Number((dipDegrees * 4).toFixed(1));

  return {
    elevationMeters: elevation,
    elevationFt,
    dipDegrees: Number(dipDegrees.toFixed(3)),
    dipArcMin: Number(dipArcMin.toFixed(1)),
    horizonDistanceKm: Number(horizonDistanceKm.toFixed(1)),
    horizonDistanceMiles: Number(horizonDistanceMiles.toFixed(1)),
    solarOffsetStr,
    extraSightingMinutes,
    dmsLat: decimalToDMS(loc.latitude, true),
    dmsLng: decimalToDMS(loc.longitude, false)
  };
}
