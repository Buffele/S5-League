// User specification, 2026-10-01. Directions are anatomical right/up/forward.
export const KATON_FPS=30;
export const KATON_BONES=['Bip01','Bip01 Pelvis','Bip01 Spine','Bip01 Spine1','Bip01 Spine2','Bip01 Neck','Bip01 Head',
 ...['L','R'].flatMap(s=>['Clavicle','UpperArm','Forearm','Hand','Thigh','Calf','Foot'].map(p=>`Bip01 ${s} ${p}`))];
export const KATON_KEYS=[
 [0,-.020,0,6,0,0,'A'],[6,-.035,0,12,2,2,'P'],[10,-.035,0,12,3,3,'S1'],
 [14,-.035,0,12,3,3,'S2'],[18,-.035,0,12,3,3,'S3'],[22,-.035,0,12,3,3,'S4'],
 [26,-.035,0,12,3,3,'S5'],[30,-.035,0,12,3,3,'S6'],[34,-.025,-.008,2,1,4,'T'],
 [38,-.018,-.012,-10,-2,5,'F'],[40,-.018,-.012,-10,-2,5,'F'],[44,-.043,.020,28,-3,3,'F'],
 [48,-.040,.018,22,-3,3,'F'],[66,-.040,.018,22,-3,3,'F'],[72,-.033,.009,16,-1,2,'R1'],
 [78,-.025,.003,8,0,0,'R2'],[84,-.020,0,6,0,0,'A'],[90,-.020,0,6,0,0,'A'],
];
export const KATON_HANDS={
 A:[[-.13,-.25,.045],[.13,-.25,.045],'BAS','BAS'],P:[[-.08,-.04,.13],[.08,-.04,.13],'VERTICAL','VERTICAL'],
 S1:[[-.022,.025,.145],[.022,.025,.145],'VERTICAL','VERTICAL'],S2:[[0,.005,.15],[0,.045,.155],'H1','H1'],
 S3:[[-.025,.045,.145],[.025,.005,.17],'DIAGONAL','DIAGONAL'],S4:[[0,.045,.155],[0,.005,.15],'H2','H2'],
 S5:[[-.035,.025,.15],[.035,.025,.15],'DIAGONAL','DIAGONAL'],S6:[[-.015,.04,.15],[.015,.04,.15],'VERTICAL','VERTICAL'],
 T:[[-.12,-.10,.06],[.065,.10,.16],'SEPARATION','VERTICAL'],F:[[-.16,-.20,-.05],[.04,-.01,.015],'BAS','VERTICAL'],
 R1:[[-.14,-.21,0],[.12,.07,.17],'BAS','FORWARD'],R2:[[-.13,-.25,.045],[.13,-.18,.10],'BAS','BAS'],
};
export const smooth=u=>u*u*(3-2*u);
export function katonFrame(frame){
 frame=Math.max(0,Math.min(90,frame));let index=KATON_KEYS.findIndex(k=>k[0]>=frame);if(index<1)index=1;
 const a=KATON_KEYS[index-1],b=KATON_KEYS[index],u=(frame-a[0])/(b[0]-a[0]),w=a[0]===40?u*u:smooth(u);
 const values=a.slice(1,6).map((v,i)=>v+(b[i+1]-v)*w);
 if(frame>=48&&frame<=66){const n=frame-48;values[2]+=.5*Math.sin(2*Math.PI*n/6)*Math.sin(Math.PI*n/18)**2;}
 const pole=frame<30?0:frame<38?smooth((frame-30)/8):frame<=66?1:frame<84?1-smooth((frame-66)/18):0;
 return {frame,height:values[0],forward:values[1],theta:values[2],clavicle:values.slice(3),a:a[6],b:b[6],w,pole};
}
export function katonEmission(time){const f=time*KATON_FPS;if(f<43||f>=66)return 0;return f<45?(f-43)/2:f<=62?1:(66-f)/4;}
