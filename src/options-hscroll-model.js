// Audio consumer C724D0 overrides XML scroll_size1/range0 with step10/range100.
export function audioScrollConfig(node){const p=node.properties,r=p.global;
 const config={width:Number(r.right)-Number(r.left),height:Number(r.bottom)-Number(r.top),thumbSize:Number(p.stick_size.value),buttonRatio:Number(p.button_ratio.value),direction:p.direction.value==='true',showThumb:p.enable_stick.value==='true',range:100,step:10};
 if(config.width!==192||config.height!==14||config.thumbSize!==6||config.buttonRatio!==1)throw RangeError('Only authenticated Options audio geometry is supported');return Object.freeze(config);
}
export function scrollGeometry(config,value){const {width,height,thumbSize,buttonRatio,range,direction}=config,arrow=Math.trunc(height*buttonRatio),travel=width-2*arrow-thumbSize;
 if(travel<=0||range<=0)throw RangeError('Invalid HScroll range/travel');value=Math.max(0,Math.min(range,Math.trunc(value)));const visual=direction?value:range-value,left=arrow+Math.trunc(travel*visual/range);
 return {arrow,travel,track:{left:arrow,width:width-2*arrow},left:{left:0,width:arrow},right:{left:width-arrow,width:arrow},thumb:{left,width:thumbSize},value};
}
export function valueAtThumb(config,left){const g=scrollGeometry(config,0),start=Math.max(g.arrow,Math.min(config.width-g.arrow-config.thumbSize,left));const visual=Math.trunc((start-g.arrow)/g.travel*config.range+0.5);return config.direction?visual:config.range-visual;}
export function hitScroll(config,geometry,x){if(x<=config.height)return 'left';if(x>=config.width-config.height)return 'right';if(config.showThumb&&x>=geometry.thumb.left&&x<=geometry.thumb.left+config.thumbSize)return 'thumb';return 'track';}
export function skinForPart(part,state){if(part==='track')return 0;return ({left:1,right:4,thumb:7})[part]+state;}
export function arrowValue(config,current,part){const sign=part==='left'?-1:1;return Math.max(0,Math.min(config.range,current+sign*(config.direction?1:-1)*config.step));}
