// Plain-data outputs of the character classifier (no Astro types).
import type { ArchetypeId } from '../../data/character-class-rules.ts';
import type { ClassId } from '../../data/character-job-rules.ts';
import type { GearSlotId } from '../../data/gear-rules.ts';

export type GearTier = 0 | 1 | 2 | 3;

/** One repo's contribution to one archetype, e.g. `C# 100%` -> backend 0.62. */
export interface ClassSignal {
  repo: string;
  archetype: ArchetypeId;
  points: number;
  reason: string;
}

export interface GearSlotResult {
  slot: GearSlotId;
  axis: string;
  label: string;
  tier: GearTier;
  /** Public repos showing the signal, sorted by name. */
  repos: string[];
}

export interface CharacterProfile {
  classId: ClassId;
  className: string;
  jobId: string | null;
  jobName: string | null;
  /** Job prop on the avatar: secondary archetype, or the primary for a pure profile. */
  motif: ArchetypeId | null;
  scores: Record<ArchetypeId, number>;
  primary: ArchetypeId | null;
  secondary: ArchetypeId | null;
  /** Ranked evidence: up to 5 for the primary archetype, then up to 2 for the secondary. */
  signals: ClassSignal[];
  gear: GearSlotResult[];
}
