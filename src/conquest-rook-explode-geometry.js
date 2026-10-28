import {assertConquestRookExplodeAttackDeclaration} from './conquest-rook-explode-attack.js';
import {queryConquestPawnExplodeSphere,classifyConquestPawnExplodeContacts} from './conquest-pawn-explode-sphere.js';
// Reuse the qualified common5426F0 capsule kernel and575BA0 type5 filter,
// not the Pawn timer/CExplosion scalar. Both callers own ordinary shape5.
export function conquestRookExplodeWorldAttackSphere({attack,position7c}={}){
 assertConquestRookExplodeAttackDeclaration(attack);if(!Array.isArray(position7c)||position7c.length!==3||!position7c.every(Number.isFinite))throw Error('Actual source RookExplode7C required');
 if(attack.sphere.origin.some(v=>v!==0))throw Error('Only the authenticated zero local sphere center is qualified');
 //5F5790 rotates the zero local center then adds virtual7C. Unlike the
 //Pawn timer transform, there is no half-height offset in this caller.
 return {type:5,origin:position7c.map(Math.fround),radius:attack.sphere.radius,source:'5F5790/RookExplode1110-zero-sphere',nativeReady:false};
}
export function queryConquestRookExplodeSphereGeometry({shape,candidates}={}){if(shape?.type!==5||shape.radius!==800)throw Error('Actual source1110 sphere800 required');return queryConquestPawnExplodeSphere({origin:shape.origin,radius:shape.radius,candidates});}
export function classifyConquestRookExplodeContacts({shape,...context}={}){if(shape?.type!==5||shape.radius!==800)throw Error('Actual source1110 sphere800 required');return classifyConquestPawnExplodeContacts({...context,origin:shape.origin});}
