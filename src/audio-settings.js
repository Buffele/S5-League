// Authenticated data and action evidence; the DOM presentation is an S5 adaptation.
export const AUDIO_SOURCE_PROOF = Object.freeze({
  path: 'language/_eu_default_option.x7', archive: 'package/61.xs',
  checksum: '7df0bcdf', plainLength: 19495,
  sha256: '204b02b3b2b90b2f4c976b293ba25c61832fbad13a5bc31e3be6ca8dab97f644',
  consumerProof: 'work/s5runtime-inventory-recovery/options-consumers/verification.json',
  sfxSetter: 'D757B0', bgmSetter: 'D757E0', sfxMute: 'D75810', bgmMute: 'D75860',
});
export const AUDIO_DEFAULT_PERCENT = Object.freeze({sfx: 35, bgm: 15});
const CHANNELS = Object.freeze(['sfx', 'bgm']);
const LABELS = Object.freeze({sfx: 'Sound effects', bgm: 'Music'});
const mountedControls = new WeakSet();
const validPercent = value => Number.isInteger(value) && value >= 0 && value <= 100;
const validSink = sink => sink === null || typeof sink === 'function';

/** Sinks receive linearGain0..1, entry. WebAudio gain is an explicit S5 adapter.
 * No storage, playback, AudioContext, native save or Cancel rollback is invented.
 */
