import {getStore} from '@netlify/blobs';
import {createRemoteJWKSet,jwtVerify} from 'jose';
import {handleAccess} from '../lib/access.mjs';
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export default async(req,context)=>{try{return await handleAccess(req,{store:getStore({name:'parks-demo-access',consistency:'strong'}),ip:context.ip,googleClientId:process.env.PARKS_GOOGLE_CLIENT_ID||'',verifyGoogle:async(token,audience)=>(await jwtVerify(token,keys,{audience,issuer:['https://accounts.google.com','accounts.google.com'],algorithms:['RS256']})).payload});}catch(error){console.error('Parks access unavailable',error.name);return new Response(JSON.stringify({error:'L’accès est momentanément indisponible. Réessayez dans quelques instants.'}),{status:503,headers:{'content-type':'application/json','cache-control':'no-store'}});}};
