import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  isDark?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  targetAlpha: number;
  type: 'calorie' | 'water' | 'protein' | 'vitality';
  pulseSpeed: number;
  pulseOffset: number;
}

interface MetabolicRing {
  xPct: number;
  yPct: number;
  radius: number;
  maxRadius: number;
  baseAlpha: number;
  speed: number;
  type: 'calorie' | 'water' | 'vitality';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ isDark = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const themeProgressRef = useRef<number>(isDark ? 1 : 0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseTargetRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const setupCanvasSize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    setupCanvasSize();
    window.addEventListener('resize', setupCanvasSize);

    // Particle Palette
    const colorMap = {
      dark: {
        calorie: [245, 158, 11], // Amber
        water: [6, 182, 212],    // Cyan
        protein: [239, 68, 68],  // Coral/Red
        vitality: [16, 185, 129],// Emerald
        wave1: [245, 158, 11],
        wave2: [6, 182, 212],
        wave3: [99, 102, 241],
        filament: [255, 255, 255],
        orbit: [255, 255, 255],
      },
      light: {
        calorie: [217, 119, 6],
        water: [14, 165, 233],
        protein: [225, 29, 72],
        vitality: [5, 150, 105],
        wave1: [245, 158, 11],
        wave2: [14, 165, 233],
        wave3: [99, 102, 241],
        filament: [15, 23, 42],
        orbit: [0, 0, 0],
      },
    };

    // Helper for smooth color interpolation between Dark and Light mode
    const interpolateColor = (
      type: keyof typeof colorMap.dark,
      alpha: number,
      t: number
    ): string => {
      const cDark = colorMap.dark[type];
      const cLight = colorMap.light[type];
      const r = Math.round(cLight[0] + (cDark[0] - cLight[0]) * t);
      const g = Math.round(cLight[1] + (cDark[1] - cLight[1]) * t);
      const b = Math.round(cLight[2] + (cDark[2] - cLight[2]) * t);
      return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(4)})`;
    };

    // Initialize Particles with smooth distribution
    const particleCount = Math.min(Math.floor((width * height) / 36000), 28);
    const particleTypes: ('calorie' | 'water' | 'protein' | 'vitality')[] = [
      'calorie',
      'water',
      'protein',
      'vitality',
    ];

    const particles: Particle[] = Array.from({ length: particleCount }).map(() => {
      const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
      const baseRadius = Math.random() * 2.2 + 1.2;
      const initialAlpha = Math.random() * 0.35 + 0.2;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.3 - 0.1, // Smooth upward metabolic drift
        radius: baseRadius,
        baseRadius,
        alpha: initialAlpha,
        targetAlpha: initialAlpha,
        type,
        pulseSpeed: Math.random() * 0.015 + 0.008,
        pulseOffset: Math.random() * Math.PI * 2,
      };
    });

    // Expanding Metabolic Vitality Rings
    const rings: MetabolicRing[] = [
      {
        xPct: 0.22,
        yPct: 0.38,
        radius: 25,
        maxRadius: 170,
        baseAlpha: 0.16,
        speed: 0.28,
        type: 'calorie',
      },
      {
        xPct: 0.8,
        yPct: 0.62,
        radius: 50,
        maxRadius: 210,
        baseAlpha: 0.14,
        speed: 0.24,
        type: 'water',
      },
      {
        xPct: 0.5,
        yPct: 0.88,
        radius: 15,
        maxRadius: 150,
        baseAlpha: 0.12,
        speed: 0.22,
        type: 'vitality',
      },
    ];

    let lastTime = performance.now();
    let totalTime = 0;

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      totalTime += dt * 0.85;

      // Smooth Theme Transition Interpolation (ease towards target mode)
      const targetThemeProgress = isDark ? 1 : 0;
      themeProgressRef.current +=
        (targetThemeProgress - themeProgressRef.current) * Math.min(dt * 4, 0.2);
      const tProgress = themeProgressRef.current;

      // Ultra-smooth critically damped mouse parallax
      currentMouseRef.current.x +=
        (mouseTargetRef.current.x - currentMouseRef.current.x) * Math.min(dt * 2.5, 0.1);
      currentMouseRef.current.y +=
        (mouseTargetRef.current.y - currentMouseRef.current.y) * Math.min(dt * 2.5, 0.1);

      const mouseShiftX = currentMouseRef.current.x * 22;
      const mouseShiftY = currentMouseRef.current.y * 18;

      ctx.clearRect(0, 0, width, height);

      // =========================================================================
      // 1. SILK-SMOOTH SINE WAVES WITH BEZIER CURVES (Metabolism & Circadian)
      // =========================================================================
      const drawSmoothSineWave = (
        yBase: number,
        amplitude: number,
        frequency: number,
        speed: number,
        waveType: 'wave1' | 'wave2' | 'wave3',
        fillAlpha: number,
        strokeAlpha: number,
        phase: number
      ) => {
        const points: { x: number; y: number }[] = [];
        const step = Math.max(16, Math.floor(width / 50));

        for (let x = -step; x <= width + step * 2; x += step) {
          const dx = x + mouseShiftX * 0.4;
          const y =
            yBase +
            Math.sin(dx * frequency + totalTime * speed + phase) * amplitude +
            Math.cos(dx * frequency * 0.55 + totalTime * (speed * 0.5)) * (amplitude * 0.4);
          points.push({ x, y });
        }

        if (points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        // Smooth Quadratic Bezier interpolation across points
        for (let i = 0; i < points.length - 1; i++) {
          const curr = points[i];
          const next = points[i + 1];
          const midX = (curr.x + next.x) * 0.5;
          const midY = (curr.y + next.y) * 0.5;
          ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
        }

        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.lineTo(width + step, height + 20);
        ctx.lineTo(-step, height + 20);
        ctx.closePath();

        ctx.fillStyle = interpolateColor(waveType, fillAlpha, tProgress);
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
          const curr = points[i];
          const next = points[i + 1];
          const midX = (curr.x + next.x) * 0.5;
          const midY = (curr.y + next.y) * 0.5;
          ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
        }
        ctx.strokeStyle = interpolateColor(waveType, strokeAlpha, tProgress);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      };

      // Wave 1: Deep Basal Metabolism Wave (Warm Amber)
      drawSmoothSineWave(
        height * 0.74 + mouseShiftY * 0.6,
        42,
        0.0016,
        0.75,
        'wave1',
        0.022 + (1 - tProgress) * 0.008,
        0.09 + (1 - tProgress) * 0.04,
        0
      );

      // Wave 2: Hydration & Vitality Wave (Cyan)
      drawSmoothSineWave(
        height * 0.83 + mouseShiftY * 0.4,
        34,
        0.002,
        -0.65,
        'wave2',
        0.018 + (1 - tProgress) * 0.007,
        0.08 + (1 - tProgress) * 0.03,
        Math.PI * 0.35
      );

      // Wave 3: Circadian Balance Wave (Indigo/Purple)
      drawSmoothSineWave(
        height * 0.64 + mouseShiftY * 0.25,
        46,
        0.0013,
        0.48,
        'wave3',
        0.015 + (1 - tProgress) * 0.006,
        0.07 + (1 - tProgress) * 0.03,
        Math.PI * 0.75
      );

      // =========================================================================
      // 2. EXPANDING METABOLIC RINGS (Vitality Activity Pulse)
      // =========================================================================
      rings.forEach((ring) => {
        ring.radius += ring.speed * 60 * dt;
        const progress = ring.radius / ring.maxRadius;
        const currentAlpha = ring.baseAlpha * (1 - progress);

        if (ring.radius >= ring.maxRadius) {
          ring.radius = 12;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(
          width * ring.xPct + mouseShiftX * 0.35,
          height * ring.yPct + mouseShiftY * 0.35,
          ring.radius,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = interpolateColor(ring.type, currentAlpha, tProgress);
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 7]);
        ctx.stroke();
        ctx.restore();
      });

      // =========================================================================
      // 3. CIRCADIAN 24-HOUR CLOCK ORBIT RING (Celestial Solar & Lunar Nodes)
      // =========================================================================
      const centerX = width * 0.5 + mouseShiftX * 0.5;
      const centerY = height * 0.46 + mouseShiftY * 0.5;
      const orbitRadius = Math.min(width, height) * 0.36;

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
      ctx.strokeStyle = interpolateColor('orbit', 0.03, tProgress);
      ctx.lineWidth = 1.1;
      ctx.setLineDash([3, 12]);
      ctx.stroke();

      // Rotating Solar & Lunar Circadian Nodes
      const orbitAngle1 = totalTime * 0.1;
      const orbX1 = centerX + Math.cos(orbitAngle1) * orbitRadius;
      const orbY1 = centerY + Math.sin(orbitAngle1) * orbitRadius;

      // Glow Sun / Active Metabolic Node (Amber)
      const gradSun = ctx.createRadialGradient(orbX1, orbY1, 0, orbX1, orbY1, 16);
      gradSun.addColorStop(0, interpolateColor('calorie', 0.75, tProgress));
      gradSun.addColorStop(1, interpolateColor('calorie', 0, tProgress));
      ctx.fillStyle = gradSun;
      ctx.beginPath();
      ctx.arc(orbX1, orbY1, 16, 0, Math.PI * 2);
      ctx.fill();

      // Recovery / Moon Node (Indigo/Purple)
      const orbitAngle2 = orbitAngle1 + Math.PI;
      const orbX2 = centerX + Math.cos(orbitAngle2) * orbitRadius;
      const orbY2 = centerY + Math.sin(orbitAngle2) * orbitRadius;

      const gradMoon = ctx.createRadialGradient(orbX2, orbY2, 0, orbX2, orbY2, 14);
      gradMoon.addColorStop(0, interpolateColor('wave3', 0.65, tProgress));
      gradMoon.addColorStop(1, interpolateColor('wave3', 0, tProgress));
      ctx.fillStyle = gradMoon;
      ctx.beginPath();
      ctx.arc(orbX2, orbY2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // =========================================================================
      // 4. FLOATING NUTRITION / MACRO PARTICLES WITH SMOOTH FILAMENTS
      // =========================================================================
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Smooth physics with delta time
        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;

        // Wrap around smoothly with edge fade
        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;
        if (p.y < -30) p.y = height + 30;
        if (p.y > height + 30) p.y = -30;

        // Soft pulsating size
        const currentRadius =
          p.baseRadius + Math.sin(totalTime * p.pulseSpeed * 60 + p.pulseOffset) * 0.75;

        // Soft Inter-Particle Filament Connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 125) {
            const lineAlpha = (1 - dist / 125) * 0.11;
            ctx.beginPath();
            ctx.moveTo(p.x + mouseShiftX * 0.25, p.y + mouseShiftY * 0.25);
            ctx.lineTo(p2.x + mouseShiftX * 0.25, p2.y + mouseShiftY * 0.25);
            ctx.strokeStyle = interpolateColor('filament', lineAlpha, tProgress);
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Draw particle node
        ctx.save();
        const px = p.x + mouseShiftX * 0.25;
        const py = p.y + mouseShiftY * 0.25;

        // Soft Outer Glow Halo
        const grad = ctx.createRadialGradient(px, py, 0, px, py, currentRadius * 3.2);
        grad.addColorStop(0, interpolateColor(p.type, p.alpha * 0.9, tProgress));
        grad.addColorStop(1, interpolateColor(p.type, 0, tProgress));

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, currentRadius * 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Core Solid Dot
        ctx.fillStyle = interpolateColor(p.type, Math.min(p.alpha * 1.6, 0.95), tProgress);
        ctx.beginPath();
        ctx.arc(px, py, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', setupCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10"
      aria-hidden="true"
    >
      {/* 1. Deep Atmospheric Gradient Blooms (Silky multi-layer CSS glow with 800ms transition) */}
      <div className="absolute inset-0 opacity-75 transition-opacity duration-1000">
        {/* Top-Left: Cyan / Water Balance Ambient Bloom */}
        <div
          className={`absolute -top-36 -left-36 w-[44rem] h-[44rem] rounded-full blur-[135px] mix-blend-screen transition-all duration-1000 animate-metabolic-float-1 ${
            isDark
              ? 'bg-gradient-to-tr from-cyan-600/20 via-blue-600/18 to-teal-500/12'
              : 'bg-gradient-to-tr from-cyan-300/35 via-blue-200/30 to-teal-200/25'
          }`}
        />

        {/* Top-Right: Calorie & Metabolic Fire Glow */}
        <div
          className={`absolute -top-24 -right-32 w-[46rem] h-[46rem] rounded-full blur-[145px] mix-blend-screen transition-all duration-1000 animate-metabolic-float-2 ${
            isDark
              ? 'bg-gradient-to-bl from-amber-500/20 via-orange-500/18 to-rose-600/12'
              : 'bg-gradient-to-bl from-amber-200/45 via-orange-100/35 to-rose-200/25'
          }`}
        />

        {/* Bottom-Center: Vitality & Recovery Emerald Glow */}
        <div
          className={`absolute -bottom-44 left-1/4 w-[48rem] h-[48rem] rounded-full blur-[150px] mix-blend-screen transition-all duration-1000 animate-metabolic-float-3 ${
            isDark
              ? 'bg-gradient-to-t from-emerald-600/18 via-teal-500/14 to-indigo-600/10'
              : 'bg-gradient-to-t from-emerald-200/35 via-teal-100/30 to-indigo-100/20'
          }`}
        />

        {/* Center: Soft Circadian Breathing Core */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[54rem] h-[34rem] rounded-[100%] blur-[155px] mix-blend-screen transition-all duration-1000 animate-circadian-pulse ${
            isDark
              ? 'bg-gradient-to-r from-purple-600/12 via-blue-600/12 to-amber-500/10'
              : 'bg-gradient-to-r from-purple-200/25 via-blue-100/25 to-amber-100/20'
          }`}
        />
      </div>

      {/* 2. Interactive High-Performance High-DPI Canvas Engine */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      {/* 3. Subtle Perspective Grid with Organic Radial Fade */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_45%,#000_65%,transparent_100%)] animate-grid-drift"
      />

      {/* 4. Elegant Passing Light Streak (Active Energy Shimmer) */}
      <div className="absolute top-1/4 -left-32 w-[38rem] h-[2px] bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent blur-[1px] -rotate-12 animate-light-glide" />
      <div className="absolute top-2/3 -right-32 w-[34rem] h-[2px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent blur-[1px] rotate-25 animate-light-glide-delayed" />
    </div>
  );
};
