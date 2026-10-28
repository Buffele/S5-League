// RookExplode1110 source-bound use of the already qualified CActParticle stages; own source/frame receipts.
import {conquestRookExplodeParticleSourceNode} from './conquest-rook-explode-particle-source.js';
import {advanceConquestParticleTexture11385e0} from './conquest-particle-texture-timeline.js';
export function advanceConquestRookExplodeParticleTexture(p,{source,nodeIndex,nextRandom15}={}){const node=conquestRookExplodeParticleSourceNode(source,nodeIndex),spec=node.emitter.sourceFields;return advanceConquestParticleTexture11385e0(p,{textureMode:node.textureMode,textureCount:spec.textures.length,textureIntervalMs:spec.textureIntervalMs,nextRandom15}).changed;}
export {createConquestPawnParticleFields,advanceConquestPawnParticlePool} from './conquest-pawn-particle-pool.js';
