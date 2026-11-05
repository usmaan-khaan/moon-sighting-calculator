import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMoonDetails, evaluateOdeh, SightingVisibility } from '../src/utils/astronomy';
import { stationDate, zonedParts } from '../src/utils/time';
import { isObserverStation, COMMON_STATIONS } from '../src/data/stations';

const karachi = { name: 'Karachi', latitude: 24.8607, longitude: 67.0011, elevation: 0 };
const minutes = (date: Date, reference: string) => Math.abs(date.getTime() - Date.parse(reference)) / 60000;

test('USNO rise/set benchmark within two minutes at sea level', () => {
  // USNO: 2026-03-19, 52.6066 N, 2.0369 W: sunset 18:20, moonset 19:18 UTC.
  const r = calculateMoonDetails(new Date('2026-03-19T12:00:00Z'), { ...karachi, latitude: 52.6066, longitude: -2.0369 });
  assert.ok(r.sunsetDate && minutes(r.sunsetDate, '2026-03-19T18:20:00Z') < 2);
  assert.ok(r.moonsetDate && minutes(r.moonsetDate, '2026-03-19T19:18:00Z') < 2);
});

test('computed Moon age matches March 19 01:23 UTC conjunction', () => {
  const r = calculateMoonDetails(new Date('2026-03-19T12:00:00Z'), karachi);
  assert.ok(Math.abs(r.ageHours - (10 + 37 / 60)) < 2 / 60);
});

test('sunset verdict, geometry and width remain fixed when current time changes', () => {
  const early = calculateMoonDetails(new Date('2026-03-18T19:15:00Z'), karachi);
  const late = calculateMoonDetails(new Date('2026-03-19T13:00:00Z'), karachi);
  for (const key of ['odehValue', 'odehCategory', 'isSightedPossible', 'arcOfVision', 'crescentWidth', 'lagTimeMinutes', 'bestObservationWindow'] as const) {
    assert.equal(early[key], late[key], key);
  }
  assert.notEqual(early.altitude, late.altitude);
});

test('Dallas event belongs to station-local selected date', () => {
  const r = calculateMoonDetails(stationDate(2026, 3, 19, 12, 0, 'America/Chicago'), { ...karachi, latitude: 32.7767, longitude: -96.797 });
  assert.equal(zonedParts(r.sunsetDate!, r.timeZone).day, 19);
  assert.ok(r.sunsetDate!.getTime() > Date.parse('2026-03-20T00:00:00Z'));
});

test('polar day and polar night return missing events and no fabricated forecast', () => {
  for (const date of ['2026-06-21T12:00:00Z', '2026-12-21T12:00:00Z']) {
    const r = calculateMoonDetails(new Date(date), { ...karachi, latitude: 69.6492, longitude: 18.9553 });
    assert.equal(r.sunsetDate, null);
    assert.equal(r.lagTimeMinutes, null);
    assert.equal(r.odehValue, null);
    assert.equal(r.bestObservationWindow, 'No observation window');
    assert.equal(r.isSightedPossible, SightingVisibility.UNAVAILABLE);
  }
});

test('published Odeh zone boundaries', () => {
  const polynomial = 7.1651; // W = 0 gives the intercept directly.
  for (const [value, zone] of [[5.66, 'A'], [5.64, 'B'], [2.01, 'B'], [1.99, 'C'], [-0.95, 'C'], [-0.97, 'D']] as const) {
    assert.equal(evaluateOdeh(polynomial + value, 0).zone, zone);
  }
});

test('DST civil-day boundaries and non-hour station offset', () => {
  const start = stationDate(2026, 3, 8, 0, 0, 'America/Chicago');
  const end = stationDate(2026, 3, 9, 0, 0, 'America/Chicago');
  assert.equal((end.getTime() - start.getTime()) / 3600000, 23);
  assert.equal(stationDate(2026, 3, 19, 12, 0, 'Asia/Kolkata').toISOString(), '2026-03-19T06:30:00.000Z');
  assert.equal(zonedParts(stationDate(2026, 3, 8, 2, 30, 'America/Chicago'), 'America/Chicago').hour, 3);
});

test('negative lag and non-crescent phases never produce an observation window', () => {
  for (const day of ['2026-03-17', '2026-03-03']) {
    const r = calculateMoonDetails(new Date(day + 'T12:00:00Z'), karachi);
    assert.equal(r.bestObservationWindow, 'No observation window');
    assert.equal(r.odehValue, null);
  }
});

test('calendar conversions use Intl calendar rules', () => {
  const r = calculateMoonDetails(new Date('2026-11-05T12:00:00Z'), karachi);
  assert.equal(r.hebrewCalendar.year, 5787);
  assert.notEqual(r.hebrewCalendar.monthName, 'Adar II');
  assert.equal(r.chineseCalendar.year, 2026);
  assert.ok(r.phaseLongitude > 180);
});

test('invalid coordinate input is rejected', () => {
  assert.throws(() => calculateMoonDetails(new Date(), { ...karachi, latitude: 91 }), RangeError);
  assert.equal(isObserverStation(COMMON_STATIONS[0]), true);
  assert.equal(isObserverStation(null), false);
  assert.equal(isObserverStation({ ...COMMON_STATIONS[0], latitude: '24' }), false);
  assert.equal(isObserverStation({ ...COMMON_STATIONS[0], observatory: 1 }), false);
});
