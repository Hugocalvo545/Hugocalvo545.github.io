/*
 * Portfolio de Hugo Calvo García (ES y EN).
 * Sin librerías. Las animaciones solo tocan transform y opacity, y los bucles usan requestAnimationFrame.
 * Con prefers-reduced-motion todo se muestra quieto.
 */
document.documentElement.classList.add("js");

const root = document.documentElement;
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = [...document.querySelectorAll(".nav-link")];
const themeToggle = document.querySelector(".theme-toggle");
const progressBar = document.querySelector(".scroll-progress span");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
// Efectos de cursor solo con ratón o trackpad (nunca en pantallas táctiles)
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const isEnglish = root.lang === "en";
// Animaciones ligadas al scroll en CSS; si no hay soporte, JS ligero hace lo mismo
const supportsScrollTimeline = Boolean(window.CSS && CSS.supports("animation-timeline: view()") && CSS.supports("animation-timeline: scroll()"));
const cssScrollAnimations = () => supportsScrollTimeline && !reducedMotion.matches;
if (!supportsScrollTimeline) root.classList.add("sd-fallback");

/* ---------- Tema ---------- */
const readStoredTheme = () => {
  try {
    return localStorage.getItem("hugo-portfolio-theme");
  } catch {
    return null;
  }
};

const updatePdfLinks = (theme) => {
  document.querySelectorAll("[data-theme-pdf]").forEach((link) => {
    const nextPdf = theme === "dark" ? link.dataset.pdfDark : link.dataset.pdfLight;
    if (!nextPdf) return;
    link.href = nextPdf;
    link.download = nextPdf.split("/").pop();
  });
};

const setTheme = (theme) => {
  root.dataset.theme = theme;
  try {
    localStorage.setItem("hugo-portfolio-theme", theme);
  } catch {
    /* sin almacenamiento: el tema dura lo que la visita */
  }
  themeToggle?.setAttribute("aria-pressed", String(theme === "dark"));
  updatePdfLinks(theme);
};

setTheme(readStoredTheme() || "dark");

themeToggle?.addEventListener("click", () => {
  setTheme(root.dataset.theme === "light" ? "dark" : "light");
});

/* ---------- Menú móvil ---------- */
const closeMenu = () => {
  header.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
};

navToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && header.classList.contains("is-open")) {
    closeMenu();
    navToggle?.focus();
  }
});

/* ---------- Barra de progreso de lectura ---------- */
let progressQueued = false;
const updateProgress = () => {
  progressQueued = false;
  if (cssScrollAnimations()) {
    progressBar.style.transform = "";
    return;
  }
  const maxScroll = root.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
  progressBar.style.transform = `scaleX(${progress.toFixed(4)})`;
};

if (progressBar) {
  window.addEventListener("scroll", () => {
    if (progressQueued) return;
    progressQueued = true;
    window.requestAnimationFrame(updateProgress);
  }, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();
}

/* ---------- Aparición de secciones ---------- */
const revealItems = document.querySelectorAll(".reveal-section");

if (cssScrollAnimations()) {
  // CSS se encarga (animation-timeline: view())
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

/* ---------- Enlace activo del menú ---------- */
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: "-38% 0px -52% 0px", threshold: 0 });

  document.querySelectorAll(".section-observed").forEach((section) => sectionObserver.observe(section));
}

/* ---------- Hero: nombre letra a letra ---------- */
document.querySelectorAll("[data-split-letters]").forEach((heading) => {
  const text = heading.textContent.trim();
  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");
  let index = 0;

  text.split(" ").forEach((word, wordIndex) => {
    if (wordIndex > 0) visual.append(" ");
    const wordSpan = document.createElement("span");
    wordSpan.className = "word";
    [...word].forEach((letter) => {
      const char = document.createElement("span");
      char.className = "char";
      char.style.setProperty("--i", String(index));
      char.textContent = letter;
      wordSpan.append(char);
      index += 1;
    });
    visual.append(wordSpan);
  });

  // El lector de pantalla lee el nombre entero, no letra a letra
  const label = document.createElement("span");
  label.className = "sr-only";
  label.textContent = text;
  heading.replaceChildren(label, visual);
});

// Cuando acaba la entrada, las partículas vuelven a medir dónde están los textos y la foto
window.setTimeout(() => {
  document.dispatchEvent(new CustomEvent("particulas:medir"));
}, reducedMotion.matches ? 0 : 1500);

/* ---------- Hero: línea de rol que se escribe y se borra ---------- */
const rotator = document.querySelector("#role-rotator");

