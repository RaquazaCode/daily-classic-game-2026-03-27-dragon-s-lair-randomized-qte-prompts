# Design

- Theme: arcade parchment + danger accents for a storybook dungeon feel.
- Core loop: spawn randomized QTE prompt -> accept/deny input -> update lives/streak/score -> repeat.
- Determinism: seeded LCG RNG drives prompt selection; `advanceTime` drives simulation in fixed steps.
- Accessibility: high-contrast prompt text and keyboard-only interaction.