export function createAudioSettings({sfxSink = null, bgmSink = null, initial = null} = {}) {
  if (!validSink(sfxSink) || !validSink(bgmSink)) throw TypeError('Audio sinks must be functions or null');
  const percentages = initial?.version === 1 ? initial.percentages : initial;
  if (percentages !== null && (typeof percentages !== 'object' || Array.isArray(percentages) ||
      Object.keys(percentages).some(id => !CHANNELS.includes(id) || !validPercent(percentages[id])))) {
    throw TypeError('Invalid audio percentages');
  }
  const state = Object.fromEntries(CHANNELS.map(id => {
    const percent = percentages?.[id] ?? AUDIO_DEFAULT_PERCENT[id];
    return [id, {percent, muted: percent === 0, backupPercent: 0,
      sink: id === 'sfx' ? sfxSink : bgmSink, delivery: 'idle', error: null, token: 0}];
  }));
  const listeners = new Set();
  let revision = 0, disposed = false;
  function get(id) {
    if (!Object.hasOwn(state, id)) return null;
    const entry = state[id];
    return Object.freeze({id, label: LABELS[id], percent: entry.percent, muted: entry.muted,
      backupPercent: entry.backupPercent, linearGain: entry.percent / 100,
      defaultPercent: AUDIO_DEFAULT_PERCENT[id], available: !disposed && entry.sink !== null,
      delivery: entry.delivery, error: entry.error, revision});
  }
  function snapshot() {
    return Object.freeze({revision, sfx: get('sfx'), bgm: get('bgm')});
  }
  function notify() {
    const errors = [], current = snapshot();
    for (const listener of [...listeners]) {
      try { listener(current); } catch (error) { errors.push(String(error)); }
    }
    return errors;
  }
  function refuse(id) {
    if (disposed) return {accepted: false, reason: 'disposed'};
    if (!Object.hasOwn(state, id)) return {accepted: false, reason: 'unknown-channel'};
    if (state[id].sink === null) return {accepted: false, reason: 'unavailable'};
    return null;
  }
  function apply(id) {
    const refusal = refuse(id); if (refusal) return refusal;
    const entry = state[id], token = ++entry.token;
    entry.error = null; entry.delivery = 'pending'; revision++;
    const settle = (delivery, error = null) => {
      if (disposed || token !== entry.token) return;
      entry.delivery = delivery; entry.error = error === null ? null : String(error); revision++;
      notify();
    };
    let result;
    try { result = entry.sink(entry.percent / 100, get(id)); }
    catch (error) {
      settle('error', error);
      return {accepted: true, delivered: false, error: String(error), revision};
    }
    if (result === false) {
      settle('error', 'Audio sink rejected the setting');
      return {accepted: true, delivered: false, error: entry.error, revision};
    }
    // Async sinks are supported, including stale completion after replacement/remap.
    try {
      if (result && typeof result.then === 'function') {
        const completion = Promise.resolve(result).then(
          value => {
            if (value === false) { settle('error', 'Audio sink rejected the setting'); return {delivered: false}; }
            settle('accepted'); return {delivered: true};
          },
          error => { settle('error', error); return {delivered: false, error: String(error)}; });
        notify();
        return {accepted: true, delivered: null, revision, completion};
      }
    } catch (error) {
      settle('error', error);
      return {accepted: true, delivered: false, error: String(error), revision};
    }
    settle('accepted');
    return {accepted: true, delivered: true, revision};
  }
  function setPercent(id, percent) {
    const refusal = refuse(id); if (refusal) return refusal;
    if (!validPercent(percent)) return {accepted: false, reason: 'invalid-percent'};
    const entry = state[id], muted = percent === 0;
    if (entry.percent === percent && entry.muted === muted) return {accepted: true, changed: false, revision};
    entry.percent = percent; entry.muted = muted; revision++;
    return {...apply(id), changed: true};
  }
  function setMuted(id, muted) {
    const refusal = refuse(id); if (refusal) return refusal;
    if (typeof muted !== 'boolean') return {accepted: false, reason: 'invalid-mute'};
    const entry = state[id];
    if (entry.muted === muted) return {accepted: true, changed: false, revision};
    if (muted) { entry.backupPercent = entry.percent; entry.percent = 0; }
    else entry.percent = entry.backupPercent;
    entry.muted = muted; revision++;
    return {...apply(id), changed: true};
  }
  function setSink(id, sink) {
    if (disposed) return {accepted: false, reason: 'disposed'};
    if (!Object.hasOwn(state, id)) return {accepted: false, reason: 'unknown-channel'};
    if (!validSink(sink)) return {accepted: false, reason: 'invalid-sink'};
    const entry = state[id];
    entry.token++; entry.sink = sink; entry.delivery = 'idle'; entry.error = null; revision++;
    if (sink !== null) return apply(id);
    return {accepted: true, delivered: false, revision, listenerErrors: notify()};
  }
  const settings = Object.freeze({get, snapshot, setPercent, setMuted, setSink, apply,
    reset(id) { return setPercent(id, AUDIO_DEFAULT_PERCENT[id]); },
    subscribe(listener) {
      if (typeof listener !== 'function') throw TypeError('Audio listener must be a function');
      if (disposed) return () => {};
      listeners.add(listener); return () => listeners.delete(listener);
    },
    // Caller-owned S5 persistence only. Mute backup deliberately never serialized.
    export() { return {version: 1, percentages: Object.fromEntries(CHANNELS.map(id => [id, state[id].percent]))}; },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const entry of Object.values(state)) { entry.token++; entry.sink = null; entry.delivery = 'idle'; entry.error = null; }
      revision++; notify(); listeners.clear();
    },
  });
  for (const id of CHANNELS) if (state[id].sink !== null) apply(id);
  return settings;
}

/** Optional existing #audio-volume is moved, used once, then restored on dispose.
 * Its oninput property is suspended during mounting to avoid the legacy second route.
 * Root must remove any separate addEventListener route before using this installer.
 */
