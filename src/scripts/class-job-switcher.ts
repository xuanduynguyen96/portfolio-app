// Class/job switcher (character sheet). The visitor may pick any class or job; GitHub only supplies
// the default ("GitHub pick") and the gear. This eager stub owns state, the saved choice and the
// controls; the sprite composer is a lazy chunk fetched on first open, or on load for a saved look.
import { buildSwitcherBody } from './switcher-body';
import { SWITCH_FAILED_MESSAGE, lookTitle, statusMessage } from '../utils/avatar/class-labels';
import { changeClass, changeJob, lookKey, parseClassId, parseJobId, parseLookKey, parseStoredLook, sameLook, type ClassLook } from '../utils/avatar/class-looks';

const STORAGE_KEY = 'portfolio-look';
const JOB_PREFIX = 'switcher-job-';

let controller: AbortController | null = null;
let renderer: Promise<typeof import('./look-apply-model')> | undefined;

// A failed dynamic import stays cached by the browser, so a retry cannot succeed: keep the rejected
// promise (later changes fail fast and revert) until the page is reloaded.
function loadRenderer() {
  return (renderer ??= import('./look-apply-model'));
}

function readSaved(pick: ClassLook): ClassLook | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = parseStoredLook(raw);
    if (raw !== null && (!saved || sameLook(saved, pick))) localStorage.removeItem(STORAGE_KEY);
    return saved && !sameLook(saved, pick) ? saved : null;
  } catch {
    return null; // storage blocked: the choice lasts for this page only
  }
}

function writeSaved(look: ClassLook, pick: ClassLook): void {
  try {
    if (sameLook(look, pick)) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, lookKey(look));
  } catch {
    /* storage blocked */
  }
}

function bind(): void {
  unbind();
  const root = document.querySelector<HTMLDetailsElement>('[data-look]');
  const pick = parseLookKey(root?.dataset.defaultLook);
  const status = root?.querySelector<HTMLElement>('[data-look-status]');
  const reset = root?.querySelector<HTMLButtonElement>('[data-look-reset]');
  if (!root || !pick || !status || !reset) return;

  controller = new AbortController();
  const { signal } = controller;
  const pickTitle = lookTitle(pick);
  const body = root.querySelector('[data-look-body]');
  let classRadios: HTMLInputElement[] = [];
  let jobRadios: HTMLInputElement[] = [];
  let jobGroups: HTMLElement[] = [];
  let look = readSaved(pick) ?? pick; // chosen look (controls)
  let applied = pick; // look currently drawn (server render = GitHub pick)
  let token = 0;

  const sync = () => {
    classRadios.forEach((radio) => (radio.checked = radio.value === look.classId));
    jobRadios.forEach((radio) => (radio.checked = radio.value === look.jobId));
    jobGroups.forEach((group) => (group.hidden = group.dataset.lookJobs !== look.classId));
    reset.disabled = sameLook(look, pick);
  };

  // The radio groups are built on first open (not server-rendered) to keep the home HTML small.
  function ensureBody() {
    if (!body || body.childElementCount) return;
    body.append(buildSwitcherBody(pick!));
    classRadios = [...root!.querySelectorAll<HTMLInputElement>('input[name="switcher-class"]')];
    jobRadios = [...root!.querySelectorAll<HTMLInputElement>(`input[name^="${JOB_PREFIX}"]`)];
    jobGroups = [...root!.querySelectorAll<HTMLElement>('[data-look-jobs]')];
    sync();
  }

  async function show(next: ClassLook, quiet = false): Promise<void> {
    const mine = ++token;
    look = next;
    sync();
    try {
      const { renderLook } = await loadRenderer();
      if (signal.aborted || mine !== token) return;
      renderLook(lookKey(next), root!.dataset.gear ?? '');
      applied = next;
      writeSaved(next, pick!);
      if (!quiet) status!.textContent = statusMessage(lookTitle(next), pickTitle, sameLook(next, pick!));
    } catch (error) {
      if (signal.aborted || mine !== token) return;
      console.warn('class-job-switcher: could not switch look', error);
      look = applied;
      sync();
      status!.textContent = sameLook(applied, pick!) ? SWITCH_FAILED_MESSAGE : `Couldn't switch class. Showing ${lookTitle(applied)}.`;
    }
  }

  root.addEventListener('toggle', () => {
    if (!root.open) return;
    ensureBody();
    void loadRenderer().catch(() => {});
  }, { signal });
  root.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    if (input.name === 'switcher-class') {
      const classId = parseClassId(input.value);
      if (classId) void show(changeClass(look, classId, pick));
    } else if (input.name === `${JOB_PREFIX}${look.classId}`) {
      const jobId = parseJobId(input.value);
      if (jobId) void show(changeJob(look, jobId));
    }
  }, { signal });
  reset.addEventListener('click', () => {
    void show(pick);
    classRadios.find((radio) => radio.value === pick.classId)?.focus();
  }, { signal });

  sync();
  root.dataset.ready = '';
  if (!sameLook(look, pick)) void show(look, true);
}

function unbind(): void {
  controller?.abort();
  controller = null;
}

// ClientRouter replaces the DOM: bind on each page load, clean up before leaving.
document.addEventListener('astro:page-load', bind);
document.addEventListener('astro:before-swap', unbind);
