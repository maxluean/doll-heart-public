import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../dist/migrate-host.js',import.meta.url),'utf8');
function redirect(input){const url=new URL(input);let result=null;vm.runInNewContext(script,{URL,location:{origin:url.origin,pathname:url.pathname,search:url.search,hash:url.hash,replace:target=>{result=target;}}});return result;}
test('legacy site preserves gift token fragments and checkout queries on the fixed Pages origin',()=>{
 for(const origin of ['https://doll-heart-eta.vercel.app','https://doll-heart.pages.dev'])
 for(const path of ['/g#'+'a'.repeat(32),'/make#gift=mock-pixel-gift','/manage?checkout=mock-order&cancelled=1','/?create=1','/guide#page-6','/privacy.html','/purchase-policy.html'])assert.equal(redirect(origin+path),'https://specialdoll.pages.dev'+path);
});
test('Pages, preview hosts and old payment callbacks are never redirected by the compatibility script',()=>{
 for(const url of ['https://specialdoll.pages.dev/g#gift','https://preview.specialdoll.pages.dev/make','https://preview.doll-heart.pages.dev/make','https://doll-heart-preview.vercel.app/make','https://doll-heart-eta.vercel.app/api/payments/webhook','https://doll-heart-eta.vercel.app/api/session/google/callback?code=mock','https://doll-heart.pages.dev/api/payments/webhook','https://doll-heart.pages.dev/api/session/google/callback?code=mock'])assert.equal(redirect(url),null);
});
test('untrusted path and query values cannot change the destination host',()=>{
 const result=redirect('https://doll-heart-eta.vercel.app//evil.example/make?next=https://evil.example/#keep-me');
 const url=new URL(result);assert.equal(url.origin,'https://specialdoll.pages.dev');assert.equal(url.pathname,'//evil.example/make');assert.equal(url.hash,'#keep-me');
});
