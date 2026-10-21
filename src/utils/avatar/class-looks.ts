// Which class x job looks exist and how a visitor moves between them. Pure: no DOM, no clock.
// A look is class + one of that class's jobs (the job id keys its prop); Adventurer has no job. Gear is
// never part of a look: tiers come from the GitHub stats and are passed through unchanged.
import { CLASS_IDS, CLASS_NAMES, JOB_IDS, JOBS, jobAtSlot, jobSlot, type ClassId, type JobId } from '../../data/character-job-rules.ts';
import type { AvatarProfile } from './avatar-description.ts';

export interface ClassLook {
  classId: ClassId;
  jobId: JobId | null;
}

/** Jobs a class can take (Adventurer has none). */
export function jobsFor(classId: ClassId): readonly JobId[] {
  return classId === 'adventurer' ? [] : JOBS[classId].map((job) => job.id);
}

export function isValidLook({ classId, jobId }: ClassLook): boolean {
  if (classId === 'adventurer') return jobId === null;
  return jobId !== null && jobSlot(classId, jobId) >= 0;
}

/** Every valid look: 3 combat classes x their 3 jobs, then Adventurer. */
export function allClassLooks(): ClassLook[] {
  return CLASS_IDS.flatMap((classId) =>
    classId === 'adventurer'
      ? [{ classId, jobId: null }]
      : jobsFor(classId).map((jobId): ClassLook => ({ classId, jobId })));
}

/** Stable id, e.g. 'mage/seer' or 'adventurer'; also the saved value. */
export function lookKey({ classId, jobId }: ClassLook): string {
  return jobId ? `${classId}/${jobId}` : classId;
}

export function parseClassId(value: unknown): ClassId | null {
  return CLASS_IDS.find((id) => id === value) ?? null;
}

export function parseJobId(value: unknown): JobId | null {
  return JOB_IDS.find((id) => id === value) ?? null;
}

/** Validates DOM or storage supplied text; anything not exactly one of the 10 keys is null. */
export function parseLookKey(key: unknown): ClassLook | null {
  if (typeof key !== 'string') return null;
  const [classPart, jobPart, ...rest] = key.split('/');
  if (rest.length) return null;
  const classId = parseClassId(classPart);
  if (!classId) return null;
  const jobId = jobPart === undefined ? null : parseJobId(jobPart);
  const look: ClassLook = { classId, jobId };
  return isValidLook(look) && lookKey(look) === key ? look : null;
}

/** Saved choice read from storage (raw may be anything). */
export const parseStoredLook = parseLookKey;

/** The look the GitHub stats derive: default and reset target. */
export function defaultLook({ classId, jobId }: Pick<AvatarProfile, 'classId' | 'jobId'>): ClassLook {
  return { classId, jobId: classId === 'adventurer' ? null : jobId };
}

export function sameLook(a: ClassLook, b: ClassLook): boolean {
  return a.classId === b.classId && a.jobId === b.jobId;
}

/** Pick a class: keep the current job slot when the new class has jobs, else the GitHub pick's, else the first. */
export function changeClass(current: ClassLook, classId: ClassId, pick: ClassLook): ClassLook {
  if (classId === 'adventurer') return { classId, jobId: null };
  const slot = [jobSlot(current.classId, current.jobId), jobSlot(pick.classId, pick.jobId)].find((s) => s >= 0) ?? 0;
  return { classId, jobId: jobAtSlot(classId, slot) };
}

/** Pick a job; ignored for Adventurer and for a job of another class. */
export function changeJob(current: ClassLook, jobId: JobId): ClassLook {
  return jobSlot(current.classId, jobId) < 0 ? current : { ...current, jobId };
}

/** Names from the rules, gear untouched: the avatar input for a chosen look. */
export function lookProfile(look: ClassLook, gear: AvatarProfile['gear']): AvatarProfile {
  const { classId, jobId } = look;
  const job = classId !== 'adventurer' ? JOBS[classId].find((entry) => entry.id === jobId) : undefined;
  return { classId, className: CLASS_NAMES[classId], jobName: job?.name ?? null, jobId: job?.id ?? null, gear };
}
