// Third-party (and own) assets credited on /credits/. Author + license strings are copied from each
// package's LICENSE / package.json in node_modules; re-check them when a dependency is upgraded.

export interface CreditEntry {
  name: string;
  author: string;
  license: string;
  licenseUrl?: string;
  url?: string;
  note?: string;
}

export interface CreditGroup {
  id: string;
  title: string;
  entries: CreditEntry[];
}

const OFL_URL = 'https://openfontlicense.org/open-font-license-official-text/';

export const creditGroups: CreditGroup[] = [
  {
    id: 'fonts',
    title: 'Fonts',
    entries: [
      {
        name: 'MedievalSharp',
        author: "Wojciech 'wmk69' Kalinowski",
        license: 'SIL Open Font License 1.1',
        licenseUrl: OFL_URL,
        url: 'https://fontsource.org/fonts/medievalsharp',
        note: 'Headings. Self-hosted via Fontsource.',
      },
      {
        name: 'Pixelify Sans',
        author: 'The Pixelify Sans Project Authors',
        license: 'SIL Open Font License 1.1',
        licenseUrl: OFL_URL,
        url: 'https://github.com/eifetx/Pixelify-Sans',
        note: 'HUD labels. Self-hosted via Fontsource.',
      },
      {
        name: 'Space Grotesk',
        author: 'The Space Grotesk Project Authors',
        license: 'SIL Open Font License 1.1',
        licenseUrl: OFL_URL,
        url: 'https://github.com/floriankarsten/space-grotesk',
        note: 'Body text. Self-hosted via Fontsource.',
      },
    ],
  },
  {
    id: 'icons',
    title: 'Icons',
    entries: [
      {
        name: 'Pixel icon set (8x8)',
        author: 'Drawn for this site',
        license: 'Own work',
        note: 'Hand-authored as 8x8 grids and rendered as inline SVG. Full set below.',
      },
    ],
  },
  {
    id: 'libraries',
    title: 'Libraries',
    entries: [
      {
        name: 'Astro',
        author: 'Fred K. Schott and the Astro contributors',
        license: 'MIT',
        licenseUrl: 'https://github.com/withastro/astro/blob/main/LICENSE',
        url: 'https://astro.build',
      },
      {
        name: 'GSAP',
        author: 'GreenSock (Webflow)',
        license: 'Standard "no charge" license',
        licenseUrl: 'https://gsap.com/standard-license',
        url: 'https://gsap.com',
      },
      {
        name: 'Fontsource',
        author: 'The Fontsource contributors',
        license: 'MIT (packaging; fonts keep their own licenses)',
        licenseUrl: 'https://github.com/fontsource/fontsource/blob/main/LICENSE',
        url: 'https://fontsource.org',
      },
    ],
  },
];
