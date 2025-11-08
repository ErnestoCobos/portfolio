// Configuration
const CANVAS_SIZE = 800;
const BG_COLOR = '#FF6B00';
const DOT_COLOR = 'rgba(255, 255, 255, 0.9)';
const DOT_RADIUS = 1.5;
const CUBE_SIZE = 200;
const NUM_DOTS_PER_EDGE = 14; // ~1200 dots total (14x14x6 faces = 1176)

// Animation timings
const ASSEMBLE_DURATION = 1500;
const EXPLOSION_DURATION = 1500;
const REASSEMBLE_DURATION = 1500;
const HOLD_DURATION = 1000;

// Initialize canvas
const canvas = document.getElementById('asciiCube');
const ctx = canvas.getContext('2d');

// Particle system
const particles = [];

// Rotation angles for isometric view
let rotateX = Math.PI / 6; // 30 degrees
let rotateY = Math.PI / 4; // 45 degrees

// Generate 3D cube coordinates with isometric projection
function generateCubeCoordinates() {
  const coords = [];
  const step = CUBE_SIZE / (NUM_DOTS_PER_EDGE - 1);
  const half = CUBE_SIZE / 2;

  // Generate points for all 6 faces of the cube
  for (let i = 0; i < NUM_DOTS_PER_EDGE; i++) {
    for (let j = 0; j < NUM_DOTS_PER_EDGE; j++) {
      const u = -half + i * step;
      const v = -half + j * step;

      // Front face (z = half)
      coords.push({ x: u, y: v, z: half });

      // Back face (z = -half)
      coords.push({ x: u, y: v, z: -half });

      // Left face (x = -half)
      coords.push({ x: -half, y: u, z: v });

      // Right face (x = half)
      coords.push({ x: half, y: u, z: v });

      // Top face (y = -half)
      coords.push({ x: u, y: -half, z: v });

      // Bottom face (y = half)
      coords.push({ x: u, y: half, z: v });
    }
  }

  return coords;
}

// Project 3D coordinates to 2D isometric view
function project3DTo2D(x, y, z, rotX, rotY) {
  // Rotate around Y axis
  let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
  let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);

  // Rotate around X axis
  let y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
  let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

  // Isometric projection (simple orthographic)
  return {
    x: CANVAS_SIZE / 2 + x1,
    y: CANVAS_SIZE / 2 + y1,
  };
}

// Initialize particles
function initializeParticles() {
  const cubeCoords = generateCubeCoordinates();

  cubeCoords.forEach(coord => {
    const projected = project3DTo2D(coord.x, coord.y, coord.z, rotateX, rotateY);

    // Start from random scattered positions
    const randomX = CANVAS_SIZE / 2 + (Math.random() - 0.5) * 600;
    const randomY = CANVAS_SIZE / 2 + (Math.random() - 0.5) * 600;

    particles.push({
      // Current position (starts random)
      currentX: randomX,
      currentY: randomY,

      // Target position (cube shape)
      targetX: projected.x,
      targetY: projected.y,

      // Original 3D coordinates
      x3d: coord.x,
      y3d: coord.y,
      z3d: coord.z,

      // Opacity
      opacity: 0,

      // Random delay for staggered animation
      delay: Math.random() * 200,
    });
  });
}

// Draw a single particle
function drawParticle(particle) {
  ctx.save();
  ctx.globalAlpha = particle.opacity;
  ctx.fillStyle = DOT_COLOR;
  ctx.beginPath();
  ctx.arc(particle.currentX, particle.currentY, DOT_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Clear and draw all particles
function render() {
  // Clear with orange background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Draw all particles
  particles.forEach(drawParticle);
}

// Update particle positions based on animation progress
function updateParticles() {
  particles.forEach(particle => {
    // Recalculate target position with current rotation
    const projected = project3DTo2D(particle.x3d, particle.y3d, particle.z3d, rotateX, rotateY);
    particle.targetX = projected.x;
    particle.targetY = projected.y;
  });
}

// Animation sequence
let currentPhase = 'assemble';
let animationTimeline;

function startAnimationLoop() {
  // Phase 1: Assemble
  animationTimeline = anime.timeline({
    easing: 'easeInOutQuad',
    update: render,
    complete: () => {
      // Restart the loop
      setTimeout(() => startAnimationLoop(), HOLD_DURATION);
    },
  });

  // Assemble phase: particles move to cube formation
  animationTimeline.add({
    targets: particles,
    currentX: particle => particle.targetX,
    currentY: particle => particle.targetY,
    opacity: 0.9,
    duration: ASSEMBLE_DURATION,
    delay: anime.stagger(2, { from: 'center' }),
    easing: 'easeInOutQuad',
  });

  // Hold phase (cube rotates slowly)
  animationTimeline.add({
    targets: { rotation: 0 },
    rotation: 1,
    duration: HOLD_DURATION,
    easing: 'linear',
    update: anim => {
      const progress = anim.progress / 100;
      rotateY += 0.01;
      rotateX += 0.005;
      updateParticles();
      render();
    },
  });

  // Explosion phase: particles disperse outward
  animationTimeline.add({
    targets: particles,
    currentX: particle => {
      return particle.targetX + (Math.random() - 0.5) * 600;
    },
    currentY: particle => {
      return particle.targetY + (Math.random() - 0.5) * 600;
    },
    opacity: 0,
    duration: EXPLOSION_DURATION,
    delay: anime.stagger(1, { from: 'center' }),
    easing: 'easeOutExpo',
  });

  // Reassemble phase: particles return to cube
  animationTimeline.add({
    targets: particles,
    currentX: particle => particle.targetX,
    currentY: particle => particle.targetY,
    opacity: 0.9,
    duration: REASSEMBLE_DURATION,
    delay: anime.stagger(2, { from: 'center' }),
    easing: 'easeInOutQuad',
  });
}

// Initialize and start animation
initializeParticles();
render(); // Initial render
startAnimationLoop();
