import type { EvidenceType } from '../../data/xp-rules.ts';
import type { Evidence } from './career-types.ts';

/** First evidence URL of a type (e.g. the "View code" / "Live demo" buttons), or undefined. */
export function getEvidenceLink(evidence: readonly Evidence[], type: EvidenceType): string | undefined {
  return evidence.find((item) => item.type === type)?.url;
}
