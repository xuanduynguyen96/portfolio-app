// Which class x job looks exist and how a visitor moves between them. Pure: no DOM, no clock.
// A look is class + job motif (the job is JOBS[class][motif]); Adventurer has no job. Gear is never
// part of a look: tiers come from the GitHub stats and are passed through unchanged.
import { ARCHETYPE_IDS, type ArchetypeId } from '../../data/character-class-rules.ts';
import { CLASS_IDS, CLASS_NAMES, JOBS, type ClassId } from '../../data/character-job-rules.ts';
import type { AvatarProfile } from './avatar-description.ts';

export interface ClassLook {
  classId: ClassId;
  motif: ArchetypeId | null;
}

/** Jobs a class can take (Adventurer has none). */
export function motifsFor(classId: ClassId): readonly ArchetypeId[] {
  return classId === 'adventurer' ? [] : ARCHETYPE_IDS;
}

export function isValidLook({ classId, motif }: ClassLook): boolean {
  if (classId === 'adventurer') return motif === null;
  return motif !== null && ARCHETYPE_IDS.includes(motif);
}

/** Every valid look: 3 combat classes x 3 jobs, then Adventurer. */
export function allClassLooks(): ClassLook[] {
  return CLASS_IDS.flatMap((classId) =>
    classId === 'adventurer'
      ? [{ classId, motif: null }]
      : ARCHETYPE_IDS.map((motif): ClassLook => ({ classId, motif })));
}

/** Stable id, e.g. 'mage/data' or 'adventurer'; also the saved value. */
export function lookKey({ classId, motif }: ClassLook): string {
  return motif ? `${classId}/${motif}` : classId;
}

export function parseClassId(value: unknown): ClassId | null {
  return CLASS_IDS.find((id) => id === value) ?? null;
}

export function parseMotif(value: unknown): ArchetypeId | null {
  return ARCHETYPE_IDS.find((id) => id === value) ?? null;
}

/** Validates DOM or storage supplied text; anything not exactly one of the 10 keys is null. */
export function parseLookKey(key: unknown): ClassLook | null {
  if (typeof key !== 'string') return null;
  const [classPart, motifPart, ...rest] = key.split('/');
  if (rest.length) return null;
  const classId = parseClassId(classPart);
  if (!classId) return null;
  const motif = motifPart === undefined ? null : parseMotif(motifPart);
  const look: ClassLook = { classId, motif };
  return isValidLook(look) && lookKey(look) === key ? look : null;
}

/** Saved choice read from storage (raw may be anything). */
export const parseStoredLook = parseLookKey;

/** The look the GitHub stats derive: default and reset target. */
export function defaultLook({ classId, motif }: Pick<AvatarProfile, 'classId' | 'motif'>): ClassLook {
  return { classId, motif: classId === 'adventurer' ? null : motif };
}

export function sameLook(a: ClassLook, b: ClassLook): boolean {
  return a.classId === b.classId && a.motif === b.motif;
}

/** Pick a class: keep the current job when the new class has jobs, else the GitHub pick's, else the first. */
export function changeClass(current: ClassLook, classId: ClassId, pick: ClassLook): ClassLook {
  if (classId === 'adventurer') return { classId, motif: null };
  return { classId, motif: current.motif ?? pick.motif ?? ARCHETYPE_IDS[0] };
}

/** Pick a job; ignored for Adventurer (no jobs). */
export function changeMotif(current: ClassLook, motif: ArchetypeId): ClassLook {
  return current.classId === 'adventurer' || !ARCHETYPE_IDS.includes(motif) ? current : { ...current, motif };
}

/** Names from the rules, gear untouched: the avatar input for a chosen look. */
export function lookProfile(look: ClassLook, gear: AvatarProfile['gear']): AvatarProfile {
  const { classId, motif } = look;
  const job = classId !== 'adventurer' && motif ? JOBS[classId][motif] : null;
  return { classId, className: CLASS_NAMES[classId], jobName: job?.name ?? null, motif, gear };
}
