// Class + job names. Class = primary archetype; job = class x motif (secondary archetype, or the
// primary itself when the profile is "pure"). 3 motif props cover all 9 jobs in the avatar art.
import type { ArchetypeId } from './character-class-rules.ts';

export const CLASS_IDS = ['warrior', 'mage', 'archer', 'adventurer'] as const;
export type ClassId = (typeof CLASS_IDS)[number];
export type CombatClassId = Exclude<ClassId, 'adventurer'>;

export const CLASS_BY_ARCHETYPE: Record<ArchetypeId, CombatClassId> = {
  backend: 'warrior',
  data: 'mage',
  frontend: 'archer',
};

export const CLASS_NAMES: Record<ClassId, string> = {
  warrior: 'Warrior',
  mage: 'Mage',
  archer: 'Archer',
  adventurer: 'Adventurer',
};

/** What each archetype means, shown in the "why" panel. */
export const ARCHETYPE_LABELS: Record<ArchetypeId, string> = {
  backend: 'Backend',
  data: 'Data & AI',
  frontend: 'Frontend & mobile',
};

export interface JobDefinition {
  id: string;
  name: string;
}

export const JOBS: Record<CombatClassId, Record<ArchetypeId, JobDefinition>> = {
  warrior: {
    backend: { id: 'knight', name: 'Knight' },
    data: { id: 'spellblade', name: 'Spellblade' },
    frontend: { id: 'vanguard', name: 'Vanguard' },
  },
  mage: {
    backend: { id: 'battlemage', name: 'Battlemage' },
    data: { id: 'sorcerer', name: 'Sorcerer' },
    frontend: { id: 'druid', name: 'Druid' },
  },
  archer: {
    backend: { id: 'warden', name: 'Warden' },
    data: { id: 'arcane-archer', name: 'Arcane Archer' },
    frontend: { id: 'ranger', name: 'Ranger' },
  },
};