export function installAudioSettings(host, {settings, volumeControl = null, document: doc = host.ownerDocument} = {}) {
  if (!settings || !doc) throw TypeError('Audio settings and document are required');
  if (volumeControl && mountedControls.has(volumeControl)) throw Error('Audio volume control is already mounted');
  const make = (tag, className = '', text = '') => {
    const node = doc.createElement(tag); node.className = className; node.textContent = text; return node;
  };
  const root = make('section', 's5-audio-settings'), title = make('h3', '', 'Audio');
  const rows = [], cleanups = [];
  let disposed = false;
  root.append(title); host.append(root);
  function sync() {
    if (disposed) return;
    for (const {id, slider, value, mute, reset, retry, status} of rows) {
      const entry = settings.get(id);
      slider.value = String(entry.percent); value.textContent = `${entry.percent} %`;
      slider.setAttribute('aria-valuetext', `${entry.percent} %`);
      slider.disabled = mute.disabled = !entry.available;
      mute.checked = entry.muted;
      reset.disabled = !entry.available || entry.percent === entry.defaultPercent && !entry.muted;
      retry.hidden = entry.delivery !== 'error'; retry.disabled = !entry.available;
      status.textContent = !entry.available ? id === 'sfx' ? 'Sound effects are unavailable.' : 'Music is unavailable.' :
        entry.delivery === 'error' ? 'The audio setting could not be applied. Try again.' :
        entry.delivery === 'pending' ? 'Applying setting…' : '';
    }
  }
  for (const id of CHANNELS) {
    const row = make('div', 's5-audio-settings-row'), label = make('label', 's5-audio-settings-volume');
    const slider = id === 'sfx' && volumeControl ? volumeControl : make('input');
    if (slider === volumeControl) {
      mountedControls.add(slider);
      const parent = slider.parentNode, next = slider.nextSibling, legacy = slider.oninput, oldDisabled = slider.disabled;
      const parentHidden = parent?.hidden, parentDisplay = parent?.style.display;
      if (parent?.tagName.toLowerCase() === 'label') { parent.hidden = true; parent.style.display = 'none'; }
      slider.oninput = null;
      cleanups.push(() => {
        mountedControls.delete(slider);
        if (parent) parent.insertBefore(slider, next?.parentNode === parent ? next : null);
        else slider.remove();
        if (parent?.tagName.toLowerCase() === 'label') { parent.hidden = parentHidden; parent.style.display = parentDisplay; }
        if (slider.oninput === null) slider.oninput = legacy;
        slider.disabled = oldDisabled;
      });
    }
    slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.step = '1';
    slider.setAttribute('aria-label', `Volume ${LABELS[id].toLowerCase()}`);
    const value = make('output'), muteLabel = make('label'), mute = make('input');
    mute.type = 'checkbox'; mute.setAttribute('aria-label', `Mute ${LABELS[id].toLowerCase()}`);
    const reset = make('button', '', 'Reset'), retry = make('button', '', 'Retry');
    reset.type = retry.type = 'button';
    reset.setAttribute('aria-label', `Default volume for ${LABELS[id].toLowerCase()}`);
    retry.setAttribute('aria-label', `Retry ${LABELS[id].toLowerCase()}`);
    const status = make('p', 's5-audio-settings-status');
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const onInput = () => { if (!disposed && !slider.disabled) settings.setPercent(id, Number(slider.value)); sync(); };
    const onMute = () => { if (!disposed && !mute.disabled) settings.setMuted(id, mute.checked); sync(); };
    slider.addEventListener('input', onInput); mute.addEventListener('change', onMute);
    reset.addEventListener('click', () => { if (!disposed && !reset.disabled) settings.reset(id); sync(); });
    retry.addEventListener('click', () => { if (!disposed && !retry.disabled) settings.apply(id); sync(); });
    cleanups.push(() => { slider.removeEventListener('input', onInput); mute.removeEventListener('change', onMute); });
    label.append(make('span', '', LABELS[id]), value, slider);
    muteLabel.append(mute, make('span', '', 'Mute'));
    row.append(label, muteLabel, reset, retry, status); root.append(row);
    rows.push({id, slider, value, mute, reset, retry, status});
  }
  const unsubscribe = settings.subscribe(sync); sync();
  return Object.freeze({sync, dispose() {
    if (disposed) return;
    disposed = true; unsubscribe();
    // Remove listeners before restoring the old volume control and its oninput.
    for (const cleanup of [...cleanups].reverse()) cleanup();
    root.remove();
  }});
}
