# Live browser verification

Tested 2026-11-05: https://moon-sighting-calculator.ai.studio/
Scope: in-app Chromium browser; responsive viewport simulation, not physical phones.
No application source changes or deployment performed.

## Confirmed failures

1. **P1 Directory crash:** Opening Directory blanks the entire page. Console records minified React error #310, with useMemo in the stack. This matches the locally reproduced hook-order failure.
2. **P1 inconsistent sunset verdict:** Select Karachi through Add City, choose March 19, 2026. Sunset mode shows 0% confidence and Impossible, sunset altitude 6.0 degrees, lag 30 minutes. Move the hour slider to minimum using Home: time becomes 12:15 AM, confidence becomes 72%, and verdict becomes Challenging. Sunset altitude and lag remain unchanged. Snap to Sunset restores 0%. The sunset forecast is mixing selected-time and sunset inputs.
3. **P2 phone overflow:** At 390 x 844 the root scroll width is 401 pixels; screenshot shows clipped header/countdown. At 320 x 740 scroll width is 402 pixels. At 768 x 1024 measured scroll width is 762 pixels, with no horizontal document overflow by this check.
4. **P2 keyboard dismissal:** Station Details opens, but pressing Escape on its Close button does not dismiss it. Clicking Close works.
5. **P2 selection state:** Applying Karachi from the city search updates station details, but the station dropdown displays the Add City placeholder rather than the applied station. Custom & GPS count displays 2 after adding one active saved preset.
6. **P2 impossible observation window:** Initial Mecca state says the Moon sets before the Sun but still offers a best observation window after sunset.

## Passed interactions

- Live page loads.
- Add City modal opens on a 390-pixel viewport; searching Karachi returns one result; Select applies its coordinates and 8 m elevation.
- March 19 benchmark button changes date.
- Next Day changes March 19 to March 20; Prev Day returns to March 19.
- Hour slider and Snap to Sunset respond, subject to the forecast bug above.
- Today resets the input to November 5, 2026 when checked after rendering.
- Live Now changes displayed time to current time.
- Telescope view renders an illuminated Moon; Evening Sky switches back.
- Station Details opens and closes by button.
- Manual latitude 91 is rejected with the expected range message; invalid station is not applied.

## Earlier local/reference checks

- npm run lint and npm run build passed after dependencies were installed. These are local checks, not proof of the deployed build's quality.
- Local sea-level benchmark, latitude 52.6066, longitude -2.0369, March 19, 2026: sunset 18:21:28 UTC and moonset 19:25:40 UTC. USNO reports 18:20 and 19:18 respectively (reference rounded to minutes). Approximate differences: +1m28s, +7m40s; lag error +6m12s.
- Local mean-month conjunction estimate: March 18, 2026 16:05:56 UTC. USNO/observatory reference: March 19 01:23 UTC. Difference approximately 9h17m. This is not exact Moon age.
- Local Dallas date selection can return the preceding station-local evening. Polar-day test fabricates a sunset through the fallback.
- Code's weighted percentage and category mapping are not the published Odeh formula. No calibrated probability or global accuracy certification established.

References:
- https://aa.usno.navy.mil/calculated/rstt/oneday?date=2026-03-19&dst=false&label=New+Invention&lat=52.6066&lon=-2.0369&submit=Get+Data&tz=0.00&tz_label=false&tz_sign=1
- https://griffithobservatory.lacity.gov/explore/observing-the-sky/whats-in-the-sky/the-moon/2026-phases-of-the-moon/
- https://astronomycenter.net/pdf/2006_cri.pdf

## Evidence

- live-directory-crash.png
- live-mobile-390.png
- live-mobile-320.png
- live-desktop-tested.png

## Limits

No physical iOS/Android, GPS permission grant, load test, exhaustive accessibility audit, live secret-file probing, paid AI quality validation, or global ephemeris validation. No claim that untested features pass. Public launch remains blocked by the confirmed crash and inconsistent calculations.
