// "Warrior · Vanguard" (class only for an Adventurer): the one place the display title is built.
import type { CharacterProfile } from './character-types.ts';

export function characterTitle(character: Pick<CharacterProfile, 'className' | 'jobName'>): string {
  return character.jobName ? `${character.className} · ${character.jobName}` : character.className;
}
