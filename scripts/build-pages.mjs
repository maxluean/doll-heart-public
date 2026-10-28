import {cp,mkdir,rm,writeFile,readFile} from 'node:fs/promises';
import {build} from 'esbuild';
await rm('.pages',{recursive:true,force:true});
await mkdir('.pages',{recursive:true});
await cp('dist','.pages',{recursive:true});
await build({entryPoints:['cloudflare/worker.mjs'],outfile:'.pages/_worker.js',bundle:true,format:'esm',platform:'browser',target:'es2022',conditions:['workerd','browser'],external:['node:*'],minify:true});
await writeFile('.pages/_routes.json',JSON.stringify({version:1,include:['/api/*'],exclude:[]},null,2)+'\n');
await writeFile('.pages/_redirects','/make /maker 200\n/g /maker 200\n/manage /maker 200\n');
const vercel=JSON.parse(await readFile('vercel.json','utf8'));
const security=vercel.headers[0].headers.map(h=>`  ${h.key}: ${h.value}`).join('\n');
// HTML and unversioned JS must revalidate together; avoid mismatched cached releases.
await writeFile('.pages/_headers',`/*\n${security}\n  Cache-Control: public, max-age=0, must-revalidate\n\n/fonts/*\n  Cache-Control: public, max-age=604800\n`);
console.log('Cloudflare Pages build ready in .pages (static assets + bundled API).');
