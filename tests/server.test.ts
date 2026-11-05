import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

test('API validates input, protects files, and recalculates advice', async () => {
  process.env.NODE_ENV = 'test';
  const { app } = await import('../server');
  const { default: serverlessApp } = await import('../api/moon-commentary');
  assert.equal(serverlessApp, app);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  try {
    for (const file of ['.env', '../package.json', 'node_modules/express/package.json']) {
      assert.equal((await fetch(`${base}/api/project/file?path=${encodeURIComponent(file)}`)).status, 403);
    }
    assert.equal((await fetch(`${base}/api/project/file?path=package.json`)).status, 200);
    const post = (body: object) => fetch(`${base}/api/moon-commentary`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const observation = { dateStr: '2026-03-19', latitude: 24.8607, longitude: 67.0011, elevation: 0 };
    assert.equal((await post({ ...observation, latitude: '24.8' })).status, 400);
    assert.equal((await post({ ...observation, dateStr: '2026-02-30' })).status, 400);
    const result = await post(observation);
    assert.equal(result.status, 200);
    const body = await result.json();
    assert.equal(typeof body.celestialAdvice, 'string');
    assert.match(body.historicalContext, /Civil Hijri estimate/);
    const changed = await (await post({ ...observation, islamicOffset: 1 })).json();
    assert.notEqual(body.historicalContext, changed.historicalContext);
    for (let i = 0; i < 28; i++) await post(observation);
    assert.equal((await post(observation)).status, 429);
    process.env.NODE_ENV = 'production';
    assert.equal((await fetch(`${base}/api/project/file?path=package.json`)).status, 404);
    assert.equal((await fetch(`${base}/lunasync-project.zip`)).status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
