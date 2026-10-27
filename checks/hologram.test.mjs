import assert from 'node:assert/strict';
import {advanceParticles} from '../hologram-physics.mjs';

const point = (x,y) => ({homeX:x,homeY:y,x,y,vx:0,vy:0,phase:Math.PI/3});
const avatar = Array.from({length:40},(_,i)=>point(160+(i%8)*10,170+Math.floor(i/8)*10));
const atRest=structuredClone(avatar);
for(let frame=0;frame<30;frame++) advanceParticles(avatar,{x:190,y:190,radius:80,strength:1},frame/60);
assert.ok(avatar.some((p,i)=>Math.hypot(p.x-atRest[i].x,p.y-atRest[i].y)>8),'The pointer must visibly displace nearby particles.');
for(let frame=0;frame<480;frame++) advanceParticles(avatar,null,frame/60);
assert.ok(avatar.every(p=>p.x===p.homeX&&p.y===p.homeY&&p.vx===0&&p.vy===0),'The portrait must reform and settle after the pointer leaves.');

const exactTap=[point(200,200)];
advanceParticles(exactTap,{x:200,y:200,radius:80,strength:1},0);
assert.ok(exactTap.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.hypot(p.vx,p.vy)>0),'A touch exactly on a particle must be safe and still move it.');

const distant=[point(10,10)];
advanceParticles(distant,{x:200,y:200,radius:30,strength:1},0);
assert.ok(Math.hypot(distant[0].x-10,distant[0].y-10)<0.1,'The interaction must remain local.');

const resumed=[{...point(200,200),x:280,y:150}];
for(let frame=0;frame<300;frame++) advanceParticles(resumed,null,frame/60,10000);
assert.ok(resumed.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x-200)<0.1),'A long frame must not destabilize the simulation.');
console.log('PASS: pointer repulsion, exact-touch stability, local effect, full return and long-frame recovery.');
