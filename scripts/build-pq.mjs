import { build } from 'esbuild';
await build({
  entryPoints: ['scripts/pq-entry.mjs'],
  outfile: 'public/pq.bundle.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  legalComments: 'eof'
});
console.log('FREE-PQ1 browser runtime built');
