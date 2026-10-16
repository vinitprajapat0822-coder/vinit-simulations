
(function(){
"use strict";
const deck=document.getElementById("experience-deck");
const stage=document.getElementById("experience-stage");
const picker=document.getElementById("theme-select");
if(!deck||!stage||!picker||typeof CATALOG==="undefined")return;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const all=CATALOG;
const cats=[...new Set(all.map(x=>x.category))];
const label=c=>c.replace(/[-_]/g," ").replace(/\b\w/g,m=>m.toUpperCase());
let selected=cats[0]||"kinematics";
let terminalHistory=["VINIT SIMULATION HUB // LOCAL CATALOG","Type help to list available commands.","Only catalog entries marked Live can be opened."];
let terminalInput="";
function items(cat){return all.filter(x=>!cat||x.category===cat)}
function itemCards(list){return '<div class="exp-items">'+list.map(x=>'<article class="exp-item"><div class="exp-badge '+(x.status==="live"?"":"soon")+'">'+(x.status==="live"?"● LIVE":"○ COMING SOON")+'</div><h3>'+esc(x.title)+'</h3><p>'+esc(x.desc)+'</p><div>'+(x.status==="live"&&x.url?'<a href="'+esc(x.url)+'">Open simulator ↗</a>':'<span class="exp-muted">Not released yet</span>')+'</div></article>').join("")+'</div>'}
function catButtons(){return cats.map(c=>'<button type="button" class="exp-btn" data-category="'+esc(c)+'" aria-pressed="'+(c===selected)+'">'+esc(label(c))+'</button>').join("")}
function header(title,desc,chip){return '<div class="exp-head"><div><div class="exp-kicker">MIDNIGHT QUANTUM · VINIT SIGNATURE</div><h2>'+title+'</h2><p>'+desc+'</p></div><span class="exp-chip">'+chip+'</span></div>'}
function controlRoom(){
let live=all.filter(x=>x.status==="live");
return header("Space Data Center","Explore the real activity catalog from a modular science command deck.","CATALOG VERIFIED")+
'<div class="exp-grid"><div class="exp-panel exp-stat"><strong>'+all.length+'</strong><span>Catalog entries</span></div><div class="exp-panel exp-stat"><strong>'+live.length+'</strong><span>Live simulators</span></div><div class="exp-panel exp-stat"><strong>'+cats.length+'</strong><span>Topic categories</span></div></div>'+
'<div class="exp-panel" style="margin-top:12px"><b>Choose a science sector</b><div class="exp-actions">'+catButtons()+'</div><div class="exp-muted">Selected sector: '+esc(label(selected))+' · '+items(selected).length+' catalog entries</div>'+itemCards(items(selected))+'</div>'+
'<p class="exp-muted">Earth and orbital telemetry are intentionally omitted until a real data source exists.</p>';
}
function holographic(){
const n=cats.length, angles=cats.map((c,i)=>-90+i*360/n);
let planets=cats.map((c,i)=>{let a=angles[i]*Math.PI/180;let x=50+42*Math.cos(a),y=50+42*Math.sin(a);return '<button type="button" class="exp-btn exp-planet" style="left:'+x+'%;top:'+y+'%" data-category="'+esc(c)+'" aria-pressed="'+(c===selected)+'">'+esc(label(c))+'</button>'}).join("");
return header("Holographic Core","Select an orbiting topic to reveal its real catalog entries. Tap a planet to change sectors.","ORBIT NAVIGATION")+
'<div class="exp-panel"><div class="exp-orbit"><div class="exp-ring"></div><div class="exp-ring r2"></div><div class="exp-core">VINIT<br>CORE</div>'+planets+'</div><div class="exp-muted">Focused sector: '+esc(label(selected))+'</div>'+itemCards(items(selected))+'</div>';
}
function constellation(){
const n=cats.length, w=620,h=320,cx=w/2,cy=h/2,rx=235,ry=120;
const pts=cats.map((c,i)=>({c,x:cx+rx*Math.cos(-Math.PI/2+i*2*Math.PI/n),y:cy+ry*Math.sin(-Math.PI/2+i*2*Math.PI/n)}));
let edges=pts.map((p,i)=>{let q=pts[(i+1)%n];return '<line x1="'+p.x+'" y1="'+p.y+'" x2="'+q.x+'" y2="'+q.y+'" stroke="#397caa" stroke-opacity=".6" stroke-width="1.5"/>'}).join("");
let nodes=pts.map(p=>'<g class="map-node" role="button" tabindex="0" data-category="'+esc(p.c)+'" aria-label="'+esc(label(p.c))+'"><circle cx="'+p.x+'" cy="'+p.y+'" r="'+(p.c===selected?11:7)+'" fill="'+(p.c===selected?"#7ceaff":"#6d80ff")+'" stroke="#b9f4ff" stroke-width="1.5"/><text x="'+p.x+'" y="'+(p.y+25)+'" text-anchor="middle">'+esc(label(p.c))+'</text></g>').join("");
return header("Star Map Constellation","Choose a connected concept node. The highlighted sector updates the catalog below.","CONCEPT NETWORK")+
'<div class="exp-panel"><svg class="exp-map" viewBox="0 0 '+w+' '+h+'" role="group" aria-label="Interactive category constellation">'+edges+nodes+'</svg><div class="exp-actions">'+catButtons()+'</div>'+itemCards(items(selected))+'</div>';
}
function terminal(){
return header("Hacker Terminal","Run commands against the real local catalog. This is a catalog interface, not a shell.","LOCAL CATALOG CLI")+
'<div class="exp-panel exp-terminal"><div class="exp-log" id="exp-log" aria-live="polite">'+terminalHistory.map(esc).join("\n")+'</div><form id="exp-terminal-form"><span aria-hidden="true" style="align-self:center;color:#83f5a0">$</span><input id="exp-command" autocomplete="off" aria-label="Catalog command" placeholder="help, ls, cd kinematics, search projectile, open projectile"><button class="exp-btn" type="submit">Run</button></form><div class="exp-muted" style="margin-top:9px">Allowed commands: help · ls · cd CATEGORY · search WORDS · open ID · clear</div><div id="exp-terminal-result"></div></div>';
}
function render(){
let theme=picker.value;
if(theme==="holographic")stage.innerHTML=holographic();
else if(theme==="constellation")stage.innerHTML=constellation();
else if(theme==="terminal")stage.innerHTML=terminal();
else stage.innerHTML=controlRoom();
}
deck.addEventListener("click",e=>{
const b=e.target.closest("[data-category]");
if(!b)return;
selected=b.dataset.category;
render();
});
deck.addEventListener("keydown",e=>{
const n=e.target.closest(".map-node");
if(n&&(e.key==="Enter"||e.key===" ")){e.preventDefault();selected=n.dataset.category;render()}
});
deck.addEventListener("submit",e=>{
if(e.target.id!=="exp-terminal-form")return;
e.preventDefault();
const input=deck.querySelector("#exp-command");
const out=deck.querySelector("#exp-terminal-result");
if(!input||!out)return;
const raw=input.value.trim(),parts=raw.split(/\s+/),cmd=(parts.shift()||"").toLowerCase(),arg=parts.join(" ");
let result="";
if(cmd==="help")result="Commands: help | ls | cd CATEGORY | search WORDS | open ID | clear";
else if(cmd==="ls")result=cats.map(c=>c+" ("+items(c).length+")").join("\n")+"\n\nLive IDs:\n"+all.filter(x=>x.status==="live").map(x=>x.id).join("\n");
else if(cmd==="cd"){let c=cats.find(x=>x.toLowerCase()===arg.toLowerCase()||label(x).toLowerCase()===arg.toLowerCase());if(c){selected=c;result="Sector selected: "+label(c)+"\n"+items(c).map(x=>x.id+" — "+x.title+" ["+x.status+"]").join("\n")}else result="Unknown category. Run ls to see valid sectors."}
else if(cmd==="search"){let found=all.filter(x=>(x.title+" "+x.desc+" "+x.tags+" "+x.id+" "+x.category).toLowerCase().includes(arg.toLowerCase()));result=found.length?found.map(x=>x.id+" — "+x.title+" ["+x.status+"]").join("\n"):"No matching catalog entries."}
else if(cmd==="open"){let x=all.find(x=>x.id===arg);if(x&&x.status==="live"&&x.url){result="Opening "+x.title+"…";out.textContent=result;location.href=x.url;return}else if(x)result="Found: "+x.title+" — "+(x.status==="live"?"No URL is configured.":"Coming soon; not openable yet.");else result="Unknown ID. Run ls or search WORDS."}
else if(cmd==="clear"){terminalHistory=[];terminalInput="";render();return}
else result="Unknown command. Type help.";
terminalHistory.push("$ "+raw,result);
terminalHistory=terminalHistory.slice(-14);
render();
const log=deck.querySelector("#exp-log");if(log)log.scrollTop=log.scrollHeight;
const resultBox=deck.querySelector("#exp-terminal-result");if(resultBox)resultBox.textContent=result;
});
picker.addEventListener("change",render);
document.addEventListener("vsh-theme-change",render);
render();
})();