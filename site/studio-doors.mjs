// Entry leaves are overlaid only during the illustrative arrival/departure.
// The accepted room geometry and rendered images remain unchanged.
const entries={overview:{id:'patio',p:[454,466],q:[495,488],open:[438,494],height:44},rdc:{id:'patio',p:[558,574],q:[606,600],open:[540,610],height:72},etage:{id:'upstairs',p:[730,455],q:[752,420],open:[698,441],height:54}};
export function doorsMarkup(doors,floor){if(!doors?.active)return '';const d=entries[floor];if(!d||!(doors[d.id]>0))return '';const t=Math.max(0,Math.min(1,doors[d.id]||0)),[x,y]=d.p,q=[d.q[0]+(d.open[0]-d.q[0])*t,d.q[1]+(d.open[1]-d.q[1])*t],h=d.height;
 return '<g class="entry-door" data-key="door-'+d.id+'"><path d="M'+x+' '+y+'L'+q+' '+q[0]+' '+(q[1]-h)+' '+x+' '+(y-h)+'Z" fill="#b7a18a" stroke="#d5c2ab" stroke-width="1.3"/><path d="M'+(x+(q[0]-x)*.76)+' '+(y+(q[1]-y)*.76-h*.46)+'l4 1" stroke="#ecedf0" stroke-width="1.5" stroke-linecap="round"/></g>';
}
