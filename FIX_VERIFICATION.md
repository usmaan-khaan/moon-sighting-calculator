# Fix verification — 5 November 2026

Application fixes are in the local project folder. The published ai.studio deployment was not modified.

## Automated checks

- `npm run lint`: passed (TypeScript).
- `npm test`: 11 tests passed, zero failed.
- `npm run build`: passed; client code split into application, astronomy and timezone chunks, with no size warning.
- `npm start`: production server started on the host-provided PORT (tested on 3002).
- Production smoke assertions: source-file/tree/archive endpoints return 404; the server bundle is not exposed as a static file; calculated advisory returns 200.

## Browser checks

Tested development and production builds in the in-app Chromium browser.

| Case | Result |
| --- | --- |
| Directory opens after a closed render | Pass; no hook-order crash |
| Directory and Details Escape close | Pass |
| Details keyboard focus loop | Pass; Shift+Tab stays inside modal |
| City search and selection | Pass; selected option matches active custom station |
| Saved custom count | Pass; one active saved station counts once |
| Invalid latitude 91 | Pass; rejected |
| Karachi March 19 slider minimum/maximum | Pass; Odeh V stays -0.68, Zone C |
| Tromso June 21 | Pass; N/A sunset, unavailable criterion, no fabricated window |
| 320 px phone viewport | Pass; measured document width 314 px, including telescope view |
| 390 px phone viewport | Pass; measured document width 385 px |
| 768 px tablet viewport | Pass; measured document width 762 px |
| Production browser console | No errors or warnings captured during tested flows |

Native date-field `setValue` was used to verify the polar-day date; Playwright fill did not commit that native control reliably in this browser automation surface. Viewport overrides were reset after testing.

## Astronomical benchmark

USNO sample: 19 March 2026, latitude 52.6066 N, longitude 2.0369 W, sea level.

| Event | USNO reference | Corrected result | Difference |
| --- | --- | --- | --- |
| Sunset | 18:20 UTC | 18:19:31 UTC | -29 seconds |
| Moonset | 19:18 UTC | 19:17:54 UTC | -6 seconds |
| New-moon conjunction | March 19 01:23 UTC | March 19 01:24:06 UTC | +66 seconds |

Reference times are rounded to minutes. This is a sample validation, not a worldwide accuracy guarantee. Raw corrected values are in `FIX_BENCHMARKS.json`.

- [USNO benchmark](https://aa.usno.navy.mil/calculated/rstt/oneday?date=2026-03-19&dst=false&label=New+Invention&lat=52.6066&lon=-2.0369&submit=Get+Data&tz=0.00&tz_label=false&tz_sign=1)
- [Griffith Observatory phase reference](https://griffithobservatory.lacity.gov/explore/observing-the-sky/whats-in-the-sky/the-moon/2026-phases-of-the-moon/)
- [Odeh original paper, equation 2 and best time](https://astronomycenter.net/pdf/2006_cri.pdf)

## Evidence and limits

- `fixed-mobile.png`: corrected compact mobile header/countdown.
- `fixed-forecast.png`: corrected station-local forecast and Odeh value.
- `LIVE_TEST_REPORT.md`: pre-fix deployed-site baseline, retained as historical evidence.

Not checked: physical iOS/Android or GPS hardware, load testing, local terrain/weather and independent worldwide observational calibration. Disk orientation is explicitly illustrative. Civil calendars are not official religious announcements. The in-memory limiter/cache is per process. No live deployment, domain change or Git commit was performed.

Compression monitoring note: the skill's configured monitoring directory is outside writable workspace roots, so no external monitoring record was written; no measured token-saving claim is made.
