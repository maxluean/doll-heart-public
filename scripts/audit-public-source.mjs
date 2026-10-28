/** Local publication check. Reports locations/categories, never matched values. */
import {readdirSync,readFileSync} from 'node:fs';
import {join,relative,basename} from 'node:path';
const root=process.cwd(),skip=new Set(['.git','node_modules','.pages','.wrangler','.vercel','output','coverage','work']);
const patterns=[
 ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
 ['provider credential',/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}\b|\bwhsec_[A-Za-z0-9]{20,}\b|\bsb_secret_[A-Za-z0-9_-]{30,}\b/],
 ['GitHub credential',/\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b/],
 ['JWT credential',/\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/],
 ['database password URL',/postgres(?:ql)?:\/\/[^\s/:]+:[^\s@]+@/],
 ['production payment identifier',/\b(?:cs_live|pmc|acct|we)_[A-Za-z0-9]{18,}\b/],
 ['private gift/check-out URL',/\/manage#(?:id=|[A-Za-z0-9_-]{24,})|checkout\.stripe\.com\/c\/pay\/[A-Za-z0-9_=-]{24,}/],
 ['local personal path',/\/Users\/[^/\s]+|\/var\/folders\//],
];
const findings=[];let checked=0;
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){
 if(skip.has(entry.name))continue;
 const path=join(dir,entry.name),name=relative(root,path).replaceAll('\\','/');
 if(entry.isSymbolicLink()){findings.push([name,'symlink excluded from publication']);continue;}
 if(entry.isDirectory()){walk(path);continue;}
 const base=basename(path);
 if((base.startsWith('.env')&&base!=='.env.example')||/^\.dev\.vars/.test(base)||/\.(pem|key|dump|sqlite3?|har)$/.test(base))findings.push([name,'private local file']);
 const buffer=readFileSync(path);checked++;
 if(buffer.includes(0))continue;
 const lines=buffer.toString('utf8').split('\n');
 for(let i=0;i<lines.length;i++){
  for(const [category,pattern] of patterns)if(pattern.test(lines[i]))findings.push([`${name}:${i+1}`,category]);
  if(!name.startsWith('dist/fonts/'))for(const match of lines[i].matchAll(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)){
   if(name==='tests/smoke.cjs'&&lines[i].includes('https://'+match[0]))continue;
   const domain=match[1];if(!/(?:^|\.)(?:example\.com|example\.test|example\.invalid|evil\.example)$/.test(domain))findings.push([`${name}:${i+1}`,'non-example email address']);
  }
 }
}}
walk(root);
if(findings.length){console.error(JSON.stringify({checked,findings},null,2));process.exitCode=1;}
else console.log(`Public source scan passed: ${checked} files; no matched credentials, private exports or unexpected emails. Synthetic fixtures and font license contacts are permitted. This scan is not a security guarantee.`);
