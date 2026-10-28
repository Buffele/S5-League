export const S5_LOADING_LABELS = Object.freeze({
  initializing: 'Initializing',
  register_character_body: 'Loading characters',
  scene_share_anim: 'Loading animations',
  register_sounds: 'Loading audio',
  register_sequences: 'Preparing effects',
  register_interface: 'Preparing lobby',
  map: 'Loading map',
  avatar: 'Loading characters',
  effects: 'Preparing effects',
  shader: 'Preparing rendering',
  audio: 'Loading audio',
  equipment_library: 'Preparing weapons & skins',
});

export const S5_LOADING_ASSETS = Object.freeze({
  logo: 'league-logo-v1.png',
  background: 'arena-background-v1.png',
});

/** Counts describe completed work; elapsed time never advances this view. */
export function describeS5LoadingPhase(phase = {}) {
  if (typeof phase === 'string') phase = { id: phase };
  const id = String(phase.id || 'initializing');
  const label = String(phase.label || S5_LOADING_LABELS[id] || 'Preparing game');
  const { completed, total } = phase;
  const counted = Number.isSafeInteger(completed) && Number.isSafeInteger(total)
    && total > 0 && completed >= 0 && completed <= total;
  return Object.freeze({ id, label, detail: String(phase.detail || ''),
    completed: counted ? completed : null, total: counted ? total : null,
    countLabel: counted ? `${completed} / ${total}` : '' });
}

/** Import the stylesheet separately. The caller controls completion and recovery. */
export function mountS5LoadingView(host, { onRetry, assetBase = '/assets/s5/entry/' } = {}) {
  if (!host?.ownerDocument || typeof host.appendChild !== 'function') throw new TypeError('A DOM host is required');
  const doc = host.ownerDocument;
  const base = assetBase.endsWith('/') ? assetBase : `${assetBase}/`;
  let disposed = false;
  let generation = 0;
  let activeRetry = null;
  const element = (tag, className, parent) => {
    const node = doc.createElement(tag);
    node.className = className;
    parent?.appendChild(node);
    return node;
  };
  const root = element('section', 's5-loading-view', host);
  root.dataset.state = 'loading';
  root.setAttribute('aria-label', 'S5 League — preparing game');
  root.setAttribute('aria-busy', 'true');
  const background = element('img', 's5-loading-background', root);
  background.alt = '';
  background.src = `${base}${S5_LOADING_ASSETS.background}`;
  background.draggable = false;
  const stage = element('div', 's5-loading-stage', root);
  const logo = element('img', 's5-loading-logo', stage);
  logo.alt = 'S5 League';
  logo.draggable = false;
  logo.src = `${base}${S5_LOADING_ASSETS.logo}`;
  const status = element('div', 's5-loading-status', stage);
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  const label = element('div', 's5-loading-label', status);
  const detail = element('div', 's5-loading-detail', status);
  const counts = element('div', 's5-loading-counts', status);
  const meter = element('div', 's5-loading-progress', stage);
  meter.setAttribute('role','progressbar');meter.setAttribute('aria-label','Current loading phase');
  const spinner = element('div', 's5-loading-spinner', stage);
  spinner.setAttribute('aria-hidden', 'true');
  const retry = element('button', 's5-loading-retry', stage);
  retry.type = 'button';
  retry.textContent = 'Retry';
  retry.hidden = true;

  function updatePhase(phase) {
    if (disposed) return;
    const current = describeS5LoadingPhase(phase);
    root.hidden = false;
    root.dataset.state = 'loading';
    root.dataset.phase = current.id;
    root.setAttribute('aria-busy', 'true');
    label.textContent = current.label;
    detail.textContent = current.detail;
    counts.textContent = current.countLabel;
    meter.hidden=current.total===null;
    if(current.total!==null){meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax',String(current.total));meter.setAttribute('aria-valuenow',String(current.completed));meter.setAttribute('aria-valuetext',current.countLabel+' prepared');meter.style.setProperty('--s5-loading-progress',String(current.completed/current.total));}
    retry.hidden = true;
  }
  function error(reason) {
    if (disposed) return;
    generation++;
    root.hidden = false;
    root.dataset.state = 'error';
    root.setAttribute('aria-busy', 'false');
    label.textContent = 'Unable to prepare game';
    detail.textContent = reason instanceof Error ? reason.message : String(reason || 'Loading failed');
    counts.textContent = '';
    meter.hidden=true;
    retry.hidden = typeof onRetry !== 'function';
    activeRetry = null;
    if (!retry.hidden) retry.focus?.({ preventScroll: true });
  }
  async function retryClicked() {
    if (disposed || activeRetry !== null || root.dataset.state !== 'error' || typeof onRetry !== 'function') return;
    const attempt = ++generation;
    activeRetry = attempt;
    updatePhase('initializing');
    try {
      await onRetry();
    } catch (reason) {
      if (!disposed && attempt === generation) error(reason);
    } finally {
      if (activeRetry === attempt) activeRetry = null;
    }
  }
  retry.addEventListener('click', retryClicked);
  updatePhase('initializing');
  return {
    element: root,
    updatePhase,
    ready() {
      if (disposed) return;
      generation++;
      root.dataset.state = 'ready';
      root.setAttribute('aria-busy', 'false');
      root.hidden = true;
    },
    error,
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      retry.removeEventListener('click', retryClicked);
      root.remove();
    },
  };
}
