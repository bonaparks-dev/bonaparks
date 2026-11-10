import {cp,mkdir,readFile,readdir,rm,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.join(root,'dist');
if(path.dirname(destination)!==root||path.basename(destination)!=='dist')throw Error('Unsafe build destination');
await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
// Keep the app's existing privacy/support URLs and server functions separate.
await cp(path.join(root,'public'),destination,{recursive:true});
await cp(path.join(root,'site'),destination,{recursive:true,filter:s=>!s.endsWith('.test.mjs')});
// A dedicated public, read-only scene; /studio continues to require a session.
const demo=(await readFile(path.join(root,'site/studio.html'),'utf8')).replace('<body>','<body class="demo-embed" data-public-demo><svg width="0" height="0" aria-hidden="true" style="position:absolute"><defs><filter id="scene-alpha" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="1.25" intercept="-0.25"/></feComponentTransfer></filter></defs></svg>').replace('<title>Parks 3D Studio · Votre maison prend forme</title>','<meta name="robots" content="noindex"><title>Parks 3D · Scénarios publics</title>');
await writeFile(path.join(destination,'demo.html'),demo);
const revision=process.env.COMMIT_REF||'local';
await writeFile(path.join(destination,'release.json'),JSON.stringify({application:'Parks 3D',revision,builtAt:new Date().toISOString()},null,2));
let count=0,bytes=0;
async function inspect(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())await inspect(p);else{count++;bytes+=(await stat(p)).size;if(/\.(html|mjs|css)$/.test(p)){
 const content=await readFile(p,'utf8');const refs=[...content.matchAll(/(?:src|href)="([^"$]+)"|(?:from\s*|import\s*\()'([^'$]+)'|url\(['"]?([^'"\)]+)['"]?\)/g)].map(m=>m[1]||m[2]||m[3]);
 for(const ref of refs){if(/^(?:https?:|mailto:|data:|blob:|#)/.test(ref)||ref.includes('${')||ref.includes("'"))continue;const clean=ref.split(/[?#]/)[0];if(!clean)continue;const target=path.resolve(ref.startsWith('/')?destination:path.dirname(p),clean.replace(/^\//,''));if(!target.startsWith(destination+path.sep)&&target!==destination)throw Error('Asset outside site: '+ref);let exists=false;for(const candidate of [target,path.join(target,'index.html')]){try{exists=(await stat(candidate)).isFile();if(exists)break;}catch{}}if(!exists)throw Error('Missing local asset '+ref+' in '+path.relative(destination,p));}
}}}}
await inspect(destination);console.log(`Parks 3D build: ${count} files, ${(bytes/1048576).toFixed(1)} MiB. All static references resolved.`);
