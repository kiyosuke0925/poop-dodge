(() => {
'use strict';
const C=window.GAME_SETTINGS||{}, $=id=>document.getElementById(id);
const canvas=$('game'), ctx=canvas.getContext('2d'), W=420,H=520;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const size=clamp(Number(C.playerSize)||58,20,110), poopSize=clamp(Number(C.poopSize)||34,16,70);
const speed=clamp(Number(C.moveSpeed)||310,80,800);
$('title').textContent=C.title||'밥덩이의 똥피하기';document.title=$('title').textContent+' · 똥피하기';
$('message').textContent='하늘에서 무언가 떨어진다…\n좌우로 움직여 끝까지 살아남기!';
const imgs={};for(const [key,path] of Object.entries({player:C.playerImage||'assets/player.png',poop:C.poopImage||'assets/poop.png',bg:C.backgroundImage||'assets/background.png'})){const im=new Image();im.src=path;imgs[key]=im;}
document.querySelector('.hero').src=imgs.player.src;
document.querySelector('.hero').onerror=e=>{e.target.hidden=true;};
let state='ready',elapsed=0,score=0,best=0,x=W/2,drops=[],spawn=0,last=0,keys=new Set(),held=new Map(),drag=null;
try{best=Math.max(0,Number(localStorage.getItem('tiny-poop-best-v1'))||0);}catch(e){$('storageNote').textContent='이 브라우저에서는 최고 기록이 이번 실행 동안만 유지돼요.';}
$('best').textContent=best;
function clearInput(){keys.clear();held.clear();drag=null;}
function stats(){$('score').textContent=score;$('time').textContent=elapsed.toFixed(1);$('best').textContent=best;}
function modal(head,msg,label,badge){$('headline').textContent=head;$('message').textContent=msg;$('start').textContent=label;$('badge').textContent=badge;$('overlay').hidden=false;}
function start(){clearInput();elapsed=0;score=0;x=W/2;drops=[];spawn=.65;state='playing';$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='일시정지 Ⅱ';stats();}
function pause(){if(state!=='playing')return;state='paused';clearInput();$('pause').textContent='계속하기 ▶';modal('잠깐 쉬어가기','준비되면 다시 이어서 해요.','계속하기 →','PAUSED');}
function resume(){state='playing';clearInput();$('overlay').hidden=true;$('pause').textContent='일시정지 Ⅱ';}
function end(){state='over';clearInput();let record=score>best;if(record){best=score;try{localStorage.setItem('tiny-poop-best-v1',String(best));}catch(e){}}stats();$('pause').disabled=true;modal('앗, 맞았다!',elapsed.toFixed(1)+'초 생존 · '+score+'점\n'+(record?'새로운 최고 기록이에요!':'한 번만 더 해볼까요?'),'다시 도전 →',record?'NEW BEST!':'GAME OVER');}
$('start').onclick=()=>state==='paused'?resume():start();
$('pause').onclick=()=>state==='paused'?resume():pause();
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)){e.preventDefault();keys.add(e.key.toLowerCase());}if(e.key.toLowerCase()==='p'&&!e.repeat){state==='paused'?resume():pause();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
for(const [id,dir] of [['left',-1],['right',1]]){$(id).addEventListener('pointerdown',e=>{e.preventDefault();held.set(e.pointerId,dir);$(id).setPointerCapture(e.pointerId);});for(const type of ['pointerup','pointercancel','lostpointercapture'])$(id).addEventListener(type,e=>held.delete(e.pointerId));}
function dragTo(e){const b=canvas.getBoundingClientRect();x=clamp((e.clientX-b.left)/b.width*W,size/2,W-size/2);}
canvas.addEventListener('pointerdown',e=>{if(state!=='playing')return;drag=e.pointerId;canvas.setPointerCapture(e.pointerId);dragTo(e);});
canvas.addEventListener('pointermove',e=>{if(e.pointerId===drag&&state==='playing')dragTo(e);});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>drag=null);
window.addEventListener('blur',()=>{clearInput();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function update(dt){elapsed+=dt;score=Math.floor(elapsed*10);let direction=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);for(const d of held.values())direction+=d;x=clamp(x+clamp(direction,-1,1)*speed*dt,size/2,W-size/2);spawn-=dt;if(spawn<=0){const s=poopSize*(.85+Math.random()*.35);drops.push({x:s/2+Math.random()*(W-s),y:-s,s,v:140+Math.min(elapsed*3.5,250)+Math.random()*60,angle:(Math.random()-.5)*.3});spawn=Math.max(.19,.75-elapsed*.008);}
const py=H-56;for(const d of drops){d.y+=d.v*dt; // Smaller hitboxes make transparent margins forgiving.
if(Math.abs(d.x-x)<size*.28+d.s*.30&&Math.abs(d.y-py)<size*.34+d.s*.30){end();return;}}
drops=drops.filter(d=>d.y<H+d.s);stats();}
function fit(im,cx,cy,box){const scale=box/Math.max(im.naturalWidth,im.naturalHeight);ctx.drawImage(im,cx-im.naturalWidth*scale/2,cy-im.naturalHeight*scale/2,im.naturalWidth*scale,im.naturalHeight*scale);}
function ready(im){return im.complete&&im.naturalWidth>0;}
function draw(){ctx.clearRect(0,0,W,H);if(ready(imgs.bg)){const im=imgs.bg,k=Math.max(W/im.width,H/im.height);ctx.drawImage(im,(W-im.width*k)/2,(H-im.height*k)/2,im.width*k,im.height*k);}else{ctx.fillStyle='#dff2ff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#c4dfd9';ctx.fillRect(0,H-32,W,32);}
ctx.fillStyle='#1c527b18';ctx.beginPath();ctx.ellipse(x,H-26,size*.38,6,0,0,Math.PI*2);ctx.fill();
if(ready(imgs.player))fit(imgs.player,x,H-56,size);else{ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,H-56,size*.4,0,Math.PI*2);ctx.fill();}
for(const d of drops){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.angle);if(ready(imgs.poop))fit(imgs.poop,0,0,d.s);else{ctx.fillStyle='#845444';ctx.beginPath();ctx.arc(0,0,d.s*.4,0,Math.PI*2);ctx.fill();}ctx.restore();}}
function frame(t){const dt=Math.min((t-last)/1000||0,0.035);last=t;if(state==='playing')update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
