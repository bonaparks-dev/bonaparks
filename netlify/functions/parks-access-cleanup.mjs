import {getStore} from '@netlify/blobs';
export default async()=>{const store=getStore({name:'parks-demo-access',consistency:'strong'}),now=Date.now();for(const prefix of ['contacts/','sessions/','rate/']){for await(const page of store.list({prefix,paginate:true})){for(const blob of page.blobs){if(prefix==='rate/'){const hour=blob.key.slice(5,18);if(Date.parse(hour+':00:00Z')<now-86400000)await store.delete(blob.key);}else{const record=await store.get(blob.key,{type:'json'});if(record?.expiresAt<=now)await store.delete(blob.key);}}}}};
export const config={schedule:'0 3 * * *'};
