import {readFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const folder of ['dist','lib','api','cloudflare'])for(const name of await readdir(folder)){if(!/\.(m?js)$/.test(name))continue;const result=spawnSync(process.execPath,['--check',folder+'/'+name],{encoding:'utf8'});if(result.status)throw new Error(result.stderr);}
const config=JSON.parse(await readFile('vercel.json','utf8'));if(config.outputDirectory!=='dist')throw new Error('Unexpected static directory');
console.log('All browser modules and API modules parse; Vercel configuration is valid JSON.');
