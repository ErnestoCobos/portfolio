# ASCII Cube Animation

A stunning canvas-based animation featuring a 3D isometric cube made of ~1200 white dots that continuously assembles, rotates, explodes, and reassembles.

## Features

- **Canvas-based rendering**: 800×800px canvas with smooth 60 FPS performance
- **1,176 particles**: Forming a 3D cube in isometric projection
- **Smooth animations**: Powered by Anime.js with proper easing functions
- **Four-phase loop**:
  1. **Assemble** (1.5s): Dots converge from random positions to form the cube
  2. **Hold & Rotate** (1s): Cube rotates slowly in 3D space
  3. **Explosion** (1.5s): Dots disperse randomly in all directions
  4. **Reassemble** (1.5s): Dots return to cube formation
- **Visual design**: Orange background (#FF6B00) with semi-transparent white dots

## Usage

Simply open `index.html` in a web browser. The animation will start automatically.

```bash
# Using a simple HTTP server (recommended)
python3 -m http.server 8080
# Then open http://localhost:8080/index.html

# Or just open the file directly
open index.html
```

## Technical Details

- **Dependencies**: Anime.js 3.2.1 (loaded via CDN with local fallback)
- **No build tools required**: Pure HTML, CSS, and JavaScript
- **Isometric projection**: Uses 3D rotation matrices for authentic perspective
- **Staggered animations**: Natural particle effects with varied delays

## Customization

Edit the constants in `main.js` to customize the animation:

```javascript
const CANVAS_SIZE = 800; // Canvas dimensions
const BG_COLOR = '#FF6B00'; // Background color
const DOT_COLOR = 'rgba(255, 255, 255, 0.9)'; // Dot color
const DOT_RADIUS = 1.5; // Dot size
const CUBE_SIZE = 200; // Cube dimensions
const NUM_DOTS_PER_EDGE = 14; // Density (14×14×6 = 1,176 dots)

// Animation timings
const ASSEMBLE_DURATION = 1500; // Assembly phase duration (ms)
const EXPLOSION_DURATION = 1500; // Explosion phase duration (ms)
const REASSEMBLE_DURATION = 1500; // Reassembly phase duration (ms)
const HOLD_DURATION = 1000; // Hold/rotation phase duration (ms)
```

## Browser Compatibility

Works in all modern browsers that support:

- HTML5 Canvas API
- ES6 JavaScript
- CSS3

## Performance

- Target: 60 FPS
- Memory efficient: Reuses particle objects
- Optimized rendering: Only clears and redraws when needed

## Files

- `index.html` - Main HTML file with canvas element
- `main.js` - Animation logic and particle system
- `anime.min.js` - Anime.js library (local fallback)
- `.gitignore` - Excludes node_modules if npm is used

## License

This animation is part of the portfolio project.
