// Single source of truth for personal info + SEO defaults.
// TODO(content): replace placeholder values with real details.
import { GITHUB_PROFILE_URL } from './github/github-login';
import type { AvailabilityStatus } from './xp-rules';

export interface SocialLink {
  label: string;
  href: string;
}

export interface Availability {
  status: AvailabilityStatus;
  /** Shown in the hero eyebrow and on /speedrun/. */
  note: string;
}

export interface SiteConfig {
  name: string;
  role: string;
  tagline: string;
  bio: string[];
  location: string;
  email: string;
  socials: SocialLink[];
  availability: Availability;
  seo: {
    title: string;
    description: string;
  };
}

export const siteConfig: SiteConfig = {
  name: 'Xuan Duy Nguyen',
  role: 'Software Engineer',
  tagline: 'I build fast, accessible interfaces with a taste for motion and the future.',
  bio: [
    'I am a software engineer who enjoys turning complex problems into clean, performant products. I care about the details: typography, motion, accessibility and the milliseconds in between.',
    'Lately I have been exploring animation systems, design tokens and static-first architectures that ship less JavaScript and load instantly.',
  ],
  location: 'Remote',
  email: 'hello@example.com',
  socials: [{ label: 'GitHub', href: GITHUB_PROFILE_URL }],
  availability: { status: 'open', note: 'Available for new projects' },
  seo: {
    title: 'Xuan Duy Nguyen | Software Engineer',
    description:
      'Portfolio of Xuan Duy Nguyen: software engineer building fast, accessible and animated web experiences.',
  },
};
