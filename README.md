# LunaSync — Crescent Visibility Calculator

A station-based Sun/Moon ephemeris and evening-crescent planning tool.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. No AI API key is required. Optional PORT environment variable selects another port.

## Verify and serve production

```sh
npm run lint
npm test
npm run build
npm start
```

The start command sets production mode. Hosting platforms can supply PORT. Build output includes the Express server; deploy the application and its production dependencies, not only static HTML, to retain the advisory endpoint. No deployment is performed by the checks.

## Calculation method

- Astronomy Engine computes topocentric positions, rise/set events, illumination, and actual new-moon conjunctions. Events use standard refraction and a level local horizon; observer elevation affects the topocentric position and atmospheric model. Sea-horizon dip estimates are displayed separately and are not treated as guaranteed extra lunar lag.
- Coordinates resolve to an IANA timezone with tz-lookup. Civil observation dates, DST boundaries, and event labels use that station timezone. The current-time slider changes the visual sky; the evening visibility forecast uses fixed geometry for the selected station-local date.
- Odeh (published 2006) equation 2 is evaluated at sunset plus 4/9 of the Moon-set lag. Inputs are airless topocentric arc of vision and crescent width in arcminutes. Zone A: V >= 5.65; B: 2 <= V < 5.65; C: -0.96 <= V < 2; D: V < -0.96. The displayed value is a criterion, not a statistical probability. Waning/full/quarter phases and missing sunset/moonset events do not receive a young-crescent forecast.
- Suggested observation windows are five minutes either side of the model's best time, bounded by sunset and moonset. Zone D has no recommended window.
- Chinese and Hebrew conversions use platform Intl calendar rules. Hijri uses the tabular civil calendar with the existing manual adjustment. These dates and model forecasts do not establish official religious month starts. Calendars use the station civil date; sunset-based religious day rollover is not inferred.

Model results assume a clear, unobstructed horizon. Local weather, terrain, aerosols, eyesight and optical equipment affect actual visibility. Coordinate-based timezone borders are approximate: confirm the timezone shown for sites close to a political boundary.

## Security and data

- Observation logs and saved stations remain in browser localStorage. Invalid stored shapes are ignored; storage errors do not imply a record was persisted.
- Advisory requests validate dates/coordinates/elevation/adjustment and recompute the forecast server-side. Advice is deterministic, bounded by a 256-entry cache and 30 valid requests per minute per connection IP. Rate limits are per server process; multi-instance hosting requires a shared limiter if stronger abuse protection is needed.
- Project file access enforces an exact allowlist and is disabled in production. Project archives are excluded from production assets. Express serves only built assets and the HTML shell; server bundles/source maps are not static downloads.

## Verification evidence

Regression tests cover the USNO sea-level benchmark (52.6066 N, 2.0369 W, 19 March 2026), conjunction age, stable sunset verdict across slider times, Dallas civil-date selection, polar day/night, DST, published Odeh boundaries, calendar year conversion, input rejection, cache invalidation, rate limiting and file protection.

References:
- https://github.com/cosinekitty/astronomy/tree/master/source/js
- https://www.npmjs.com/package/tz-lookup
- https://astronomycenter.net/pdf/2006_cri.pdf
- https://aa.usno.navy.mil/calculated/rstt/oneday?date=2026-03-19&dst=false&label=New+Invention&lat=52.6066&lon=-2.0369&submit=Get+Data&tz=0.00&tz_label=false&tz_sign=1
- https://griffithobservatory.lacity.gov/explore/observing-the-sky/whats-in-the-sky/the-moon/2026-phases-of-the-moon/

See PROJECT_REVIEW.md for the correction summary and LIVE_TEST_REPORT.md for the pre-fix deployed-site baseline.

## Vercel hosting

Import this GitHub repository in Vercel. The committed vercel.json selects Vite and builds only the web assets; api/moon-commentary.ts serves the existing validated Express advisory as a serverless function. No API key or environment secrets are required. The standalone npm start deployment continues to work.
