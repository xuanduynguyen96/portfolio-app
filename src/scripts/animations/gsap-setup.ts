// Register GSAP plugins once; every animation module imports from here.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Motion travel unit in px: distances are multiples of the 8x8 pixel-art grid. */
export const PIXEL_STEP = 8;

export { gsap, ScrollTrigger, SplitText };