if (rotator) {
  const phrases = (rotator.dataset.phrases || "").split("|").filter(Boolean);
  let phraseIndex = 0;
  let charCount = phrases[0] ? phrases[0].length : 0;
  let deleting = true;
  let timer = 0;
  let heroOnScreen = true;
  let paused = false;

  // Fuente monoespaciada: el ancho de la frase más larga se conoce en ch (más el prompt y el cursor)
  const longest = Math.max(...phrases.map((p) => p.length), 0);
  rotator.parentElement?.style.setProperty("--rotator-width", `${longest + 3}ch`);

  const step = () => {
    // Fuera de pantalla no se escribe: se retoma al volver
    if (!heroOnScreen) {
      paused = true;
      return;
    }
    const phrase = phrases[phraseIndex];
    if (deleting) {
      charCount -= 1;
      rotator.textContent = phrase.slice(0, charCount);
      if (charCount <= 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        timer = window.setTimeout(step, 380);
        return;
      }
      timer = window.setTimeout(step, 24);
      return;
    }

    charCount += 1;
    rotator.textContent = phrase.slice(0, charCount);
    if (charCount >= phrase.length) {
      deleting = true;
      timer = window.setTimeout(step, 2200);
      return;
    }
    timer = window.setTimeout(step, 48 + Math.random() * 40);
  };

  const start = () => {
    window.clearTimeout(timer);
    if (reducedMotion.matches || phrases.length < 2) {
      rotator.textContent = phrases[0] || rotator.textContent;
      return;
    }
    // Empieza tras la entrada del hero con la primera frase ya escrita
    timer = window.setTimeout(step, 2600);
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      heroOnScreen = entries[0].isIntersecting;
      if (heroOnScreen && paused) {
        paused = false;
        timer = window.setTimeout(step, 400);
      }
    }).observe(rotator.closest(".hero") || rotator);
  }

  reducedMotion.addEventListener?.("change", start);
  start();
}

/* ---------- Botones magnéticos ---------- */
const magnets = [...document.querySelectorAll("[data-magnetic]")];

const setupMagnets = () => {
  if (!finePointer.matches || reducedMotion.matches) return;

  magnets.forEach((button) => {
    const label = button.firstElementChild;
    const state = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };
    button.classList.add("is-magnetic");

    const loop = () => {
      state.x += (state.tx - state.x) * 0.2;
      state.y += (state.ty - state.y) * 0.2;
      button.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0)`;
      if (label) label.style.transform = `translate3d(${(state.x * 0.35).toFixed(2)}px, ${(state.y * 0.35).toFixed(2)}px, 0)`;
      const settled = Math.abs(state.tx - state.x) < 0.05 && Math.abs(state.ty - state.y) < 0.05;
      if (settled && state.tx === 0 && state.ty === 0) {
        button.style.transform = "";
        if (label) label.style.transform = "";
        state.raf = 0;
        return;
      }
      state.raf = window.requestAnimationFrame(loop);
    };

    const kick = () => {
      if (!state.raf) state.raf = window.requestAnimationFrame(loop);
    };

    button.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      const rect = button.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      // Se acerca al cursor como mucho unos 10 px
      state.tx = Math.max(-12, Math.min(12, dx * 0.3));
      state.ty = Math.max(-10, Math.min(10, dy * 0.4));
      kick();
    });

    button.addEventListener("pointerleave", () => {
      state.tx = 0;
      state.ty = 0;
      kick();
    });
  });
};

setupMagnets();

/* ---------- Entrada escalonada ---------- */
// Los elementos que entran juntos en pantalla aparecen uno detrás de otro
const staggerItems = [...document.querySelectorAll("[data-stagger] > *")];

if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const staggerObserver = new IntersectionObserver((entries) => {
    const entering = entries
      .filter((entry) => entry.isIntersecting)
      .map((entry) => entry.target)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

    entering.forEach((item, order) => {
      item.style.setProperty("--stagger-delay", `${order * 110}ms`);
      item.classList.add("is-in");
      staggerObserver.unobserve(item);
      // Sin retraso después, para que los efectos de cursor respondan al momento
      window.setTimeout(() => item.style.removeProperty("--stagger-delay"), 1000 + order * 110);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });

  staggerItems.forEach((item) => staggerObserver.observe(item));
} else {
  staggerItems.forEach((item) => item.classList.add("is-in"));
}

/* ---------- Tarjetas: inclinación 3D y brillo que sigue al cursor ---------- */
const setupTilt = () => {
  if (!finePointer.matches || reducedMotion.matches) return;

  document.querySelectorAll(".product-card").forEach((card) => {
    const spot = document.createElement("span");
    spot.className = "card-spotlight";
    spot.setAttribute("aria-hidden", "true");
    card.prepend(spot);
    card.classList.add("is-tilt");

    const state = { rx: 0, ry: 0, trx: 0, try: 0, sx: 0, sy: 0, raf: 0, rect: null };

    const loop = () => {
      state.rx += (state.trx - state.rx) * 0.14;
      state.ry += (state.try - state.ry) * 0.14;
      const lift = Math.min(1, (Math.abs(state.rx) + Math.abs(state.ry)) / 6);
      card.style.transform = `perspective(1100px) rotateX(${state.rx.toFixed(3)}deg) rotateY(${state.ry.toFixed(3)}deg) scale(${(1 + lift * 0.015).toFixed(4)})`;
      spot.style.transform = `translate3d(${state.sx.toFixed(1)}px, ${state.sy.toFixed(1)}px, 0)`;

      const settled = Math.abs(state.trx - state.rx) < 0.01 && Math.abs(state.try - state.ry) < 0.01;
      if (settled && state.trx === 0 && state.try === 0) {
        card.style.transform = "";
        card.style.willChange = "";
        state.raf = 0;
        return;
      }
      state.raf = window.requestAnimationFrame(loop);
    };

    const kick = () => {
      if (!state.raf) state.raf = window.requestAnimationFrame(loop);
    };

    card.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      // Se mide una vez al entrar: nada de lecturas de maquetación en cada movimiento
      state.rect = card.getBoundingClientRect();
      card.style.willChange = "transform";
      card.classList.add("is-hot");
    });

    card.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      if (!state.rect) state.rect = card.getBoundingClientRect();
      const x = event.clientX - state.rect.left;
      const y = event.clientY - state.rect.top;
      const nx = x / state.rect.width - 0.5;
      const ny = y / state.rect.height - 0.5;
      state.trx = -ny * 7;
      state.try = nx * 9;
      state.sx = x;
      state.sy = y;
      kick();
    });

    card.addEventListener("tilt:remeasure", () => {
      state.rect = null;
    });

    card.addEventListener("pointerleave", () => {
      state.trx = 0;
      state.try = 0;
      state.rect = null;
      card.classList.remove("is-hot");
      kick();
    });
  });

  // Al hacer scroll la tarjeta se mueve bajo el cursor: se vuelve a medir
  window.addEventListener("scroll", () => {
    document.querySelectorAll(".product-card.is-hot").forEach((card) => card.dispatchEvent(new Event("tilt:remeasure")));
  }, { passive: true });
};

setupTilt();

/* ---------- Línea de tiempo: alternativa sin scroll-driven animations ---------- */
const timeline = document.querySelector("[data-timeline]");

if (timeline && !supportsScrollTimeline) {
  const fill = timeline.querySelector(".timeline-fill");
  const items = [...timeline.querySelectorAll(".timeline-item")];

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-reached"));
  } else {
    // La línea crece con el scroll mientras la lista cruza el 65 % de la ventana
    let queued = false;
    let active = false;
    const draw = () => {
      queued = false;
      const rect = timeline.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.65 - rect.top) / rect.height));
      fill.style.transform = `scaleY(${progress.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!active || queued) return;
      queued = true;
      window.requestAnimationFrame(draw);
    };
    new IntersectionObserver((entries) => {
      active = entries[0].isIntersecting;
      if (active) onScroll();
    }).observe(timeline);
    window.addEventListener("scroll", onScroll, { passive: true });
    draw();

    // Cada hito se enciende al cruzar la misma línea (y se apaga al volver a subir)
    const itemObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const passed = entry.isIntersecting || entry.boundingClientRect.top < 0;
        entry.target.classList.toggle("is-reached", passed);
      });
    }, { rootMargin: "0px 0px -35% 0px", threshold: 0 });
    items.forEach((item) => itemObserver.observe(item));
  }
}

