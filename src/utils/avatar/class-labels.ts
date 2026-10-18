// Display strings for the class/job switcher. Titles come from characterTitle (single source).
import { characterTitle } from '../github-character/character-title.ts';
import { lookProfile, type ClassLook } from './class-looks.ts';

/** e.g. 'Mage · Sorcerer', 'Adventurer'. */
export function lookTitle(look: ClassLook): string {
  return characterTitle(lookProfile(look, []));
}

/** Control line naming the derived look, e.g. 'GitHub pick: Warrior · Vanguard'. */
export function suggestionLine(pickTitle: string): string {
  return `GitHub pick: ${pickTitle}`;
}

/** Polite live-region text after a switch. */
export function statusMessage(chosen: string, pick: string, isDefault: boolean): string {
  return isDefault ? `Showing the GitHub pick: ${chosen}.` : `Showing ${chosen}. Your GitHub pick is ${pick}.`;
}

export const SWITCH_FAILED_MESSAGE = "Couldn't switch class. Showing the GitHub pick.";
