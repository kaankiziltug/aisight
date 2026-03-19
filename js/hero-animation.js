// ============================================
// Interactive Hero Canvas Animation
// Neural network / particle mesh effect
// ============================================

(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, particles, mouse, animId;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // Configuration
  const CONFIG = {
    particleCount: 100,
    connectionDistance: 180,
    mouseRadius: 250,
    particleSpeed: 0.4,
    colors: {
      particle: [124, 58, 237],    // purple
      particleAlt: [59, 130, 246], // blue
      connection: [124, 58, 237],  // purple
      mouseGlow: [167, 139, 250],  // light purple
    },
    minSize: 1.5,
    maxSize: 3.5,
  };

  mouse = { x: -1000, y: -1000, active: false };

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * CONFIG.particleSpeed * 2;
      this.vy = (Math.random() - 0.5) * CONFIG.particleSpeed * 2;
      this.size = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
      this.baseSize = this.size;
      this.useAlt = Math.random() > 0.6;
      this.opacity = 0.4 + Math.random() * 0.5;
      this.pulseOffset = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.01 + Math.random() * 0.02;
    }

    update(time) {
      // Move
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges (soft)
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Clamp
      this.x = Math.max(0, Math.min(width, this.x));
      this.y = Math.max(0, Math.min(height, this.y));

      // Pulse size
      this.size = this.baseSize + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.5;

      // Mouse interaction — attract gently
      if (mouse.active) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.mouseRadius) {
          const force = (1 - dist / CONFIG.mouseRadius) * 0.02;
          this.vx += dx * force;
          this.vy += dy * force;
        }
      }

      // Dampen velocity
      this.vx *= 0.99;
      this.vy *= 0.99;

      // Ensure minimum speed
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed < CONFIG.particleSpeed * 0.3) {
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;
      }
    }

    draw() {
      const c = this.useAlt ? CONFIG.colors.particleAlt : CONFIG.colors.particle;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${this.opacity})`;
      ctx.fill();
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectionDistance) {
          const opacity = (1 - dist / CONFIG.connectionDistance) * 0.25;
          const c = CONFIG.colors.connection;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function drawMouseGlow() {
    if (!mouse.active) return;
    const c = CONFIG.colors.mouseGlow;
    const gradient = ctx.createRadialGradient(
      mouse.x, mouse.y, 0,
      mouse.x, mouse.y, CONFIG.mouseRadius
    );
    gradient.addColorStop(0, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.08)`);
    gradient.addColorStop(1, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(mouse.x - CONFIG.mouseRadius, mouse.y - CONFIG.mouseRadius,
      CONFIG.mouseRadius * 2, CONFIG.mouseRadius * 2);

    // Draw mouse connections to nearby particles
    for (const p of particles) {
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.mouseRadius) {
        const opacity = (1 - dist / CONFIG.mouseRadius) * 0.3;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${opacity})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Adjust particle count based on screen size
    const targetCount = Math.max(30, Math.min(CONFIG.particleCount, Math.floor(width * height / 12000)));
    if (!particles) {
      particles = Array.from({ length: targetCount }, () => new Particle());
    }
  }

  let time = 0;
  function animate() {
    time++;
    ctx.clearRect(0, 0, width, height);

    // Update & draw
    for (const p of particles) {
      p.update(time);
    }

    drawConnections();
    drawMouseGlow();

    for (const p of particles) {
      p.draw();
    }

    animId = requestAnimationFrame(animate);
  }

  // Events
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  // Touch support
  canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouse.x = touch.clientX - rect.left;
    mouse.y = touch.clientY - rect.top;
    mouse.active = true;
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    mouse.active = false;
  });

  window.addEventListener('resize', () => {
    resize();
  });

  // Pause when not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      animate();
    }
  });

  // Init
  resize();
  animate();
})();
