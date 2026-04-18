# ⏳ Project: Eli's Warning Cinematic Visualizer
**Status:** Platinum Version (Stable)
**Last Updated:** April 18, 2026

## 🎯 Overview
A high-fidelity 2.5D sand simulation visualizer built for the "Eli's Warning" music video. The project uses p5.js with a multi-layered rendering pipeline to create a Gothic, atmospheric environmental experience.

## 🏗️ Technical Architecture
The visualizer uses four distinct `p5.Graphics` buffers to manage rendering order and masking:
1.  **sandGfx**: Handles the accumulation mound and falling particles.
2.  **topSandGfx**: Manages the "draining" sand slab in the top reservoir.
3.  **shadowGfx**: A dedicated buffer for generating projected shadows on the background.
4.  **maskGfx**: Uses a custom PNG mask to constrain the sand within the hourglass glass.

## 🧱 Core Systems
### 1. Sand Physics (Bottom)
*   **Dual-State Accumulation**: Uses a solid Bezier-curve mound (`currentPileHeight`) for bulk volume and individual `Sand` particles for motion.
*   **Lingering Grains**: When particles hit the mound, they have a 60% chance to become a `LingeringGrain`, which stays visible for ~5 seconds to create organic "side volume."
*   **Audio Reactivity**: Pile growth rate and particle spawn speed are linked to the **FFT Bass** analysis.

### 2. The "Living Fire" Engine (House 3)
*   **Chaotic Ignition**: Uses an interference pattern of two sine waves with prime-number frequencies (`0.0011` and `0.0007`) to create unpredictable, organic flares in three distinct zones.
*   **Soft Bloom**: Each light source is rendered using 20 layers of jittered, low-opacity ellipses with `blendMode(ADD)`, creating a misty, atmospheric glow.
*   **Transition Safety**: A master controller monitors the 25% phase swaps; fire automatically fades out between 18% and 21% of the cycle to prevent "floating flames" artifacts.

### 3. Camera & Depth
*   **2.5D Transform**: The camera smoothly zooms (up to 2.6x) and tilts based on the 4-phase house transitions.
*   **Projected Shadows**: The sand and hourglass are projected onto the house assets with a coordinate offset and shear, creating a sense of 3D depth within the glass.

## 📂 Repository & Backups
*   **GitHub**: [JaJaPain/Eli](https://github.com/JaJaPain/Eli)
*   **Checkpoints**: `sketch_checkpoint_v1.js` through `v6.js` contain major development milestones.

## 🚀 Future Roadmap
*   **Post-Processing**: Potential addition of a Global Film Grain or Chromatic Aberration shader.
*   **UI Expansion**: Refined "Start" screen with glassmorphic elements.
*   **Export Pipeline**: Configured for 1080p recording at 60FPS.
