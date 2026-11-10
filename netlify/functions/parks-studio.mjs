import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {getStore} from '@netlify/blobs';
import {session} from '../lib/access.mjs';
export default async req=>{try{const s=await session(req,getStore({name:'parks-demo-access',consistency:'strong'}));if(!s){const next=new URL(req.url).searchParams;return new Response(null,{status:302,headers:{location:'/compte.html?next=studio&'+next.toString(),'cache-control':'no-store'}});}const html=await readFile(resolve('site/studio.html'),'utf8');return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'private, no-store','x-frame-options':'SAMEORIGIN'}});}catch{return new Response('Le studio est momentanément indisponible. Merci de réessayer.',{status:503,headers:{'cache-control':'no-store'}});}};
