export const COMPARISON_DIRECTIONS=['front','rightFront','right','rightBack','back','leftBack','left','leftFront'];
export const COMPARISON_DIRECTION_LABELS={front:'Avant',rightFront:'Diagonale avant droite',right:'Droite',rightBack:'Diagonale arrière droite',back:'Arrière',leftBack:'Diagonale arrière gauche',left:'Gauche',leftFront:'Diagonale avant gauche'};
export function comparisonCircle(time,speed,{period=12}={}){
 if(!Number.isFinite(time)||!Number.isFinite(speed)||speed<=0||!Number.isFinite(period)||period<=0)throw Error('Invalid comparison path');
 const angle=time*Math.PI*2/period,radius=speed*period/(Math.PI*2);
 return {position:{x:radius*Math.cos(angle),y:0,z:radius*Math.sin(angle)},velocity:{x:-speed*Math.sin(angle),y:0,z:speed*Math.cos(angle)},facing:0};
}
export function comparisonDirection(direction,speed){
 const index=COMPARISON_DIRECTIONS.indexOf(direction);
 if(index<0)throw Error('Unknown comparison direction '+direction);
 const angle=index*Math.PI/4;
 return {position:{x:0,y:0,z:0},velocity:{x:-speed*Math.sin(angle),y:0,z:speed*Math.cos(angle)},facing:0};
}
