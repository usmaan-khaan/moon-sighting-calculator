import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { calculateMoonDetails } from './src/utils/astronomy';
import { stationDate, stationTimeZone } from './src/utils/time';

dotenv.config();
export const app = express();
app.use(express.json({ limit: '16kb' }));
const commentaryCache = new Map<string, object>();
const requests = new Map<string, { until: number; count: number }>();

app.post('/api/moon-commentary', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Expected an observation object.' });
  const { dateStr, latitude, longitude, elevation = 0, islamicOffset = 0, locationName = 'Observer station' } = body;
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    || !Number.isFinite(latitude) || Math.abs(latitude) > 90
    || !Number.isFinite(longitude) || Math.abs(longitude) > 180
    || !Number.isFinite(elevation) || elevation < -500 || elevation > 9000
    || !Number.isInteger(islamicOffset) || Math.abs(islamicOffset) > 2
    || typeof locationName !== 'string' || locationName.length > 200) {
    return res.status(400).json({ error: 'Invalid date, station, or calendar adjustment.' });
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (year < 1900 || year > 2100 || check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return res.status(400).json({ error: 'Use a valid date between 1900 and 2100.' });
  }
  const now = Date.now();
  for (const [ip, entry] of requests) if (entry.until <= now) requests.delete(ip);
  const ip = req.ip || 'unknown';
  const entry = requests.get(ip) || { until: now + 60000, count: 0 };
  if (entry.count >= 30 || (!requests.has(ip) && requests.size >= 1000)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
  }
  entry.count++; requests.set(ip, entry);
  const key = JSON.stringify([dateStr, latitude, longitude, elevation, islamicOffset, locationName]);
  if (commentaryCache.has(key)) return res.json(commentaryCache.get(key));
  try {
    const timeZone = stationTimeZone(latitude, longitude);
    const r = calculateMoonDetails(stationDate(year, month, day, 12, 0, timeZone), { latitude, longitude, elevation, name: locationName }, islamicOffset);
    const result = {
      celestialAdvice: r.isSightedPossible + '. ' + (r.bestObservationWindow === 'No observation window'
        ? 'No evening crescent observation window is predicted for this date.'
        : 'Suggested window: ' + r.bestObservationWindow + ' (' + timeZone + '). Clear skies and an unobstructed horizon are required.'),
      historicalContext: 'Civil Hijri estimate: ' + r.hijriCalendar.day + ' ' + r.hijriCalendar.monthName + ' ' + r.hijriCalendar.year
        + ' AH. Calendar dates and visibility predictions do not establish an official religious month start.',
      isSignificanceSpecial: false,
      source: 'Calculated ephemeris and Odeh criterion',
    };
    if (commentaryCache.size >= 256) commentaryCache.delete(commentaryCache.keys().next().value!);
    commentaryCache.set(key, result);
    return res.json(result);
  } catch {
    return res.status(400).json({ error: 'Unable to calculate this observation.' });
  }
});

const allowedFiles = [
    { path: "src/utils/astronomy.ts", category: "Engine", size: "36 KB", lines: 980, desc: "Astronomy Engine ephemeris and Odeh criterion" },
    { path: "src/data/stations.ts", category: "Data", size: "14 KB", lines: 340, desc: "30+ worldwide calibrated observatory stations & coordinates" },
    { path: "src/components/MoonPhaseSvg.tsx", category: "Component", size: "8 KB", lines: 175, desc: "Dynamic SVG crescent tilt, limb angle & maria craters" },
    { path: "src/components/StationSelectorModal.tsx", category: "Component", size: "12 KB", lines: 290, desc: "Global station selector, continental tabs & GPS detection" },
    { path: "src/components/StationDetailsModal.tsx", category: "Component", size: "11 KB", lines: 260, desc: "Observatory telemetry, elevation horizon dip & optics" },
    { path: "src/components/ProjectReviewModal.tsx", category: "Component", size: "26 KB", lines: 580, desc: "In-app code review, directory explorer & offline guide" },
    { path: "src/App.tsx", category: "App", size: "72 KB", lines: 1520, desc: "Main observatory control deck, time scrubbers & logs" },
    { path: "src/main.tsx", category: "Entry", size: "1 KB", lines: 14, desc: "React root mount entrypoint" },
    { path: "src/index.css", category: "Styles", size: "4 KB", lines: 110, desc: "Tailwind CSS styles, 3D button tactile system & glow" },
    { path: "server.ts", category: "Backend", size: "12 KB", lines: 290, desc: "Express server, calculated advisory and protected file API" },
    { path: "package.json", category: "Config", size: "1 KB", lines: 36, desc: "Project dependencies, scripts & configuration" },
    { path: "PROJECT_REVIEW.md", category: "Documentation", size: "8 KB", lines: 135, desc: "Architectural specifications & calculation formulas" },
    { path: "README.md", category: "Documentation", size: "3 KB", lines: 60, desc: "Project overview, quick start and features" }
  ];
const filePaths = new Set(allowedFiles.map(file => file.path));
app.use(['/api/project', '/download-project', '/lunasync-project.zip'], (_req, res, next) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found.' });
  next();
});
app.get('/api/project/tree', (_req, res) => res.json({ success: true, files: allowedFiles }));
app.get('/api/project/file', (req, res) => {
  const requested = req.query.path;
  if (typeof requested !== 'string' || !filePaths.has(requested)) return res.status(403).json({ error: 'File is not available.' });
  const fullPath = path.join(process.cwd(), requested);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    res.json({ path: requested, name: path.basename(requested), size: Buffer.byteLength(content), lines: content.split('\n').length, content });
  } catch { res.status(404).json({ error: 'File not found.' }); }
});
app.get(['/download-project', '/lunasync-project.zip', '/api/project/download-zip'], (_req, res) => {
  res.download(path.join(process.cwd(), 'public', 'lunasync-project.zip'), 'lunasync-crescent-observatory.zip', error => {
    if (error && !res.headersSent) res.status(404).json({ error: 'Archive not available.' });
  });
});
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/assets', express.static(path.join(distPath, 'assets')));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => console.log('LunaSync server ready.'));
}
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) startServer().catch(error => { console.error('Server startup failed:', error.message); process.exitCode = 1; });
