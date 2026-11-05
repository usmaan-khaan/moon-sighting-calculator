# Correction review — 5 November 2026

The earlier hand-written approximation and weighted percentage were replaced. README.md is the current method and operating guide.

## Changes

- Moved every StationSelectorModal hook before conditional return; Directory no longer changes hook order.
- Added shared modal Escape handling, keyboard focus loop, focus restoration and dialog semantics to Directory, Station Details and Add City.
- Corrected custom-station selection, active/saved count, compact header and wrapping countdown controls.
- Astronomy Engine replaces simplified Moon/Sun coordinates, fixed mean-month age and interpolated event scans. Sunset date, moonset pairing and event display use the selected station's IANA timezone.
- Removed fabricated polar-event fallbacks and observation windows extending past moonset.
- Evaluated published Odeh V at best time using airless topocentric geometry. Removed unsupported confidence percentages and conflicting category mappings.
- Replaced approximate Chinese/Hebrew calendars with Intl rules and labeled Hijri as tabular civil.
- Memoized calculations for fixed selected times. Timelapse starts at the displayed instant and advances the date through midnight.
- Replaced generated astronomical advice with server-recomputed deterministic advice. Added input validation, bounded caches, per-IP rate limits, stale-response protection and date/location/elevation/calendar cache identity.
- Protected development file routes with an exact allowlist, disabled all source/archive routes in production and excluded archives from the build.
- Removed the unused Gemini dependency and API-key requirement. Production starts without Vite middleware and respects the host PORT.

## Review boundaries

No Git repository was present, so no branch or commit was created. No live deployment was changed. Physical device/GPS, load testing, weather integration and worldwide observational calibration remain outside this correction.

Existing LIVE_TEST_REPORT.md records pre-fix live behavior. Updated local verification is recorded in FIX_VERIFICATION.md.
