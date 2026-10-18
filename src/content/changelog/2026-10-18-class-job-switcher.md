---
date: 2026-10-18T07:30:00Z
summary: Visitors can now pick any class and job for the avatar. The GitHub-derived pick stays the default, and gear still comes from GitHub stats.
---

The character sheet has a new "Choose class & job" control. It lets you display any of ten looks: Warrior, Mage or Archer with a Backend, Data or Frontend job, or Adventurer, which has no job. The hero and the character sheet avatar and name change together.

The look derived from public GitHub activity is still the default and is labelled "GitHub pick". "Reset to GitHub pick" brings it back. Gear is not part of the choice: armor, shield, boots and amulet tiers come from GitHub stats only and are drawn on every look.

What does not change yet: the attribute bars, the "Why" panel, `/speedrun/` and `/credits/` still show the GitHub-derived class. Your choice is saved in this browser only. Without JavaScript the control is hidden and the GitHub pick shows.

The page itself is still rendered with no JavaScript for the avatar. Switching uses a small script that loads the sprite code the first time you open the control, or on load if you saved a look. The home page grew by about 340 bytes compressed.
