/*
 * Salida del hero al bajar (va junto al salto al hiperespacio de particulas.js).
 * La usan la portada y el portfolio. Va atada al scroll: al volver arriba todo se recompone.
 *
 * Se configura con atributos:
 *   data-warp                   en el hero: activa la transición
 *   data-warp-next="#id"        en el hero: bloque siguiente, que entra subiendo
 *   data-warp-mobile="ligera"   en el hero: en móvil, menos recorrido y sin escala
 *   data-warp-rise              elementos que suben y se desvanecen
 *   data-warp-hint              elementos que se desvanecen enseguida (indicador de bajar)
 *
 * Publica el progreso en hero.warpState y con el evento "warp:progress", que lee particulas.js.
 * Solo toca transform y opacity.
 */
(() => {
  const hero = document.querySelector("[data-warp]");
  if (!hero) return;

  const rise = [...hero.querySelectorAll("[data-warp-rise]")];
  const hints = [...hero.querySelectorAll("[data-warp-hint]")];
  const next = hero.dataset.warpNext ? document.querySelector(hero.dataset.warpNext) : null;
  const lightOnMobile = hero.dataset.warpMobile === "ligera";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 767px)");
  // Opacidad de partida de cada indicador (la de su CSS)
  const hintBase = hints.map((el) => parseFloat(window.getComputedStyle(el).opacity) || 1);
  let ticking = false;

  const apply = () => {
    ticking = false;
    const h = hero.offsetHeight || 1;
    const vh = window.innerHeight || h;
    // Si el hero es más alto que la ventana (portfolio en móvil), la salida empieza cuando se ve su final
    const start = Math.max(0, h - vh);
    const p = Math.min(1, Math.max(0, (window.scrollY - start) / (Math.min(h, vh) * 0.7)));
    const eased = p * p * (3 - 2 * p);
    const reduced = reducedMotion.matches;
    const light = lightOnMobile && mobile.matches;
    const lift = reduced ? 0 : (light ? 50 : 90) * eased;
    const shrink = reduced || light ? 0 : 0.05 * eased;

    rise.forEach((el) => {
      if (p === 0) {
        el.style.opacity = "";
        el.style.transform = "";
        return;
      }
      el.style.opacity = Math.max(0, 1 - p * 1.4).toFixed(3);
      // Con movimiento reducido, solo el fundido
      el.style.transform = reduced ? "" : `translate3d(0, ${(-lift).toFixed(1)}px, 0) scale(${(1 - shrink).toFixed(4)})`;
    });

    hints.forEach((el, i) => {
      el.style.opacity = p === 0 ? "" : (hintBase[i] * Math.max(0, 1 - p * 4)).toFixed(3);
    });

    if (next) {
      if (reduced || eased >= 1) {
        next.style.transform = "";
        next.style.opacity = "";
      } else {
        const enter = light ? 40 : 64;
        next.style.transform = `translate3d(0, ${((1 - eased) * enter).toFixed(1)}px, 0)`;
        next.style.opacity = (0.3 + 0.7 * eased).toFixed(3);
      }
    }

    // scrolled: cuánto ha subido el hero; offset: cuánto suben además sus elementos
    hero.warpState = { p, scrolled: Math.min(h, Math.max(0, window.scrollY)), offset: -lift };
    hero.dispatchEvent(new CustomEvent("warp:progress", { detail: hero.warpState }));
  };

  const onChange = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(apply);
  };

  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange, { passive: true });
  reducedMotion.addEventListener?.("change", onChange);
  mobile.addEventListener?.("change", onChange);
  apply();
})();
