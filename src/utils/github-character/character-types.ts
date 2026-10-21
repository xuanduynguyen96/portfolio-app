// Plain-data outputs of the character classifier (no Astro types).
import type { DomainId } from '../../data/character-class-rules.ts';
import type { ClassId, JobId } from '../../data/character-job-rules.ts';
import type { GearSlotId } from '../../data/gear-rules.ts';

export type GearTier = 0 | 1 | 2 | 3;

/** One repo's contribution, e.g. `frontend 0.42` from `React, Astro` proven by a repo. */
export interface ClassSignal {
  repo: string;
  domain: DomainId;
  points: number;
  /** The skills the repo proves for this domain or job. */
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
  /** Also keys the job prop on the avatar. */
  jobId: JobId | null;
  jobName: string | null;
  scores: Record<DomainId, number>;
  /** Strongest domain; the class follows it. */
  primary: DomainId | null;
  /** Ranked evidence for the class domain: up to `signals.domain`. */
  signals: ClassSignal[];
  /** Ranked evidence for the job: up to `signals.job`. */
  jobSignals: ClassSignal[];
  gear: GearSlotResult[];
}
