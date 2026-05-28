const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const storedTheme = localStorage.getItem("hugo-cv-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

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
  localStorage.setItem("hugo-cv-theme", theme);
  themeToggle?.setAttribute("aria-pressed", String(theme === "dark"));
  updatePdfLinks(theme);
};

setTheme(storedTheme || preferredTheme);

themeToggle?.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;

    try {
      await navigator.clipboard.writeText(value);
      button.dataset.copied = "true";
      button.textContent = "Email copiado";

      window.setTimeout(() => {
        button.dataset.copied = "false";
        button.textContent = value;
      }, 1600);
    } catch {
      window.location.href = `mailto:${value}`;
    }
  });
});