/* ---------- Cifras que cuentan hacia arriba ---------- */
const counters = [...document.querySelectorAll("[data-count-to]")];

if (counters.length && "IntersectionObserver" in window && !reducedMotion.matches) {
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const run = (el) => {
    const target = Number(el.dataset.countTo) || 0;
    const duration = 1400 + target * 60;
    let start = 0;
    let shown = -1;
    const frame = (now) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      const value = Math.round(easeOut(t) * target);
      // Solo se toca el DOM cuando cambia la cifra
      if (value !== shown) {
        shown = value;
        el.textContent = String(value);
      }
      if (t < 1) window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      counterObserver.unobserve(entry.target);
      run(entry.target);
    });
  }, { threshold: 0.6 });

  counters.forEach((el) => {
    // Sin JS se ve la cifra final; con JS empieza en 0 y cuenta al aparecer
    el.textContent = "0";
    counterObserver.observe(el);
  });
}

/* ---------- Contacto ---------- */
document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    const label = button.querySelector("span") || button;
    const originalText = label.textContent;

    try {
      await navigator.clipboard.writeText(value);
      label.textContent = isEnglish ? "Email copied" : "Email copiado";
      window.setTimeout(() => {
        label.textContent = originalText;
      }, 1500);
    } catch {
      window.location.href = `mailto:${value}`;
    }
  });
});

document.querySelectorAll(".contact-form").forEach((form) => {
  form.addEventListener("submit", () => {
    const submitButton = form.querySelector("button[type='submit']");
    if (!submitButton) return;
    const label = submitButton.querySelector("span") || submitButton;
    label.textContent = isEnglish ? "Sending..." : "Enviando...";
    submitButton.setAttribute("aria-busy", "true");
  });
});

document.querySelectorAll("[data-current-year]").forEach((item) => {
  item.textContent = new Date().getFullYear();
});
