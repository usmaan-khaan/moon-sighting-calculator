import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { buildSync } from 'esbuild';

test('deployed API loads the CJS server bundle in plain Node and handles a real request', () => {
  const root = path.resolve('tests');
  const folder = fs.mkdtempSync(path.join(root, '.esm-check-'));
  try {
    buildSync({ entryPoints: ['server.ts'], bundle: true, platform: 'node', format: 'cjs',
      packages: 'external', outfile: path.join(folder, '.server/server.cjs') });
    fs.mkdirSync(path.join(folder, 'api'));
    fs.copyFileSync('api/moon-commentary.js', path.join(folder, 'api/moon-commentary.js'));
    const url = pathToFileURL(path.join(folder, 'api/moon-commentary.js')).href;
    execFileSync(process.execPath, ['--input-type=module', '-e',
      `const {default:app}=await import(${JSON.stringify(url)});
       const server=app.listen(0,'127.0.0.1');
       await new Promise(resolve=>server.once('listening',resolve));
       try {
         const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/moon-commentary',{
           method:'POST',headers:{'Content-Type':'application/json'},
           body:JSON.stringify({dateStr:'2026-03-19',latitude:24.8607,longitude:67.0011})});
         if(r.status!==200)throw new Error('Production adapter returned '+r.status);
       } finally {server.closeAllConnections();server.close();}`], {
      env: { ...process.env, NODE_ENV: 'production', VERCEL: '1' }, timeout: 15000,
    });
  } finally {
    assert.ok(path.resolve(folder).startsWith(root + path.sep));
    assert.ok(path.basename(folder).startsWith('.esm-check-'));
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
