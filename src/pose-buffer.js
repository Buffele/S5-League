// Interpolation writes only presentation transforms. Restore the authoritative
// tick pose before evaluating the next tick, so display FPS cannot feed back
// into AnimationMixer or the controller.
export class PoseBuffer {
  constructor(nodes){
    this.entries=nodes.map(node=>({node,previous:this.read(node),current:this.read(node)}));
  }
  read(node){return {position:node.position.clone(),quaternion:node.quaternion.clone(),scale:node.scale.clone()};}
  copy(to,from){to.position.copy(from.position);to.quaternion.copy(from.quaternion);to.scale.copy(from.scale);}
  reset(){for(const e of this.entries){this.copy(e.current,e.node);this.copy(e.previous,e.node);}}
  beginTick(){for(const e of this.entries){this.copy(e.node,e.current);this.copy(e.previous,e.current);}}
  endTick(){for(const e of this.entries)this.copy(e.current,e.node);}
  render(alpha){
    const t=Math.max(0,Math.min(1,alpha));
    for(const e of this.entries){
      e.node.position.lerpVectors(e.previous.position,e.current.position,t);
      e.node.quaternion.slerpQuaternions(e.previous.quaternion,e.current.quaternion,t);
      e.node.scale.lerpVectors(e.previous.scale,e.current.scale,t);
    }
  }
}
