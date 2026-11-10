import {createHash,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const SESSION_AGE=30*86400;
export const cookie=(name,value,age=SESSION_AGE)=>`${name}=${value}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Lax`;
export function cookies(req){return Object.fromEntries((req.headers.get('cookie')||'').split(';').map(s=>s.trim().split('=')).filter(p=>p.length===2));}
export function equal(a,b){if(typeof a!=='string'||typeof b!=='string'||!a.length)return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function cleanRegistration(body){const name=typeof body.name==='string'?body.name.trim().replace(/\s+/g,' '):'',email=typeof body.email==='string'?body.email.trim().toLowerCase():'';if(name.length<2||name.length>80||/[<>\x00-\x1f]/.test(name)||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||body.company)return null;return {name,email,marketing:body.marketing===true};}
export async function session(req,store){const token=cookies(req).parks_session;if(!/^[a-f0-9]{64}$/.test(token||''))return null;const s=await store.get('sessions/'+hash(token),{type:'json'});if(!s||s.expiresAt<=Date.now())return null;return s;}
export async function register(data,store,{provider='email',subject=null,verified=false}={}){const id=randomUUID(),token=randomBytes(32).toString('hex'),now=Date.now(),sessionKey='sessions/'+hash(token),record={id,name:data.name,email:data.email,provider,subject,emailVerified:verified,marketing:data.marketing,consentText:data.marketing?'Je souhaite recevoir l’offre et les nouvelles de Parks 3D par e-mail.':null,consentVersion:'2026-11-10',consentAt:data.marketing?new Date(now).toISOString():null,createdAt:new Date(now).toISOString(),expiresAt:now+(data.marketing?3*365:30)*86400000};await store.setJSON('contacts/'+id,record);const s={contactId:id,name:data.name,provider,expiresAt:now+SESSION_AGE*1000};await store.setJSON(sessionKey,s);return {token,session:s};}
export async function handleAccess(req,{store,googleClientId='',verifyGoogle,ip='unknown'}){
 const url=new URL(req.url),json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
 if(req.method==='GET'){const current=await session(req,store),nonce=cookies(req).parks_csrf||randomBytes(24).toString('hex');return json({authenticated:!!current,name:current?.name||null,googleClientId,csrf:nonce},200,{'set-cookie':cookie('parks_csrf',nonce,3600)});}
 if(req.method!=='POST')return json({error:'Méthode non autorisée.'},405);
 if(req.headers.get('origin')!==url.origin||!equal(req.headers.get('x-parks-csrf'),cookies(req).parks_csrf))return json({error:'Session expirée. Rechargez la page.'},403);
 if(!req.headers.get('content-type')?.includes('application/json'))return json({error:'Format non accepté.'},415);
 const text=await req.text();if(text.length>12000)return json({error:'Requête trop volumineuse.'},413);let body;try{body=JSON.parse(text);}catch{return json({error:'Requête illisible.'},400);}if(!body||typeof body!=='object')return json({error:'Requête illisible.'},400);
 if(body.action==='logout'){const token=cookies(req).parks_session;if(/^[a-f0-9]{64}$/.test(token||''))await store.delete('sessions/'+hash(token));return json({ok:true},200,{'set-cookie':cookie('parks_session','',0)});}
 if(body.action==='erase'){const current=await session(req,store);if(!current)return json({error:'Reconnectez-vous pour gérer cet accès.'},401);await store.delete('contacts/'+current.contactId);const token=cookies(req).parks_session;await store.delete('sessions/'+hash(token));return json({ok:true},200,{'set-cookie':cookie('parks_session','',0)});}
 const bucket='rate/'+new Date().toISOString().slice(0,13)+'/'+hash(ip),attempts=Number(await store.get(bucket)||0);if(attempts>=20)return json({error:'Trop de tentatives. Réessayez dans une heure.'},429);await store.set(bucket,String(attempts+1));
 let data,options={};
 if(body.action==='google'){
  if(!googleClientId)return json({error:'La connexion Google sera disponible prochainement. Utilisez votre nom et votre e-mail.'},503);
  if(typeof body.credential!=='string')return json({error:'Connexion Google incomplète.'},400);
  try{const p=await verifyGoogle(body.credential,googleClientId);if(!equal(p.nonce,cookies(req).parks_csrf)||!p.email_verified||!p.sub)throw Error();data=cleanRegistration({name:p.name||p.given_name,email:p.email,marketing:body.marketing});options={provider:'google',subject:p.sub,verified:true};}catch{return json({error:'La connexion Google n’a pas pu être vérifiée. Réessayez.'},401);}
 }else if(body.action==='register')data=cleanRegistration(body);else return json({error:'Action inconnue.'},400);
 if(!data)return json({error:'Indiquez un nom et une adresse e-mail valides.'},400);
 const result=await register(data,store,options);return json({ok:true,name:result.session.name},201,{'set-cookie':cookie('parks_session',result.token)});
}
