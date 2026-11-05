import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

test('serverless entry loads in plain Node ESM without a bundler or TypeScript resolver', () => {
  const root = path.resolve('tests');
  const folder = fs.mkdtempSync(path.join(root, '.esm-check-'));
  try {
    for (const source of ['api/moon-commentary.ts', 'server.ts', 'src/utils/astronomy.ts', 'src/utils/time.ts']) {
      const output = path.join(folder, source.replace(/\.ts$/, '.js'));
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, ts.transpileModule(fs.readFileSync(source, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText);
    }
    const url = pathToFileURL(path.join(folder, 'api/moon-commentary.js')).href;
    execFileSync(process.execPath, ['--input-type=module', '-e',
      `const {default:app}=await import(${JSON.stringify(url)}); if(typeof app!=='function') process.exit(1);`], {
      env: { ...process.env, NODE_ENV: 'production', VERCEL: '1' }, timeout: 15000,
    });
  } finally {
    assert.ok(path.resolve(folder).startsWith(root + path.sep));
    assert.ok(path.basename(folder).startsWith('.esm-check-'));
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
