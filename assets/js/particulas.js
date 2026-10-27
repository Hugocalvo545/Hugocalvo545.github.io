/*
 * Campo de partículas del hero (canvas 2D, sin librerías).
 * Guiones cortos con puntas redondeadas, orientados hacia un centro que sigue al puntero.
 * El color depende del ángulo alrededor del centro; el tamaño y la opacidad, de la distancia.
 * Con data-warp en el hero, al bajar los guiones se estiran hacia fuera y se desvanecen (salto al hiperespacio).
 */
(() => {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const canvas = document.createElement("canvas");
  canvas.className = "hero-particles";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    top: "0",
    left: "0",
    height: "100%",
    pointerEvents: "none",
    zIndex: "-1",
    display: "block"
  });

  if (window.getComputedStyle(hero).position === "static") {
    hero.style.position = "relative";
  }
  hero.style.isolation = "isolate";
  hero.prepend(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Paleta de la marca (en círculo): verde, verdes azulados, cianes y algún azul
  const PALETTE_DARK = ["#3ddc97", "#34d3b0", "#2dd4bf", "#22d3ee", "#38bdf8", "#3b82f6", "#22d3ee", "#14b8a6"];
  const PALETTE_LIGHT = ["#0f766e", "#0d9488", "#0e7490", "#0891b2", "#0284c7", "#2563eb", "#0891b2", "#0f766e"];
  const LUT_SIZE = 180;
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const TAU = Math.PI * 2;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let isMobile = false;
  let particles = [];
  let textBoxes = [];
  let colorLut = [];
  let theme = { light: false, alphaMax: 0.9, textMin: 0.22 };
  let rafId = 0;
  let isRunning = false;
  let heroVisible = true;
  let lastTime = 0;
  let elapsed = 0;
  let rotation = 0;
  let builtWidth = 0;
  let builtHeight = 0;
  // Posición del borde izquierdo del canvas respecto a la ventana
  let originX = 0;
  let heroTop = 0;

  // Centro de reposo del campo (fracciones del ancho y alto), configurable con data-particles-center="x,y"
  const centerAttr = (hero.dataset.particlesCenter || "").split(",").map(Number);
  const customCenter = centerAttr.length === 2 && centerAttr.every((n) => n >= 0 && n <= 1) ? centerAttr : null;

  // Salto al hiperespacio controlado por el scroll
  const warpEnabled = hero.hasAttribute("data-warp");
  let warp = 0;
  let warpTarget = 0;
  let scrolled = 0;
  if (warpEnabled) {
    // Borde inferior difuminado: las estelas no se cortan en seco al bajar
    const mask = "linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%)";
    canvas.style.webkitMaskImage = mask;
    canvas.style.maskImage = mask;
  }

  const pointer = { x: 0, y: 0, active: false };
  const center = { x: 0, y: 0, restX: 0, restY: 0 };
  const field = { ringR: 200, ringW: 120, wavelength: 150, maxR: 400 };

  const hexToRgb = (hex) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  const parseColor = (raw) => {
    const val = (raw || "").trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val)) return hexToRgb(val);
    const m = val.match(/\d+(\.\d+)?/g);
    return m && m.length >= 3 ? [Number(m[0]), Number(m[1]), Number(m[2])] : null;
  };

  const updateTheme = () => {
    const rootStyle = window.getComputedStyle(document.documentElement);
    const bg = parseColor(rootStyle.getPropertyValue("--bg"));
    const luminance = bg ? (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255 : 0;
    const light = luminance > 0.5;

    const stops = (light ? PALETTE_LIGHT : PALETTE_DARK).map(hexToRgb);
    // El primer color es el acento de la página si existe
    const accent = parseColor(rootStyle.getPropertyValue("--accent"));
    if (accent) stops[0] = accent;

    colorLut = new Array(LUT_SIZE);
    for (let i = 0; i < LUT_SIZE; i += 1) {
      const pos = (i / LUT_SIZE) * stops.length;
      const a = stops[Math.floor(pos) % stops.length];
      const b = stops[(Math.floor(pos) + 1) % stops.length];
      const t = pos - Math.floor(pos);
      const s = t * t * (3 - 2 * t);
      colorLut[i] = `rgb(${Math.round(a[0] + (b[0] - a[0]) * s)}, ${Math.round(a[1] + (b[1] - a[1]) * s)}, ${Math.round(a[2] + (b[2] - a[2]) * s)})`;
    }

    theme = {
      light,
      alphaMax: light ? 0.85 : 0.92,
      textMin: light ? 0.18 : 0.24
    };
  };

  const measureTextZones = () => {
    const heroRect = hero.getBoundingClientRect();
    const baseX = originX;
    const nodes = hero.querySelectorAll("h1, .lead, .welcome__tagline, .hero-subtitle, .hero-rotator, .cta, .hero-actions, .eyebrow, .note, .hero-facts");
    textBoxes = [];
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      textBoxes.push({
        left: rect.left - baseX - 14,
        top: rect.top - heroRect.top - 10,
        right: rect.right - baseX + 14,
        bottom: rect.bottom - heroRect.top + 10
      });
    });
  };

  // Pseudoaleatorio con semilla: al reconstruir, el campo queda igual
  const seeded = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const buildParticles = () => {
    // Círculo alrededor del punto de giro que cubre todas las esquinas aunque el campo gire
    field.maxR = Math.hypot(
      Math.max(center.restX, width - center.restX),
      Math.max(center.restY, height - center.restY)
    ) + 24;
    const circleArea = Math.PI * field.maxR * field.maxR;
    const visibleShare = Math.min(1, (width * height) / circleArea);
    const visibleTarget = isMobile ? 300 : 1050;
    const total = Math.min(isMobile ? 900 : 3200, Math.round(visibleTarget / visibleShare));

    const rand = seeded(20261027);
    particles = new Array(total);
    for (let i = 0; i < total; i += 1) {
      // Espiral de Vogel con algo de ruido: reparto uniforme de borde a borde
      const r = field.maxR * Math.sqrt((i + 0.5) / total) * (0.97 + rand() * 0.06);
      const a = i * GOLDEN_ANGLE + (rand() - 0.5) * 0.35;
      particles[i] = {
        r,
        a,
        jitter: 0.8 + rand() * 0.4,
        hueOffset: (rand() - 0.5) * 0.06
      };
    }

    const minDim = Math.min(width, height);
    field.ringR = minDim * (isMobile ? 0.34 : 0.42);
    field.ringW = field.ringR * 0.62;
    field.wavelength = isMobile ? 110 : 150;
    builtWidth = width;
    builtHeight = height;
  };

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    // El canvas ocupa todo el ancho de la ventana aunque el hero sea más estrecho (sin scroll horizontal)
    const viewportW = document.documentElement.clientWidth || rect.width;
    originX = 0;
    canvas.style.left = `${-Math.round(rect.left)}px`;
    canvas.style.width = `${viewportW}px`;
    width = Math.max(1, Math.round(viewportW));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    isMobile = window.innerWidth < 768;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (customCenter) {
      center.restX = width * customCenter[0];
      center.restY = height * customCenter[1];
    } else {
      center.restX = width * (isMobile ? 0.5 : 0.62);
      center.restY = height * (isMobile ? 0.42 : 0.5);
    }
    if (!center.x && !center.y) {
      center.x = center.restX;
      center.y = center.restY;
    }

    updateTheme();
    measureTextZones();
    // En móvil la barra del navegador cambia la altura al hacer scroll: solo se reconstruye si cambia mucho
    if (width !== builtWidth || Math.abs(height - builtHeight) > 120 || !particles.length) {
      buildParticles();
    }
    if (reducedMotionQuery.matches || !isRunning) {
      renderFrame(true);
    }
  };

  const textAttenuation = (x, y) => {
    for (let i = 0; i < textBoxes.length; i += 1) {
      const box = textBoxes[i];
      if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
        const edge = Math.min(x - box.left, box.right - x, y - box.top, box.bottom - y);
        const t = Math.min(1, edge / 24);
        return 1 - (1 - theme.textMin) * t;
      }
    }
    return 1;
  };

  const renderFrame = (staticMode) => {
    ctx.clearRect(0, 0, width, height);

    const cx = center.x;
    const cy = center.y;
    const pivotX = center.restX;
    const pivotY = center.restY;
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    const waveT = staticMode ? 0 : elapsed * 1.6;
    const huePhase = staticMode ? 0 : elapsed * 0.012;
    const ringR = field.ringR;
    const invRingW = 1 / field.ringW;
    const waveK = TAU / field.wavelength;
    const lutScale = LUT_SIZE / TAU;
    const margin = 12;

    // Hiperespacio: w va de 0 (reposo) a 1 (salto completo)
    const w = staticMode ? 0 : warp;
    const w2 = w * w;
    const warpFade = w <= 0.55 ? 1 : Math.max(0, 1 - ((w - 0.55) / 0.45) ** 2 * (3 - 2 * ((w - 0.55) / 0.45)));
    const stretchK = isMobile ? 0.16 : 0.26;
    const maxStretch = isMobile ? 90 : 170;
    // El campo baja la mitad de lo que sube el hero para que el centro siga a la vista
    const shiftY = warpEnabled && !staticMode ? scrolled * 0.5 : 0;
    if (warpFade <= 0.01) return;

    ctx.lineCap = "round";

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];

      // Posición base: gira despacio alrededor del centro de reposo
      const bx = Math.cos(p.a) * p.r;
      const by = Math.sin(p.a) * p.r;
      let px = pivotX + bx * cosR - by * sinR;
      let py = pivotY + shiftY + bx * sinR + by * cosR;
      if (w === 0 && (px < -margin || px > width + margin || py < -margin || py > height + margin)) continue;

      // Distancia y dirección hacia el centro que sigue al puntero
      let dx = cx - px;
      let dy = cy + shiftY - py;
      let d = Math.sqrt(dx * dx + dy * dy) || 0.001;
      let ux = dx / d;
      let uy = dy / d;

      // Onda que recorre los anillos hacia fuera
      const wave = Math.sin(d * waveK - waveT);
      px -= ux * wave * 2.2;
      py -= uy * wave * 2.2;

      // Profundidad: máximo en un anillo intermedio, diminutos cerca y lejos del centro
      const off = (d - ringR) * invRingW;
      const depth = Math.exp(-off * off);
      let size = Math.max(0, Math.min(1, (0.08 + 0.92 * depth) * (0.78 + 0.22 * wave) * p.jitter));

      let len = 9 * size;
      let thick = 1.1 + 2.4 * size;
      let tail = 0.5;
      if (w > 0) {
        // Al bajar: todos se convierten en estelas que salen disparadas hacia fuera, cada vez más rápido
        size = size + (0.55 + 0.45 * size - size) * w;
        px -= ux * d * w2 * 1.5;
        py -= uy * d * w2 * 1.5;
        len = 9 * size + Math.min(maxStretch, (d * stretchK + 14) * w2 * 2.2);
        thick = (1.1 + 2.4 * size) * (1 + 0.25 * w);
        tail = 0.5 + 0.5 * w;
        if (px < -len - margin || px > width + len + margin || py < -len - margin || py > height + len + margin) continue;
      }
      const att = textAttenuation(px, py);
      const alpha = (0.14 + 0.86 * size) * theme.alphaMax * (att + (1 - att) * w) * warpFade;
      if (alpha < 0.02) continue;

      // Color según el ángulo alrededor del centro
      let angle = Math.atan2(-dy, -dx) + Math.PI + (p.hueOffset + huePhase) * TAU;
      let idx = Math.floor(angle * lutScale) % LUT_SIZE;
      if (idx < 0) idx += LUT_SIZE;

      // La cabeza apunta hacia fuera y la estela queda hacia el centro
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = colorLut[idx];
      ctx.lineWidth = thick;
      ctx.beginPath();
      ctx.moveTo(px - ux * len * (1 - tail), py - uy * len * (1 - tail));
      ctx.lineTo(px + ux * len * tail, py + uy * len * tail);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const tick = (now) => {
    if (!isRunning) return;
    const dt = Math.min(0.05, lastTime ? (now - lastTime) / 1000 : 0.016);
    lastTime = now;
    elapsed += dt;
    rotation += dt * 0.025;

    // El centro sigue al puntero con inercia; sin puntero, vuelve al reposo
    const targetX = pointer.active ? pointer.x : center.restX;
    const targetY = pointer.active ? pointer.y : center.restY;
    const ease = 1 - Math.pow(0.04, dt);
    center.x += (targetX - center.x) * ease;
    center.y += (targetY - center.y) * ease;
    warp += (warpTarget - warp) * (1 - Math.pow(0.0004, dt));
    if (Math.abs(warpTarget - warp) < 0.001) warp = warpTarget;

    renderFrame(false);
    rafId = window.requestAnimationFrame(tick);
  };

  const startLoop = () => {
    if (reducedMotionQuery.matches || document.hidden || !heroVisible || isRunning) return;
    isRunning = true;
    lastTime = 0;
    rafId = window.requestAnimationFrame(tick);
  };

  const stopLoop = () => {
    isRunning = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const updatePointer = (clientX, clientY) => {
    const rect = hero.getBoundingClientRect();
    heroTop = rect.top;
    if (clientX < originX || clientX > originX + width || clientY < rect.top || clientY > rect.bottom) {
      pointer.active = false;
      return;
    }
    pointer.x = clientX - originX;
    pointer.y = clientY - heroTop;
    pointer.active = true;
  };

  window.addEventListener("pointermove", (e) => updatePointer(e.clientX, e.clientY), { passive: true });
  // El ratón sale de la ventana
  document.documentElement.addEventListener("mouseleave", () => {
    pointer.active = false;
  }, { passive: true });
  hero.addEventListener("touchstart", (e) => {
    if (e.touches.length) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  hero.addEventListener("touchmove", (e) => {
    if (e.touches.length) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  hero.addEventListener("touchend", () => {
    pointer.active = false;
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopLoop();
    } else {
      startLoop();
    }
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  }, { passive: true });

  const onScroll = () => {
    const h = hero.offsetHeight || 1;
    scrolled = Math.min(h, Math.max(0, window.scrollY));
    if (!warpEnabled) return;
    const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.7)));
    if (reducedMotionQuery.matches) {
      // Sin transición: solo un fundido simple del fondo
      warpTarget = 0;
      warp = 0;
      canvas.style.opacity = Math.max(0, 1 - p * 1.4).toFixed(3);
    } else {
      warpTarget = p;
      canvas.style.opacity = "";
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // Pausa la animación cuando el hero sale de pantalla
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) {
        startLoop();
      } else {
        stopLoop();
      }
    }).observe(hero);
  }

  const onMotionChange = () => {
    onScroll();
    if (reducedMotionQuery.matches) {
      stopLoop();
      center.x = center.restX;
      center.y = center.restY;
      renderFrame(true);
    } else {
      startLoop();
    }
  };
  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener("change", onMotionChange);
  } else if (reducedMotionQuery.addListener) {
    reducedMotionQuery.addListener(onMotionChange);
  }

  new MutationObserver(() => {
    updateTheme();
    if (!isRunning) renderFrame(reducedMotionQuery.matches);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // Las fuentes cambian el tamaño de los textos: se vuelven a medir al cargar
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measureTextZones);
  }

  onScroll();
  warp = warpTarget;
  resize();
  startLoop();
})();
