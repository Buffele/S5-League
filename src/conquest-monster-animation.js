import {LoopOnce, LoopRepeat} from 'three';
import {CONQUEST_RENDER_DATA} from './conquest-render-data.js';
import {CONQUEST_MONSTER_ANIMATION_SOURCES} from './conquest-monster-animation-data.js';

// A046B0 chooses the controller operation before it knows whether a SCN clip
// exists. Keep requested-name history separate from the last rendered action.
export function conquestMonsterAnimationIntent({monsterKey, stateId, previousRequestedName, uniqueUnit}) {
  const monster = CONQUEST_RENDER_DATA.monsters[monsterKey];
  const source = monster && CONQUEST_MONSTER_ANIMATION_SOURCES[monster.ai];
  if (!source || !Number.isInteger(stateId) || stateId < 0 || typeof previousRequestedName !== 'string') {
    throw Error('Explicit source monster, state ID and previous requested animation required');
  }
  let state = source.states[stateId];
  if (!state) return {accepted: false, reason: 'state-animation-not-authored', monsterKey, stateId};
  if (state.uniqueUnitBranches) {
    if (typeof uniqueUnit !== 'boolean') throw Error('Explicit native IsUniqueUnit result required for this animation');
    state = state.uniqueUnitBranches[String(uniqueUnit)];
  }
  const [clip, blendEnabled, blendInMs, blendOutMs, loop, resetClock] = state.arguments;
  const blend = blendEnabled && clip.toLowerCase() !== previousRequestedName.toLowerCase();
  return {
    accepted: true, monsterKey, stateId, stateName: state.name, clip,
    source: source.path, sourceSha256: source.sha256, sourceLine: state.line,
    arguments: [...state.arguments], previousRequestedName,
    operation: blend ? 'blend' : 'set', blendEnabled,
    blendInMs, blendOutMs, blendDurationMs: blend ? (blendInMs + blendOutMs) >>> 0 : 0,
    loop, resetClock, nativeReady: false,
  };
}

// The state manager owns transitions/timers. This adapter owns only actions on
// the existing model mixer; call model.update(seconds) once in the render loop.
// playbackRate is an explicit state port, not derived from attack duration.
export class ConquestMonsterAnimationAdapter {
  constructor(model, {previousRequestedName, uniqueUnit} = {}) {
    if (!model || !Array.isArray(model.clips) || !model.mixer?.clipAction || !model.nodes ||
        CONQUEST_RENDER_DATA.monsters[model.monsterKey]?.scene !== model.source ||
        typeof previousRequestedName !== 'string') {
      throw Error('Actual source Conquest model and explicit requested-name history required');
    }
    this.model = model;
    this.previousRequestedName = previousRequestedName;
    this.uniqueUnit = uniqueUnit;
    this.currentAction = null;
    this.lastReceipt = null;
    this.lastTransitionSerial = -1;
    this.actions = new Set();
    this.disposed = false;
    this.nativeReady = false;
  }

  enter(stateId, {transitionSerial, playbackRate} = {}) {
    if (this.disposed || !Number.isSafeInteger(transitionSerial) || transitionSerial < 0 ||
        !Number.isFinite(playbackRate) || playbackRate <= 0) {
      throw Error('Live animation adapter, transition serial and explicit positive playback rate required');
    }
    if (transitionSerial < this.lastTransitionSerial) throw Error('Animation transition serial moved backwards');
    if (transitionSerial === this.lastTransitionSerial) {
      if (this.lastReceipt.stateId !== stateId || this.lastReceipt.playbackRate !== playbackRate) {
        throw Error('Animation transition serial reused with different state/rate');
      }
      return this.lastReceipt;
    }
    const intent = conquestMonsterAnimationIntent({
      monsterKey: this.model.monsterKey, stateId, previousRequestedName: this.previousRequestedName,
      uniqueUnit: this.uniqueUnit,
    });
    const clip = intent.accepted ? this.model.clips.find(c => c.name === intent.clip) : null;
    const receipt = {
      ...intent, transitionSerial, playbackRate,
      accepted: !!clip, reason: intent.reason || (clip ? null : 'source-clip-absent'),
      sourceClipDurationSeconds: clip?.duration ?? null,
      // buildAnimationClips takes the maximum authored track length. Native
      // +2C uses the first successful component: these clocks are not conflated.
      nativeDurationEstablished: false, nativeClockEstablished: false, nativeFadeEstablished: false,
      fallbackProducerEstablished: false, renderer: 'three-source-tracks',
      nativeReady: false, renderedBlend: false,
    };
    if (intent.accepted) this.previousRequestedName = intent.clip;
    this.lastTransitionSerial = transitionSerial;
    this.lastReceipt = receipt;
    if (!clip) return receipt;

    const previous = this.currentAction;
    const action = this.model.mixer.clipAction(clip);
    // Do not leave a third action contributing after an interrupted fade.
    for (const owned of this.actions) if (owned !== previous && owned !== action) owned.stop();
    const oldTime = action.time;
    action.stopFading().stopWarping().reset();
    if (!intent.resetClock) action.time = oldTime;
    action.enabled = true;
    action.setEffectiveWeight(1).setEffectiveTimeScale(playbackRate);
    action.setLoop(intent.loop ? LoopRepeat : LoopOnce, intent.loop ? Infinity : 1);
    action.clampWhenFinished = !intent.loop;
    action.play();
    if (previous && previous !== action) {
      if (intent.operation === 'blend' && intent.blendDurationMs > 0) {
        previous.stopFading();
        action.crossFadeFrom(previous, intent.blendDurationMs / 1000, false);
        receipt.renderedBlend = true;
      } else previous.stop();
    }
    this.actions.add(action);
    this.currentAction = action;
    // Existing inspection/debug callers can see the action without using the
    // old playSourceState path, which suppresses same-clip reentries.
    this.model.currentAction = action;
    return receipt;
  }

  snapshot() {
    return {
      receipt: this.lastReceipt, previousRequestedName: this.previousRequestedName,
      renderedClip: this.currentAction?.getClip().name ?? null,
      renderedTimeSeconds: this.currentAction?.time ?? null,
      running: this.currentAction?.isRunning() ?? false, nativeReady: false,
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const action of this.actions) action.stop();
    if (this.model.currentAction === this.currentAction) this.model.currentAction = null;
    this.actions.clear();
    this.currentAction = null;
    // The parent actor retains ownership of model/skeleton/texture disposal.
  }
}
