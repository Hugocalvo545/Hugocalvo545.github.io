document.documentElement.classList.add("js");

const root = document.documentElement;
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = [...document.querySelectorAll(".nav-link")];
const themeToggle = document.querySelector(".theme-toggle");
const progressBar = document.querySelector(".scroll-progress span");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const storedTheme = localStorage.getItem("hugo-portfolio-theme");
const preferredTheme = "dark";

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
  localStorage.setItem("hugo-portfolio-theme", theme);
  themeToggle?.setAttribute("aria-pressed", String(theme === "dark"));
  updatePdfLinks(theme);
};

setTheme(storedTheme || preferredTheme);

themeToggle?.addEventListener("click", () => {
  setTheme(root.dataset.theme === "light" ? "dark" : "light");
});

navToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const updateProgress = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
};

window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

const revealItems = document.querySelectorAll(".reveal-section");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const observedSections = [...document.querySelectorAll(".section-observed")];

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("is-active", isActive);
      });
    });
  }, { rootMargin: "-38% 0px -52% 0px", threshold: 0 });

  observedSections.forEach((section) => sectionObserver.observe(section));
}

const filterButtons = [...document.querySelectorAll(".filter-button")];
const projectCards = [...document.querySelectorAll(".project-card")];

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    projectCards.forEach((card) => {
      const tags = card.dataset.tags || "";
      card.classList.toggle("is-hidden", filter !== "all" && !tags.includes(filter));
    });
  });
});

const rotator = document.querySelector("#role-rotator");

if (rotator && !prefersReducedMotion.matches) {
  const phrases = rotator.dataset.phrases.split("|").filter(Boolean);
  let index = 0;

  window.setInterval(() => {
    index = (index + 1) % phrases.length;
    rotator.classList.add("is-changing");

    window.setTimeout(() => {
      rotator.textContent = phrases[index];
      rotator.classList.remove("is-changing");
    }, 220);
  }, 2500);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    const originalText = button.textContent;

    try {
      await navigator.clipboard.writeText(value);
      button.textContent = document.documentElement.lang === "en" ? "Email copied" : "Email copiado";
      window.setTimeout(() => {
        button.textContent = originalText;
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
    submitButton.textContent = document.documentElement.lang === "en" ? "Sending..." : "Enviando...";
    submitButton.setAttribute("aria-busy", "true");
  });
});

document.querySelectorAll("[data-current-year]").forEach((item) => {
  item.textContent = new Date().getFullYear();
});
