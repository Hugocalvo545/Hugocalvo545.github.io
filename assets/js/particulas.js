(() => {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const canvas = document.createElement("canvas");
  canvas.className = "hero-particles";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "-1",
    display: "block"
  });

  const computedHeroPos = window.getComputedStyle(hero).position;
  if (computedHeroPos === "static") {
    hero.style.position = "relative";
  }
  hero.style.isolation = "isolate";
  hero.prepend(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let isMobile = false;
  let particles = [];
  let textBoxes = [];
  let rafId = 0;
  let isRunning = false;

  const pointer = {
    x: 0,
    y: 0,
    active: false,
    lastMove: 0
  };

  const center = {
    x: 0,
    y: 0,
    restX: 0,
    restY: 0
  };

  let palette = {
    primary: [45, 212, 191],
    secondary: [249, 115, 22],
    baseAlpha: 0.72,
    textMinAlpha: 0.16
  };

  const parseHexOrRgb = (raw, fallback) => {
    const val = (raw || "").trim();
    if (val.startsWith("#")) {
      const hex = val.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16)
        ];
      }
      if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
      }
    }
    const match = val.match(/\d+/g);
    if (match && match.length >= 3) {
      return [Number(match[0]), Number(match[1]), Number(match[2])];
    }
    return fallback;
  };

  const updateThemePalette = () => {
    const rootStyle = window.getComputedStyle(document.documentElement);
    const isLight = document.documentElement.dataset.theme === "light";

    const accentRaw = rootStyle.getPropertyValue("--accent");
    const warmRaw = rootStyle.getPropertyValue("--warm");

    const defaultPrimary = isLight ? [15, 118, 110] : [61, 220, 151];
    const defaultSecondary = isLight ? [234, 88, 12] : [56, 189, 248];

    palette = {
      primary: parseHexOrRgb(accentRaw, defaultPrimary),
      secondary: warmRaw.trim()
        ? parseHexOrRgb(warmRaw, defaultSecondary)
        : defaultSecondary,
      baseAlpha: isLight ? 0.62 : 0.76,
      textMinAlpha: isLight ? 0.14 : 0.18
    };
  };

  const measureTextZones = () => {
    const heroRect = hero.getBoundingClientRect();
    const selectors = "h1, .lead, .hero-subtitle, .cta, .hero-actions, .ai, .hero-facts";
    const nodes = hero.querySelectorAll(selectors);
    textBoxes = [];

    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      textBoxes.push({
        left: rect.left - heroRect.left - 18,
        top: rect.top - heroRect.top - 14,
        right: rect.right - heroRect.left + 18,
        bottom: rect.bottom - heroRect.top + 14
      });
    });
  };

  const buildParticles = () => {
    particles = [];
    const minDim = Math.min(width, height);
    const maxRadius = Math.max(width, height) * (isMobile ? 0.56 : 0.52);
    const minRadius = Math.max(38, minDim * 0.11);
    const ringCount = isMobile ? 5 : 9;

    for (let r = 0; r < ringCount; r += 1) {
      const ringNorm = ringCount > 1 ? r / (ringCount - 1) : 0;
      const radius = minRadius + ringNorm * (maxRadius - minRadius);
      const count = isMobile
        ? 11 + r * 4
        : 16 + Math.round(r * 5.5);

      for (let i = 0; i < count; i += 1) {
        const angleOffset = (r % 2) * (Math.PI / count);
        const baseAngle = (i / count) * Math.PI * 2 + angleOffset;
        const colorMix = Math.min(
          1,
          Math.max(0, ringNorm * 0.75 + (Math.sin(baseAngle * 2) * 0.5 + 0.5) * 0.25)
        );

        particles.push({
          ringIndex: r,
          ringNorm,
          baseRadius: radius,
          baseAngle,
          length: isMobile ? 9 + ringNorm * 5 : 11 + ringNorm * 8,
          thickness: isMobile ? 1.8 : 2.1,
          colorMix,
          dx: 0,
          dy: 0,
          vx: 0,
          vy: 0
        });
      }
    }
  };

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    isMobile = window.innerWidth < 768;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    center.restX = isMobile ? width * 0.5 : width * 0.52;
    center.restY = isMobile ? height * 0.38 : height * 0.48;
    if (!center.x && !center.y) {
      center.x = center.restX;
      center.y = center.restY;
    }

    updateThemePalette();
    measureTextZones();
    buildParticles();

    if (reducedMotionQuery.matches) {
      renderFrame(0, true);
    }
  };

  const getTextAttenuation = (x, y) => {
    for (let i = 0; i < textBoxes.length; i += 1) {
      const box = textBoxes[i];
      if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
        const edgeDist = Math.min(
          x - box.left,
          box.right - x,
          y - box.top,
          box.bottom - y
        );
        const fadeZone = 32;
        if (edgeDist >= fadeZone) {
          return palette.textMinAlpha;
        }
        const t = Math.max(0, edgeDist / fadeZone);
        return palette.baseAlpha * (1 - t) + palette.textMinAlpha * t;
      }
    }
    return palette.baseAlpha;
  };

  const renderFrame = (timestamp, staticMode = false) => {
    ctx.clearRect(0, 0, width, height);

    const now = performance.now();
    const pointerIdle = now - pointer.lastMove > 2200;
    const isPointerEngaged = pointer.active && !pointerIdle && !staticMode;

    const targetCenterX = isPointerEngaged
      ? center.restX + (pointer.x - center.restX) * 0.28
      : center.restX;
    const targetCenterY = isPointerEngaged
      ? center.restY + (pointer.y - center.restY) * 0.28
      : center.restY;

    if (staticMode) {
      center.x = center.restX;
      center.y = center.restY;
    } else {
      center.x += (targetCenterX - center.x) * 0.065;
      center.y += (targetCenterY - center.y) * 0.065;
    }

    const repulseRadius = isMobile ? 95 : 135;
    const repulseRadiusSq = repulseRadius * repulseRadius;

    ctx.lineCap = "round";

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];

      const breathOffset = staticMode
        ? 0
        : Math.sin(timestamp * 0.0017 - p.ringNorm * 1.6) * (isMobile ? 8 : 14);
      const angleDrift = staticMode
        ? 0
        : Math.sin(timestamp * 0.00055 + p.ringIndex * 0.45) * 0.07;

      const currentRadius = p.baseRadius + breathOffset;
      const currentAngle = p.baseAngle + angleDrift;

      const homeX = center.x + Math.cos(currentAngle) * currentRadius;
      const homeY = center.y + Math.sin(currentAngle) * currentRadius;

      if (!staticMode) {
        if (isPointerEngaged) {
          const curX = homeX + p.dx;
          const curY = homeY + p.dy;
          const distX = curX - pointer.x;
          const distY = curY - pointer.y;
          const distSq = distX * distX + distY * distY;

          if (distSq < repulseRadiusSq && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / repulseRadius) * (isMobile ? 2.1 : 2.8);
            p.vx += (distX / dist) * force;
            p.vy += (distY / dist) * force;
          }
        }

        // Elastic spring back to home position
        p.vx += -p.dx * 0.075;
        p.vy += -p.dy * 0.075;
        p.vx *= 0.84;
        p.vy *= 0.84;
        p.dx += p.vx;
        p.dy += p.vy;
      }

      const px = homeX + p.dx;
      const py = homeY + p.dy;

      // Orient each elongated dash toward the field center
      const orientAngle = Math.atan2(center.y - py, center.x - px);
      const halfLen = p.length * 0.5;
      const cosA = Math.cos(orientAngle) * halfLen;
      const sinA = Math.sin(orientAngle) * halfLen;

      const x1 = px - cosA;
      const y1 = py - sinA;
      const x2 = px + cosA;
      const y2 = py + sinA;

      const r = Math.round(
        palette.primary[0] + (palette.secondary[0] - palette.primary[0]) * p.colorMix
      );
      const g = Math.round(
        palette.primary[1] + (palette.secondary[1] - palette.primary[1]) * p.colorMix
      );
      const b = Math.round(
        palette.primary[2] + (palette.secondary[2] - palette.primary[2]) * p.colorMix
      );

      const alpha = getTextAttenuation(px, py) * (0.55 + (1 - p.ringNorm) * 0.45);

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = p.thickness;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  const tick = (timestamp) => {
    if (!isRunning) return;
    renderFrame(timestamp, false);
    rafId = window.requestAnimationFrame(tick);
  };

  const startLoop = () => {
    if (reducedMotionQuery.matches || document.hidden || isRunning) return;
    isRunning = true;
    rafId = window.requestAnimationFrame(tick);
  };

  const stopLoop = () => {
    isRunning = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const updatePointerFromEvent = (clientX, clientY) => {
    const rect = hero.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      pointer.active = false;
      return;
    }
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;
    pointer.active = true;
    pointer.lastMove = performance.now();
  };

  window.addEventListener(
    "mousemove",
    (e) => {
      updatePointerFromEvent(e.clientX, e.clientY);
    },
    { passive: true }
  );

  hero.addEventListener(
    "mouseleave",
    () => {
      pointer.active = false;
    },
    { passive: true }
  );

  hero.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 0) {
        updatePointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  hero.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 0) {
        updatePointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  hero.addEventListener(
    "touchend",
    () => {
      pointer.active = false;
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopLoop();
    } else {
      startLoop();
    }
  });

  window.addEventListener("resize", resize, { passive: true });

  reducedMotionQuery.addEventListener("change", () => {
    if (reducedMotionQuery.matches) {
      stopLoop();
      renderFrame(0, true);
    } else {
      startLoop();
    }
  });

  const themeObserver = new MutationObserver(() => {
    updateThemePalette();
    if (reducedMotionQuery.matches) {
      renderFrame(0, true);
    }
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });

  resize();
  startLoop();
})();
