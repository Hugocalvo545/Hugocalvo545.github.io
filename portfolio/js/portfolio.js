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

if ("IntersectionObserver" in window && !reducedMotion.matches) {
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

  const step = () => {
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
