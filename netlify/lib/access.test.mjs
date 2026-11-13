import test from 'node:test';import assert from 'node:assert/strict';import {handleAccess,session,hash,cleanRegistration} from './access.mjs';
const makeStore=()=>{const data=new Map();return {data,get:async k=>data.get(k),set:async(k,v)=>data.set(k,v),setJSON:async(k,v)=>data.set(k,structuredClone(v)),delete:async k=>data.delete(k)};};
const request=(body,headers={})=>new Request('https://bonaparks.com/.netlify/functions/parks-access',{method:'POST',headers:{origin:'https://bonaparks.com','content-type':'application/json',cookie:'parks_csrf=nonce','x-parks-csrf':'nonce',...headers},body:JSON.stringify(body)});
const input={action:'register',name:'Visiteur test',email:'demo@example.invalid',marketing:false};
test('registration stores a private lead, leaves marketing off and issues an opaque secure session',async()=>{const store=makeStore(),r=await handleAccess(request(input),{store});assert.equal(r.status,201);const cookie=r.headers.get('set-cookie');assert.match(cookie,/HttpOnly; Secure; SameSite=Lax/);assert.ok(!cookie.includes(input.email));const token=cookie.match(/parks_session=([^;]+)/)[1];const s=await session(new Request('https://bonaparks.com',{headers:{cookie:'parks_session='+token}}),store);assert.equal(s.name,input.name);const lead=store.data.get('contacts/'+s.contactId);assert.equal(lead.marketing,false);assert.equal(lead.emailVerified,false);assert.equal(lead.consentAt,null);assert.equal(lead.email,input.email);const body=await r.json();assert.equal(body.email,undefined);});
test('registration rejects cross-site requests, missing CSRF, injection, bad emails and honeypots',async()=>{const store=makeStore();assert.equal((await handleAccess(request(input,{origin:'https://attacker.invalid'}),{store})).status,403);assert.equal((await handleAccess(request(input,{'x-parks-csrf':''}),{store})).status,403);for(const bad of [{...input,name:'<script>'},{...input,email:'not-email'},{...input,company:'robot'}])assert.equal((await handleAccess(request(bad),{store})).status,400);assert.equal([...store.data.keys()].some(k=>k.startsWith('contacts/')),false);});
test('offer consent is explicit, recorded and never inferred from a string',async()=>{assert.equal(cleanRegistration({...input,marketing:'true'}).marketing,false);const store=makeStore();await handleAccess(request({...input,marketing:true}),{store});const record=[...store.data.entries()].find(([k])=>k.startsWith('contacts/'))[1];assert.equal(record.marketing,true);assert.ok(record.consentAt);assert.equal(record.consentVersion,'2026-11-10');});
test('expiry, invalid cookies and logout cannot yield an authenticated session',async()=>{const store=makeStore(),r=await handleAccess(request(input),{store}),token=r.headers.get('set-cookie').match(/parks_session=([^;]+)/)[1],key='sessions/'+hash(token),headers={cookie:'parks_csrf=nonce; parks_session='+token};assert.equal((await handleAccess(request({action:'logout'},headers),{store})).status,200);assert.equal(store.data.has(key),false);assert.equal(await session(new Request('https://bonaparks.com',{headers}),store),null);store.data.set(key,{expiresAt:Date.now()-1});assert.equal(await session(new Request('https://bonaparks.com',{headers}),store),null);});
test('Google refuses unconfigured, invalid, unverified and replayed tokens',async()=>{const store=makeStore(),body={action:'google',credential:'fake'};assert.equal((await handleAccess(request(body),{store})).status,503);for(const payload of [{sub:'1',name:'Test',email:'test@example.invalid',email_verified:false,nonce:'nonce'},{sub:'1',name:'Test',email:'test@example.invalid',email_verified:true,nonce:'wrong'}])assert.equal((await handleAccess(request(body),{store,googleClientId:'client',verifyGoogle:async()=>payload})).status,401);assert.equal([...store.data.keys()].some(k=>k.startsWith('contacts/')),false);});
test('Google registration uses server-verified claims rather than client-supplied profile',async()=>{const store=makeStore(),r=await handleAccess(request({action:'google',credential:'test',name:'forged',email:'forged@example.invalid'}),{store,googleClientId:'client',verifyGoogle:async()=>({sub:'google-sub',name:'Verified',email:'verified@example.invalid',email_verified:true,nonce:'nonce'})});assert.equal(r.status,201);const lead=[...store.data.entries()].find(([k])=>k.startsWith('contacts/'))[1];assert.equal(lead.name,'Verified');assert.equal(lead.emailVerified,true);assert.equal(lead.subject,'google-sub');});
test('registration rate limit prevents unlimited creation',async()=>{const store=makeStore();for(let i=0;i<20;i++)assert.equal((await handleAccess(request(input),{store,ip:'test-ip'})).status,201);assert.equal((await handleAccess(request(input),{store,ip:'test-ip'})).status,429);});

