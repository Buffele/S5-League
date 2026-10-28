import {Vector3} from 'three';

// Each weapon has its own three silhouettes and motion functions. A common
// ribbon buffer is a renderer, not a shared visual preset.
const profiles={
 katana:[{motif:'razor-prisms',width:.38,shards:6},{motif:'iaido-fans',width:.30,echo:'weapons',echoCount:2,interval:.12},{motif:'wind-feathers',width:.42,life:.4}],
 twinblade:[{motif:'crossed-lenses',width:.78,shards:10},{motif:'twin-orbits',width:.4,echo:'weapons',echoCount:2},{motif:'chain-knots',width:.5,life:.42}],
 breaker:[{motif:'hammer-plates',width:1.3,shards:22},{motif:'pressure-discs',width:.8,echo:null},{motif:'gravity-funnel',width:.95,shards:10}],
 assassinclaw:[{motif:'triple-talons',width:.32,shards:8},{motif:'electric-cage',width:.24,echo:null},{motif:'silk-curls',width:.3,life:.44}],
 ironboots:[{motif:'heel-jets',width:.5,shards:12},{motif:'step-chevrons',width:.35,echo:'weapons',echoCount:3},{motif:'ankle-vortices',width:.38,life:.38}],
 sigmablade:[{motif:'reactor-bars',width:.85,shards:16},{motif:'phase-lattice',width:.5,echo:'weapons',echoCount:2},{motif:'unstable-arcs',width:.65,life:.4}],
 vitalshock:[{motif:'ion-needles',width:.28,shards:14},{motif:'feline-crescents',width:.35,echo:'hand',echoCount:3},{motif:'voltage-loops',width:.26,life:.38}],
 deathscythe:[{motif:'astral-scythe',width:.8,shards:12},{motif:'spectral-teeth',width:.55,echo:null},{motif:'reaper-vortex',width:.65,life:.42}],
 demonicknuckle:[{motif:'ember-knuckles',width:.48,shards:24},{motif:'piston-fists',width:.38,echo:'weapons',echoCount:2},{motif:'demon-breath',width:.5,life:.4}],
};
export function meleeMotifProfile(weapon,style){return profiles[weapon]?.['ABC'.indexOf(style)]??null;}
const N=56,TAU=Math.PI*2,up=new Vector3(0,1,0);
export function buildMeleeMotif(profile,part,age,other=null){
 const delta=part.tip.clone().sub(part.base),length=delta.length(),axis=delta.clone().normalize(),side=new Vector3().crossVectors(axis,up).normalize();
 if(side.lengthSq()<1e-8)side.set(1,0,0);const normal=new Vector3().crossVectors(axis,side).normalize();
 const point=(u,x=0,y=0)=>part.base.clone().addScaledVector(delta,u).addScaledVector(side,x).addScaledVector(normal,y);
 const curve=fn=>Array.from({length:N+1},(_,i)=>fn(i/N));
 const ribbons=[],add=(width,fn,alpha=1)=>ribbons.push({width,alpha,points:curve(fn)});
 const envelope=u=>Math.sin(Math.PI*u),pulse=.85+.15*Math.sin(age*8),time=age*(profile.charging?4:7);
 switch(profile.motif){
  case 'razor-prisms':
   for(let c=0;c<3;c++)add(.026,u=>{const a=(u*2-1)*Math.PI;return point(.18+c*.23+u*.19,Math.sin(a)*.045,Math.abs(Math.cos(a))*.075);});break;
  case 'iaido-fans':
   for(let c=0;c<3;c++)add(.035,u=>point(u,-(.09+c*.065)*envelope(u),Math.sin(u*Math.PI)*(.08+c*.05)+Math.sin(time+c)*.015));break;
  case 'wind-feathers':
   for(let c=0;c<5;c++)add(.035,u=>point(.17+c*.16-u*.24,Math.sin(u*Math.PI)*(.10+c*.025),u*u*.26+Math.sin(u*5-time+c)*.055*envelope(u)));break;
  case 'crossed-lenses':
   for(let c=0;c<2;c++)add(.07,u=>{const a=u*Math.PI;return point(.15+u*.95,Math.sin(a)*.20*(c?-1:1),Math.sin(a*2)*.08);});
   if(other)add(.035,u=>part.tip.clone().lerp(other.tip,u).addScaledVector(normal,Math.sin(Math.PI*u)*.22));break;
  case 'twin-orbits':
   for(let c=0;c<2;c++)add(.045,u=>{const a=u*TAU+time+c*Math.PI;return point(.4+Math.cos(a)*.42,Math.sin(a)*.22,(u-.5)*.20);});break;
  case 'chain-knots':
   for(let c=0;c<3;c++)add(.035,u=>{const a=u*TAU*2-time+c*TAU/3;return point(u,Math.sin(a)*(.09+.07*envelope(u)),Math.sin(a*2)*.09);});break;
  case 'hammer-plates':
   for(let c=0;c<3;c++)add(.11,u=>{const a=u*4,q=Math.floor(a),f=a-q,r=.22+c*.055;return point(.72+c*.11,[-r,r,r,-r,-r][q]*(1-f)+[-r,r,r,-r,-r][Math.min(4,q+1)]*f,[-r,-r,r,r,-r][q]*(1-f)+[-r,-r,r,r,-r][Math.min(4,q+1)]*f);});break;
  case 'pressure-discs':
   for(let c=0;c<3;c++)add(.055,u=>{const a=u*TAU,r=(.18+c*.12)*pulse;return point(.85+c*.06,Math.cos(a)*r,Math.sin(a)*r);});break;
  case 'gravity-funnel':
   for(let c=0;c<4;c++)add(.045,u=>{const a=u*TAU*1.35-time+c*TAU/4,r=.04+u*u*.45;return point(.9-u*.65,Math.cos(a)*r,Math.sin(a)*r);});break;
  case 'triple-talons':
   for(let c=0;c<3;c++)add(.045,u=>point(.65+u*.85,(c-1)*.12*(1-u*.25),-.08+Math.sin(u*Math.PI*.8)*.20));break;
  case 'electric-cage':
   for(let c=0;c<4;c++)add(.025,u=>{const a=c*TAU/4+Math.sin(u*18-time)*.22,r=.10+Math.abs(Math.sin(u*Math.PI*3))*.055;return point(u,Math.cos(a)*r,Math.sin(a)*r);});break;
  case 'silk-curls':
   for(let c=0;c<3;c++)add(.028,u=>{const a=u*TAU*1.4-time+c*TAU/3,r=.04+u*.16;return point(.8-u*.95,Math.sin(a)*r,Math.cos(a)*r+u*u*.2);});break;
  case 'heel-jets':
   for(let c=0;c<3;c++)add(.055,u=>point(.15-u*(1.1+c*.18),(c-1)*.075+Math.sin(u*9-time+c)*.04*envelope(u),Math.sin(u*4-time)*.04*envelope(u)),1-c*.18);break;
  case 'step-chevrons':
   for(let c=0;c<3;c++)add(.055,u=>point(-.2-c*.3+Math.abs(u-.5)*.3,(u-.5)*.37,Math.sin(age*5+c)*.025));break;
  case 'ankle-vortices':
   for(let c=0;c<3;c++)add(.035,u=>{const a=u*TAU*1.5-time+c*TAU/3;return point(.5-u*.9,Math.cos(a)*(.1+u*.16),Math.sin(a)*(.1+u*.16));});break;
  case 'reactor-bars':
   for(let c=0;c<5;c++)add(.055,u=>point(.12+c*.18,(u-.5)*.23,Math.sin(u*Math.PI)*.12+Math.sin(time+c)*.015));break;
  case 'phase-lattice':
   for(let c=0;c<4;c++)add(.03,u=>{const a=u*TAU*1.5+c*Math.PI/2;return point(u,Math.sin(a)*.13,Math.cos(a)*.13);});break;
  case 'unstable-arcs':
   for(let c=0;c<4;c++)add(.035,u=>{const a=c*TAU/4,r=.07+envelope(u)*.18;return point(u,Math.cos(a)*r+Math.sin(u*19-time+c)*.06*envelope(u),Math.sin(a)*r+Math.sin(u*13+time+c)*.045*envelope(u));});break;
  case 'ion-needles':
   for(let c=0;c<5;c++)add(.025,u=>point(.8+u*(.45+(c%2)*.25),Math.cos(c*TAU/5)*(.04+u*.15),Math.sin(c*TAU/5)*(.04+u*.15)));break;
  case 'feline-crescents':
   for(let c=0;c<3;c++)add(.06,u=>{const a=(u-.5)*Math.PI*1.25;return point(.7+Math.cos(a)*.42,Math.sin(a)*(.20+c*.065),(c-1)*.09);});break;
  case 'voltage-loops':
   for(let c=0;c<3;c++)add(.03,u=>{const a=u*TAU-time+c*TAU/3;return point(.65+Math.sin(a*2)*.32,Math.sin(a)*.18,Math.cos(a)*.18);});break;
  case 'astral-scythe':
   for(let c=0;c<2;c++)add(.07,u=>{const a=u*Math.PI*.85;return point(.75+Math.sin(a)*.25,Math.cos(a)*(.28+c*.065),Math.sin(a)*.07);});break;
  case 'spectral-teeth':
   for(let c=0;c<5;c++)add(.04,u=>point(.58+c*.095+u*.04,(.12+u*.18)*Math.sin(c*.5+.4),(.08+envelope(u)*.12)*(1-u*.8)));break;
  case 'reaper-vortex':
   for(let c=0;c<4;c++)add(.045,u=>{const a=u*TAU*.85+time+c*TAU/4,r=.07+envelope(u)*.26;return point(.80+(u-.5)*.36,Math.cos(a)*r,Math.sin(a)*r);});break;
  case 'ember-knuckles':
   for(let c=0;c<4;c++)add(.065,u=>{const a=u*Math.PI;return point(.75+Math.sin(a)*.26,(c-1.5)*.095,Math.cos(a)*.07);});break;
  case 'piston-fists':
   for(let c=0;c<3;c++)add(.06,u=>{const a=u*TAU,r=.15*(1-c*.15);return point(.4+c*.23+Math.sin(time)*.03,Math.cos(a)*r,Math.sin(a)*r);});break;
  case 'demon-breath':
   for(let c=0;c<4;c++)add(.045,u=>{const a=c*TAU/4,r=.06+u*.10;return point(.9-u*.9,Math.cos(a)*r+Math.sin(u*7-time+c)*.09*envelope(u),Math.sin(a)*r+u*u*.18+Math.cos(u*6-time+c)*.045);});break;
  default:throw Error('Missing weapon art motif: '+profile.motif);
 }
 return ribbons;
}
