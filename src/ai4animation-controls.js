// S5 facing zero looks along world +Z and has right along world -X.
// Geno uses the world basis directly; the S5Runtime retarget reflects source X.
export function trialNeuralInput(side,forward,s5runtime){return {x:s5runtime?side:-side,z:forward};}
export function trialRootPosition(root,s5runtime,scale=1){return {x:root[0]*(s5runtime?-scale:1),y:0,z:root[2]*(s5runtime?scale:1)};}
