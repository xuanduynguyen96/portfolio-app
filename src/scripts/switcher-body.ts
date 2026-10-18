// Builds the class/job radio groups the first time the switcher opens (keeps ~7 KB of markup out of
// the home HTML). DOM APIs only; every string comes from the class/job rules.
import { ARCHETYPE_IDS } from '../data/character-class-rules';
import { ARCHETYPE_LABELS, CLASS_IDS, CLASS_NAMES, JOBS } from '../data/character-job-rules';
import { sameLook, type ClassLook } from '../utils/avatar/class-looks';

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

/** One radio in a pixel-framed label; the native input covers the label (see class-job-switcher.astro). */
function option(name: string, value: string, label: string, isPick: boolean, hint?: string): HTMLLabelElement {
  const box = node('label', 'switcher-option pixel-frame');
  const input = node('input');
  Object.assign(input, { type: 'radio', name, value, autocomplete: 'off' });
  const text = node('span', 'switcher-text');
  text.append(node('span', 'switcher-label', label));
  if (hint) text.append(node('span', 'switcher-hint', hint));
  if (isPick) text.append(node('span', 'switcher-pick-tag hud-text', 'GitHub pick'));
  const marker = node('span', 'switcher-marker');
  marker.setAttribute('aria-hidden', 'true');
  box.append(input, marker, text);
  return box;
}

function group(legend: string, options: HTMLElement[]): HTMLFieldSetElement {
  const set = node('fieldset', 'switcher-group');
  const grid = node('div', 'switcher-options');
  grid.append(...options);
  set.append(node('legend', 'hud-text', legend), grid);
  return set;
}

export function buildSwitcherBody(pick: ClassLook): DocumentFragment {
  const body = document.createDocumentFragment();
  body.append(group('Class', CLASS_IDS.map((id) => option('switcher-class', id, CLASS_NAMES[id], id === pick.classId))));
  for (const classId of CLASS_IDS.filter((id) => id !== 'adventurer')) {
    const jobs = group('Job', ARCHETYPE_IDS.map((motif) =>
      option(`switcher-job-${classId}`, motif, JOBS[classId][motif].name, sameLook({ classId, motif }, pick), ARCHETYPE_LABELS[motif])));
    jobs.dataset.lookJobs = classId;
    jobs.hidden = true;
    body.append(jobs);
  }
  const note = node('p', 'switcher-note', 'Adventurer has no job: too little public signal for a focus.');
  note.dataset.lookJobs = 'adventurer';
  note.hidden = true;
  body.append(note);
  return body;
}
