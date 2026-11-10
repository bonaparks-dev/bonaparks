// Entry leaves are overlaid only during the illustrative arrival/departure.
// The accepted room geometry and rendered images remain unchanged.
import {upperEntry} from './studio-upper-map.mjs';
const entries={overview:{id:'patio',p:[454,466],q:[495,488],open:[438,494],height:44},rdc:{id:'patio',p:[558,574],q:[606,600],open:[540,610],height:72},etage:{id:'upstairs',...upperEntry}};
export function doorsMarkup(doors,floor){if(!doors?.active)return '';const d=entries[floor];if(!d||!(doors[d.id]>0))return '';const t=Math.max(0,Math.min(1,doors[d.id]||0)),[x,y]=d.p,c=Math.cos(t*Math.PI/2),s=Math.sin(t*Math.PI/2),q=[x+(d.q[0]-x)*c+(d.open[0]-x)*s,y+(d.q[1]-y)*c+(d.open[1]-y)*s],h=d.height;
 const opening=floor==='etage'?'<path d="M'+d.p+'L'+d.q+'l0 '+(-h)+'L'+x+' '+(y-h)+'Z" fill="#555658"/>':'';
 return '<g class="entry-door" data-key="door-'+d.id+'">'+opening+'<path d="M'+x+' '+y+'L'+q+' '+q[0]+' '+(q[1]-h)+' '+x+' '+(y-h)+'Z" fill="'+(floor==='etage'?'#b9bbb5':'#b7a18a')+'" stroke="#d5d4ca" stroke-width="1.1"/><path d="M'+(x+(q[0]-x)*.76)+' '+(y+(q[1]-y)*.76-h*.46)+'l4 1" stroke="#ecedf0" stroke-width="1.5" stroke-linecap="round"/></g>';
}
