// Class + job names. Class = domain (backend, frontend, devops); job = the specialty the character's
// skills prove most within that class. Every domain skill belongs to exactly one job (unit-tested), so
// any domain vote can name a job. Each class has 3 jobs; the job id also keys its avatar prop (art is lazy).
import type { DomainId } from './character-class-rules.ts';

export const CLASS_IDS = ['warrior', 'archer', 'mage', 'adventurer'] as const;
export type ClassId = (typeof CLASS_IDS)[number];
export type CombatClassId = Exclude<ClassId, 'adventurer'>;

export const CLASS_BY_DOMAIN: Record<DomainId, CombatClassId> = {
  backend: 'warrior',
  frontend: 'archer',
  devops: 'mage',
};

export const CLASS_NAMES: Record<ClassId, string> = {
  warrior: 'Warrior',
  archer: 'Archer',
  mage: 'Mage',
  adventurer: 'Adventurer',
};

/** Every job id, class by class (3 each). Also the switcher radio value and the avatar prop key. */
export const JOB_IDS = ['knight', 'paladin', 'sentinel', 'ranger', 'skirmisher', 'herald', 'enchanter', 'summoner', 'seer'] as const;
export type JobId = (typeof JOB_IDS)[number];

/** What each domain means, shown in the "why" panel. */
export const DOMAIN_LABELS: Record<DomainId, string> = {
  backend: 'Backend',
  frontend: 'Frontend & mobile',
  devops: 'DevOps',
};

export interface JobDefinition {
  id: JobId;
  name: string;
  /** Skill ids that prove this job. */
  skills: readonly string[];
  /** Short label for the switcher hint. */
  specialty: string;
}

export const JOBS: Record<CombatClassId, readonly JobDefinition[]> = {
  warrior: [
    { id: 'knight', name: 'Knight', skills: ['csharp', 'dotnet'], specialty: '.NET / C#' },
    { id: 'paladin', name: 'Paladin', skills: ['java', 'spring'], specialty: 'Spring Boot / Java' },
    { id: 'sentinel', name: 'Sentinel', skills: ['web-servers'], specialty: 'Web servers & APIs' },
  ],
  archer: [
    { id: 'ranger', name: 'Ranger', skills: ['react', 'astro'], specialty: 'React & Astro' },
    { id: 'skirmisher', name: 'Skirmisher', skills: ['mobile'], specialty: 'Mobile (Xamarin)' },
    { id: 'herald', name: 'Herald', skills: ['web-sites', 'html', 'css'], specialty: 'Websites & markup' },
  ],
  mage: [
    { id: 'enchanter', name: 'Enchanter', skills: ['github-actions', 'jenkins'], specialty: 'CI/CD pipelines' },
    { id: 'summoner', name: 'Summoner', skills: ['docker'], specialty: 'Containers' },
    { id: 'seer', name: 'Seer', skills: ['playwright'], specialty: 'Test automation' },
  ],
};

/** Position of a job in its class (0-2), or -1 when the job is not one of the class's. */
export function jobSlot(classId: ClassId, jobId: JobId | null): number {
  return classId === 'adventurer' ? -1 : JOBS[classId].findIndex((job) => job.id === jobId);
}

/** The class's job at a slot; the first job for a slot it does not have. */
export function jobAtSlot(classId: CombatClassId, slot: number): JobId {
  return (JOBS[classId][slot] ?? JOBS[classId][0]).id;
}
