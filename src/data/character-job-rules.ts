// Class + job names. Class = domain (backend, frontend, devops); job = the specialty the character's
// skills prove most within that class. Every domain skill belongs to exactly one job (unit-tested), so
// any domain vote can name a job. Each class has 3 jobs; `motif` is the job's avatar prop.
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

/** Job props: one per job slot, so the 3 jobs of a class look different. */
export const MOTIF_IDS = ['banner', 'crystal', 'hawk'] as const;
export type MotifId = (typeof MOTIF_IDS)[number];

/** What each domain means, shown in the "why" panel. */
export const DOMAIN_LABELS: Record<DomainId, string> = {
  backend: 'Backend',
  frontend: 'Frontend & mobile',
  devops: 'DevOps',
};

export interface JobDefinition {
  id: string;
  name: string;
  motif: MotifId;
  /** Skill ids that prove this job. */
  skills: readonly string[];
  /** Short label for the switcher hint. */
  specialty: string;
}

export const JOBS: Record<CombatClassId, readonly JobDefinition[]> = {
  warrior: [
    { id: 'knight', name: 'Knight', motif: 'banner', skills: ['csharp', 'dotnet'], specialty: '.NET / C#' },
    { id: 'paladin', name: 'Paladin', motif: 'crystal', skills: ['java', 'spring'], specialty: 'Spring Boot / Java' },
    { id: 'sentinel', name: 'Sentinel', motif: 'hawk', skills: ['web-servers'], specialty: 'Web servers & APIs' },
  ],
  archer: [
    { id: 'ranger', name: 'Ranger', motif: 'banner', skills: ['react', 'astro'], specialty: 'React & Astro' },
    { id: 'skirmisher', name: 'Skirmisher', motif: 'crystal', skills: ['mobile'], specialty: 'Mobile (Xamarin)' },
    { id: 'herald', name: 'Herald', motif: 'hawk', skills: ['web-sites', 'html', 'css'], specialty: 'Websites & markup' },
  ],
  mage: [
    { id: 'enchanter', name: 'Enchanter', motif: 'banner', skills: ['github-actions', 'jenkins'], specialty: 'CI/CD pipelines' },
    { id: 'summoner', name: 'Summoner', motif: 'crystal', skills: ['docker'], specialty: 'Containers' },
    { id: 'seer', name: 'Seer', motif: 'hawk', skills: ['playwright'], specialty: 'Test automation' },
  ],
};