import {isOwner} from './access.mjs';
test('only a verified owner address sees the private demo cameras',()=>{
 const owners='owner@example.com, Second@Example.com';
 assert.equal(isOwner(null,owners),false);
 assert.equal(isOwner({email:'owner@example.com',emailVerified:false},owners),false);   // typed, never verified
 assert.equal(isOwner({email:'owner@example.com',emailVerified:true},''),false);        // no owner configured
 assert.equal(isOwner({email:'OWNER@example.com ',emailVerified:true},owners),true);
 assert.equal(isOwner({email:'second@example.com',emailVerified:true},owners),true);
 assert.equal(isOwner({email:'someone@example.com',emailVerified:true},owners),false);
});

import {register} from './access.mjs';
const get=headers=>new Request('https://bonaparks.com/.netlify/functions/parks-access',{headers});
test('the owner is read from the verified contact, never from a typed address',async()=>{const store=makeStore(),owners='owner@example.com';
 const g=await register({name:'Propriétaire',email:'owner@example.com',marketing:false},store,{provider:'google',subject:'s1',verified:true});
 let r=await handleAccess(get({cookie:'parks_session='+g.token}),{store,ownerEmails:owners});assert.equal((await r.json()).owner,true);
 const e=await register({name:'Imposteur',email:'owner@example.com',marketing:false},store);
 r=await handleAccess(get({cookie:'parks_session='+e.token}),{store,ownerEmails:owners});assert.equal((await r.json()).owner,false);});
const app=body=>new Request('https://bonaparks.com/.netlify/functions/parks-access',{method:'POST',headers:{'x-parks-app':'1','content-type':'application/json'},body:JSON.stringify(body)});
test('the app gets its own session from a one-time code handed by the signed-in page',async()=>{const store=makeStore(),owners='owner@example.com';
 const g=await register({name:'Propriétaire',email:'owner@example.com',marketing:false},store,{provider:'google',subject:'s1',verified:true});
 assert.equal((await handleAccess(request({action:'app-code'}),{store})).status,401);                       // not signed in on the page
 const r=await handleAccess(request({action:'app-code'},{cookie:'parks_csrf=nonce; parks_session='+g.token}),{store});assert.equal(r.status,200);const {code}=await r.json();assert.match(code,/^[a-f0-9]{48}$/);
 const forged=new Request('https://bonaparks.com/.netlify/functions/parks-access',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json',cookie:'parks_session='+g.token},body:JSON.stringify({action:'app-code'})});
 assert.equal((await handleAccess(forged,{store})).status,403);                                              // another site cannot ask for a code
 const a=await handleAccess(app({action:'app-redeem',code}),{store,ownerEmails:owners});assert.equal(a.status,200);const got=await a.json();assert.equal(got.owner,true);assert.notEqual(got.token,g.token);
 assert.equal((await handleAccess(app({action:'app-redeem',code}),{store})).status,400);                  // one time only
 let s=await handleAccess(get({authorization:'Bearer '+got.token}),{store,ownerEmails:owners});assert.equal((await s.json()).authenticated,true);
 assert.equal((await handleAccess(app({action:'logout'}),{store})).status,401);
 const out=new Request('https://bonaparks.com/.netlify/functions/parks-access',{method:'POST',headers:{'x-parks-app':'1','content-type':'application/json',authorization:'Bearer '+got.token},body:JSON.stringify({action:'logout'})});
 assert.equal((await handleAccess(out,{store})).status,200);
 s=await handleAccess(get({authorization:'Bearer '+got.token}),{store});assert.equal((await s.json()).authenticated,false);
 s=await handleAccess(get({cookie:'parks_session='+g.token}),{store});assert.equal((await s.json()).authenticated,true);});   // the page stays signed in
