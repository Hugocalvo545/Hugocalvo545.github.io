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
})();
