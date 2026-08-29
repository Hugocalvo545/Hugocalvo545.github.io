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
})();
