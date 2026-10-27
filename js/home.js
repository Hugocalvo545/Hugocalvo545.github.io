(() => {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("menu");

  const closeMenu = () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
    });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  }

  const bar = document.querySelector(".mobilebar");
  const contact = document.getElementById("contacto");
  if (bar && contact && "IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => bar.classList.toggle("is-hidden", entry.isIntersecting),
      { threshold: 0.12 }
    ).observe(contact);
  }
  const lightbox = document.getElementById("case-lightbox");
  const lightboxImg = document.getElementById("case-lightbox-img");
  const lightboxClose = lightbox?.querySelector(".case-lightbox__close");

  if (lightbox && lightboxImg) {
    document.querySelectorAll("[data-lightbox-src]").forEach((btn) => {
      btn.addEventListener("click", () => {
        lightboxImg.src = btn.dataset.lightboxSrc;
        lightboxImg.alt = btn.dataset.lightboxAlt || "";
        if (typeof lightbox.showModal === "function") {
          lightbox.showModal();
        } else {
          lightbox.setAttribute("open", "");
        }
      });
    });

    const closeLightbox = () => {
      if (typeof lightbox.close === "function") {
        lightbox.close();
      } else {
        lightbox.removeAttribute("open");
      }
    };

    lightboxClose?.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Transición de la bienvenida al bajar: el contenido se desvanece hacia arriba
  // y la tarjeta de IA entra subiendo. Va atada al scroll (vuelve atrás al subir).
  const welcome = document.querySelector(".welcome");
  const welcomeContent = welcome && welcome.querySelector(".welcome__content");
  const welcomeHint = welcome && welcome.querySelector(".welcome__scroll");
  const nextBlock = document.getElementById("ejemplo-ia");

  if (welcome && welcomeContent) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ticking = false;

    const applyWelcome = () => {
      ticking = false;
      const h = welcome.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.7)));
      const fade = Math.max(0, 1 - p * 1.4);

      welcomeContent.style.opacity = fade.toFixed(3);
      if (welcomeHint) welcomeHint.style.opacity = Math.max(0, 0.75 - p * 3).toFixed(3);

      if (reducedMotion.matches) {
        // Solo un fundido simple
        welcomeContent.style.transform = "";
        if (nextBlock) {
          nextBlock.style.transform = "";
          nextBlock.style.opacity = "";
        }
        return;
      }

      const eased = p * p * (3 - 2 * p);
      welcomeContent.style.transform = `translate3d(0, ${(-90 * eased).toFixed(1)}px, 0) scale(${(1 - 0.05 * eased).toFixed(4)})`;
      if (nextBlock) {
        nextBlock.style.transform = `translate3d(0, ${((1 - eased) * 64).toFixed(1)}px, 0)`;
        nextBlock.style.opacity = (0.3 + 0.7 * eased).toFixed(3);
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(applyWelcome);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", onScroll);
    applyWelcome();
  }
})();
