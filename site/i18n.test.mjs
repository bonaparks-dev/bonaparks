import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {translate,languages} from './i18n.mjs';
import {rows} from './i18n-catalog.mjs';
import {extraRows} from './i18n-extra.mjs';
import {legalRows} from './i18n-legal.mjs';
import {editorRows} from './i18n-editor.mjs';
import {tours} from './studio-tour-model.mjs';
const all=[...rows,...extraRows,...legalRows,...editorRows];
const normalize=s=>s.replace(/\s+/g,' ').trim();
test('all seven languages have a complete, non-empty catalog',()=>{
 assert.deepEqual(languages.map(l=>l[0]),['fr','en','it','es','de','zh','ru']);
 for(const row of all){assert.equal(row.length,7,row[0]);for(const value of row)assert.ok(typeof value==='string'&&value.trim(),row[0]);}
});
test('all scenario names, descriptions and chapter captions are translated',()=>{
 for(const tour of Object.values(tours))for(const source of [tour.name,tour.description,...tour.chapters.map(c=>c[2])])for(const [lang]of languages.slice(1))assert.notEqual(translate(source,lang),source,`${lang}: ${source}`);
});
test('dynamic labels retain numbers, symbols and visitor names',()=>{
 assert.equal(translate('  Rez-de-chaussée  ','en'),'  Ground floor  ');
 assert.equal(translate('RDC','en'),'Ground floor');
 assert.equal(translate('5 caméras','it'),'5 telecamere');
 assert.equal(translate('02 · Départ & protection','en'),'02 · Departure & protection');
 assert.equal(translate('↑ Ouvrir','en'),'↑ Open');
 assert.equal(translate('Bienvenue, Alex.','de'),'Willkommen, Alex.');
 assert.equal(translate('26,0 °C → 23 °C','en'),'26.0 °C → 23 °C');
 assert.equal(translate('My custom room','zh'),'My custom room');
 assert.equal(translate('Bonjour','xx'),'Bonjour');
});
test('public pages and account have catalog coverage for every text node',()=>{
 const keys=new Set(all.map(r=>normalize(r[0])));const brands=new Set(['Parks','◇ Parks','3D','Su Pranu','2D','PARKS 3D · HOME STUDIO','G','© 2026 Parks 3D','bonaparks@icloud.com','netlify.com/contact','DM Sans','Manrope','404 · PARKS 3D']);
 for(const name of ['index','compte','conditions','cgv','mentions-legales','aide','informations','confidentialite-web','404']){
  const html=fs.readFileSync(new URL(`./${name}.html`,import.meta.url),'utf8').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
  for(const [,raw]of html.matchAll(/>([^<>]+)</g)){
   const source=normalize(raw.replaceAll('&amp;','&').replaceAll('&nbsp;',' '));
   if(!/[a-zéèà]/i.test(source)||brands.has(source))continue;
   assert.ok(keys.has(source)||keys.has(source.toLocaleLowerCase('fr'))||translate(source,'en')!==source,`${name}: ${source}`);
  }
 }
});
