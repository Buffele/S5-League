const f=Math.fround;
const vector=(v,name)=>{if(!Array.isArray(v)||v.length!==3||!v.every(n=>Number.isFinite(n)&&Number.isFinite(f(n))))throw Error('Explicit native Snipe '+name+' vec3 required');return v.map(f);};
const norm=v=>{const length=f(Math.sqrt(f(f(f(v[0]*v[0])+f(v[1]*v[1]))+f(v[2]*v[2]))));return length!==0?v.map(n=>f(n/length)):[...v];};
// Whole6C5320 and5763D0. The source overwrites script rounds2 with1 before
// BOTH random calls. Preserve two CRT draws and double precision rand/32767
// until its final float32 store; do not use the common float32 range sampler.
export function conquestBishopSnipeDirectionRand({monsterPosition7c,monsterHeight6c,targetPosition7c,targetHeight6c,targetDirection8c,width=400,height=200,scriptRounds=2,random15X,random15Y}={}){
 const source=vector(monsterPosition7c,'monster7C'),target=vector(targetPosition7c,'target7C'),facing=vector(targetDirection8c,'target8C');
 if(width!==400||height!==200||scriptRounds!==2)throw Error('Authored Snipe jitter400/200/rounds2 required');for(const n of [monsterHeight6c,targetHeight6c])if(!Number.isFinite(n)||!Number.isFinite(f(n))||n<0)throw Error('Actual finite Snipe actor6C required');for(const n of [random15X,random15Y])if(!Number.isInteger(n)||n<0||n>32767)throw Error('Actual source Snipe CRT rand15 required');
 const jitterX=f(f(width-(-width))*(random15X/32767)+f(-width)),jitterY=f(f(height-(-height))*(random15Y/32767)+f(-height)),right=norm([f(-facing[2]),0,f(facing[0])]);
 target[1]=f(target[1]+f(f(targetHeight6c)*f(.7)));source[1]=f(source[1]+f(f(monsterHeight6c)*f(.7)));
 for(let i=0;i<3;i++)target[i]=f(target[i]+f(right[i]*jitterX));target[1]=f(target[1]+jitterY);
 return {direction: norm(target.map((n,i)=>f(n-source[i]))),jitterX,jitterY,actualRounds:1,randomDrawCount:2,source:'6C5320→5763D0',sourceKernelQualified:true,nativeReady:false};
}
